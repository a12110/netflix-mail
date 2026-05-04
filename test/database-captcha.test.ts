import { describe, expect, it } from "vitest";
import { SESSION_COOKIE } from "../src/constants";
import worker from "../src/index";
import { createSessionValue } from "../src/services/auth";
import { getLoginCaptchaSettings } from "../src/services/captcha-settings";
import type { AdminRow, Env } from "../src/types";

type SqlValue = string | number | null;

const ADMIN: AdminRow = {
  id: 1,
  username: "admin",
  password_hash: "unused",
  status: "active",
  created_at: "2026-05-05T00:00:00.000Z",
  last_login_at: null
};

class MemoryD1Statement {
  private values: SqlValue[] = [];

  constructor(private readonly database: MemoryD1Database, private readonly sql: string) {}

  bind(...values: SqlValue[]): MemoryD1Statement {
    this.values = values;
    return this;
  }

  async run(): Promise<D1Result> {
    return this.database.run(this.sql, this.values);
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    return this.database.all<T>(this.sql);
  }

  async first<T = unknown>(): Promise<T | null> {
    return this.database.first<T>(this.sql, this.values);
  }
}

class MemoryD1Database {
  private readonly tables = new Set<string>();
  private readonly columns = new Map<string, Set<string>>();
  private readonly migrations = new Map<string, string>();
  private captchaSettings: {
    enabled: number;
    provider: string;
    public_params_json: string;
    secret_params_json: string;
  } | null = null;

  prepare(sql: string): MemoryD1Statement {
    return new MemoryD1Statement(this, sql);
  }

  async run(sql: string, values: SqlValue[]): Promise<D1Result> {
    this.applySql(sql, values);
    return { meta: { last_row_id: 1 } } as D1Result;
  }

  async all<T>(sql: string, _values: SqlValue[] = []): Promise<D1Result<T>> {
    if (sql.startsWith("PRAGMA table_info(")) {
      const table = sql.match(/PRAGMA table_info\(([^)]+)\)/)?.[1] ?? "";
      const results = [...(this.columns.get(table) ?? [])].map((name) => ({ name })) as T[];
      return { results } as D1Result<T>;
    }
    if (sql.includes("SELECT id, applied_at FROM schema_migrations")) {
      const results = [...this.migrations].map(([id, applied_at]) => ({ id, applied_at })) as T[];
      return { results } as D1Result<T>;
    }
    if (sql.includes("SELECT id FROM schema_migrations")) {
      const results = [...this.migrations.keys()].map((id) => ({ id })) as T[];
      return { results } as D1Result<T>;
    }
    return { results: [] as T[] } as D1Result<T>;
  }

  async first<T>(sql: string, values: SqlValue[]): Promise<T | null> {
    if (sql.includes("SELECT name FROM sqlite_master")) {
      const name = String(values[0]);
      return (this.tables.has(name) ? { name } : null) as T | null;
    }
    if (sql.includes("SELECT * FROM admins WHERE id")) {
      return ADMIN as T;
    }
    if (sql.includes("FROM login_captcha_settings")) {
      return this.captchaSettings as T | null;
    }
    return null;
  }

  private applySql(sql: string, values: SqlValue[]): void {
    const normalizedSql = sql.trim();
    if (normalizedSql.startsWith("PRAGMA") || normalizedSql.startsWith("CREATE INDEX")) {
      return;
    }
    if (normalizedSql.startsWith("CREATE TABLE IF NOT EXISTS")) {
      this.createTable(normalizedSql);
      return;
    }
    if (normalizedSql.startsWith("ALTER TABLE")) {
      this.addAlteredColumn(normalizedSql);
      return;
    }
    if (normalizedSql.startsWith("INSERT OR IGNORE INTO login_captcha_settings")) {
      this.insertDefaultCaptchaSettings();
      return;
    }
    if (normalizedSql.startsWith("INSERT OR REPLACE INTO schema_migrations")) {
      this.migrations.set(String(values[0]), "2026-05-05T00:00:00.000Z");
    }
  }

  private createTable(sql: string): void {
    const table = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
    if (!table) return;
    this.tables.add(table);
    this.columns.set(table, new Set(KNOWN_COLUMNS[table] ?? []));
  }

  private addAlteredColumn(sql: string): void {
    const match = sql.match(/ALTER TABLE (\w+) ADD COLUMN (\w+)/);
    if (!match) return;
    this.tables.add(match[1]);
    this.columns.set(match[1], this.columns.get(match[1]) ?? new Set());
    this.columns.get(match[1])?.add(match[2]);
  }

  private insertDefaultCaptchaSettings(): void {
    this.captchaSettings ??= {
      enabled: 0,
      provider: "cloudflare_turnstile",
      public_params_json: "{}",
      secret_params_json: "{}"
    };
  }
}

const KNOWN_COLUMNS: Record<string, string[]> = {
  schema_migrations: ["id", "description", "applied_at"],
  admins: ["id", "username", "password_hash", "status", "created_at", "last_login_at"],
  rules: ["id", "enabled"],
  share_links: ["id", "token_hash", "status"],
  login_captcha_settings: [
    "id",
    "enabled",
    "provider",
    "public_params_json",
    "secret_params_json",
    "created_at",
    "updated_at"
  ]
};

describe("login CAPTCHA database migration", () => {
  it("upgrades through the admin API and persists disabled default settings", async () => {
    const db = new MemoryD1Database() as unknown as D1Database;
    const env = { DB: db, SESSION_SECRET: "test-secret" } as Env;
    const session = await createSessionValue(env, ADMIN);
    const request = new Request("http://localhost/api/admin/database/upgrade", {
      method: "POST",
      headers: { Cookie: `${SESSION_COOKIE}=${session}` }
    });

    const response = await worker.fetch(request, env);
    const body = await response.json() as {
      ok: boolean;
      requiredDatabaseVersion: string;
      appliedMigrations: string[];
      migrations: { id: string; applied: boolean }[];
    };
    const settings = await getLoginCaptchaSettings(db);

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.requiredDatabaseVersion).toBe("v0.0.5");
    expect(body.appliedMigrations).toContain("0005_login_captcha_settings");
    expect(body.migrations.at(-1)).toMatchObject({ id: "0005_login_captcha_settings", applied: true });
    expect(settings).toEqual({
      enabled: false,
      provider: "cloudflare_turnstile",
      publicParams: {},
      secretParams: {}
    });
  });
});
