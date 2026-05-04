import { describe, expect, it } from "vitest";
import worker from "../src/index";
import type { Env } from "../src/types";

function createSetupDb(count = 0): { db: D1Database; runCount: () => number } {
  let writes = 0;
  const db = {
    prepare(sql: string) {
      const statement = {
        bind: () => statement,
        first: async () => (sql.includes("COUNT(*)") ? { count } : null),
        run: async () => {
          writes += 1;
          return { meta: { last_row_id: 1 } };
        },
        all: async () => ({ results: [] })
      };
      return statement;
    }
  } as unknown as D1Database;
  return { db, runCount: () => writes };
}

describe("admin setup routes", () => {
  it("rejects whitespace-only usernames before creating the first admin", async () => {
    const { db, runCount } = createSetupDb();
    const request = new Request("http://localhost/api/setup/admin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ setupToken: "setup-secret", username: "   ", password: "longpassword" })
    });

    const response = await worker.fetch(request, { DB: db, ADMIN_SETUP_TOKEN: "setup-secret" } as Env);
    const body = await response.json() as { ok: boolean; error?: string };

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(runCount()).toBe(0);
  });
});


type CaptchaRow = {
  enabled: number;
  provider: string;
  public_params_json?: string | null;
  provider_public_params_json?: string | null;
  params_json?: string | null;
  secret_params_json?: string | null;
};

function createCaptchaDb(row: CaptchaRow | null): D1Database {
  return {
    prepare(sql: string) {
      const statement = {
        bind: () => statement,
        first: async () => {
          if (sql.includes("sqlite_master")) {
            return row === null ? null : { name: "login_captcha_settings" };
          }
          if (sql.includes("login_captcha_settings")) {
            return row;
          }
          return null;
        },
        run: async () => ({ meta: { last_row_id: 1 } }),
        all: async () => ({ results: [] })
      };
      return statement;
    }
  } as unknown as D1Database;
}

describe("public admin login CAPTCHA challenge route", () => {
  it("returns disabled false from the default database state without an admin session", async () => {
    const response = await worker.fetch(
      new Request("http://localhost/api/admin/login/captcha"),
      { DB: createCaptchaDb({
        enabled: 0,
        provider: "cloudflare_turnstile",
        public_params_json: "{}",
        secret_params_json: "{}"
      }) } as Env
    );
    const body = await response.json() as { ok: boolean; captcha: { enabled: boolean; provider?: string } };

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, captcha: { enabled: false } });
  });

  it("returns only public provider fields when CAPTCHA is enabled", async () => {
    const response = await worker.fetch(
      new Request("http://localhost/api/admin/login/captcha"),
      {
        DB: createCaptchaDb({
          enabled: 1,
          provider: "cloudflare_turnstile",
          public_params_json: JSON.stringify({ siteKey: "site-public", secretKey: "stored-secret" }),
          secret_params_json: JSON.stringify({ secretKey: "stored-secret" })
        })
      } as Env
    );
    const text = await response.text();
    const body = JSON.parse(text) as { captcha: { enabled: boolean; provider: string; publicParams: Record<string, unknown> } };

    expect(response.status).toBe(200);
    expect(body.captcha).toEqual({
      enabled: true,
      provider: "cloudflare_turnstile",
      publicParams: { siteKey: "site-public" }
    });
    expect(text).not.toContain("stored-secret");
    expect(text).not.toContain("secretKey");
  });
});
