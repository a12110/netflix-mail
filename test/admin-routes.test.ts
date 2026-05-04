import { describe, expect, it } from "vitest";
import { SESSION_COOKIE } from "../src/constants";
import worker from "../src/index";
import { createSessionValue } from "../src/services/auth";
import type { AdminRow, Env } from "../src/types";

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


const CAPTCHA_ADMIN: AdminRow = {
  id: 1,
  username: "admin",
  password_hash: "unused",
  status: "active",
  created_at: "2026-05-05T00:00:00.000Z",
  last_login_at: null
};

function createAdminCaptchaDb(row: CaptchaRow): D1Database {
  return {
    prepare(sql: string) {
      let values: unknown[] = [];
      const statement = {
        bind: (...newValues: unknown[]) => {
          values = newValues;
          return statement;
        },
        first: async () => {
          if (sql.includes("sqlite_master")) {
            return { name: "login_captcha_settings" };
          }
          if (sql.includes("SELECT * FROM admins WHERE id")) {
            return CAPTCHA_ADMIN;
          }
          if (sql.includes("login_captcha_settings")) {
            return row;
          }
          return null;
        },
        run: async () => {
          if (sql.includes("UPDATE login_captcha_settings")) {
            if (sql.includes("SET enabled = 0")) {
              row.enabled = 0;
            } else {
              row.enabled = 1;
              row.provider = String(values[0]);
              row.public_params_json = String(values[1]);
              row.secret_params_json = String(values[2]);
            }
          }
          return { meta: { last_row_id: 1 } };
        },
        all: async () => ({ results: [] })
      };
      return statement;
    }
  } as unknown as D1Database;
}

async function createCaptchaAdminSession(env: Env): Promise<string> {
  return await createSessionValue(env, CAPTCHA_ADMIN);
}

type AdminCaptchaSettingsBody = {
  captcha: {
    enabled: boolean;
    provider: string;
    publicParams: Record<string, unknown>;
    secretParams: Record<string, string>;
  };
};

async function patchAdminCaptchaSettings(
  env: Env,
  session: string,
  body: Record<string, unknown>
): Promise<{ response: Response; text: string; parsed: AdminCaptchaSettingsBody }> {
  const response = await worker.fetch(
    new Request("http://localhost/api/admin/captcha/settings", {
      method: "PATCH",
      headers: captchaAdminHeaders(session),
      body: JSON.stringify(body)
    }),
    env
  );
  const text = await response.text();
  return { response, text, parsed: JSON.parse(text) as AdminCaptchaSettingsBody };
}

async function readAdminCaptchaSettings(env: Env, session: string): Promise<{ response: Response; text: string; parsed: AdminCaptchaSettingsBody }> {
  const response = await worker.fetch(
    new Request("http://localhost/api/admin/captcha/settings", {
      headers: { Cookie: `${SESSION_COOKIE}=${session}` }
    }),
    env
  );
  const text = await response.text();
  return { response, text, parsed: JSON.parse(text) as AdminCaptchaSettingsBody };
}

function captchaAdminHeaders(session: string): Record<string, string> {
  return {
    Cookie: `${SESSION_COOKIE}=${session}`,
    "content-type": "application/json"
  };
}

describe("authenticated admin CAPTCHA settings route", () => {
  it("rejects requests without a valid admin session", async () => {
    const env = {
      DB: createAdminCaptchaDb({
        enabled: 0,
        provider: "cloudflare_turnstile",
        public_params_json: "{}",
        secret_params_json: "{}"
      }),
      SESSION_SECRET: "test-secret"
    } as Env;

    const response = await worker.fetch(new Request("http://localhost/api/admin/captcha/settings"), env);
    const body = await response.json() as { ok: boolean; error?: string };

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
  });

  it("returns the default disabled CAPTCHA settings to a signed-in admin", async () => {
    const env = {
      DB: createAdminCaptchaDb({
        enabled: 0,
        provider: "cloudflare_turnstile",
        public_params_json: "{}",
        secret_params_json: "{}"
      }),
      SESSION_SECRET: "test-secret"
    } as Env;
    const session = await createCaptchaAdminSession(env);

    const response = await worker.fetch(
      new Request("http://localhost/api/admin/captcha/settings", {
        headers: { Cookie: `${SESSION_COOKIE}=${session}` }
      }),
      env
    );
    const body = await response.json() as {
      ok: boolean;
      captcha: { enabled: boolean; provider: string; publicParams: Record<string, unknown>; secretParams: Record<string, string> };
    };

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      captcha: {
        enabled: false,
        provider: "cloudflare_turnstile",
        publicParams: {},
        secretParams: {}
      }
    });
  });

  it("redacts saved secret parameters when returning enabled CAPTCHA settings", async () => {
    const env = {
      DB: createAdminCaptchaDb({
        enabled: 1,
        provider: "hcaptcha",
        public_params_json: JSON.stringify({ siteKey: "site-public" }),
        secret_params_json: JSON.stringify({ secretKey: "stored-secret", apiToken: "raw-token" })
      }),
      SESSION_SECRET: "test-secret"
    } as Env;
    const session = await createCaptchaAdminSession(env);

    const response = await worker.fetch(
      new Request("http://localhost/api/admin/captcha/settings", {
        headers: { Cookie: `${SESSION_COOKIE}=${session}` }
      }),
      env
    );
    const text = await response.text();
    const body = JSON.parse(text) as {
      captcha: { enabled: boolean; provider: string; publicParams: Record<string, unknown>; secretParams: Record<string, string> };
    };

    expect(response.status).toBe(200);
    expect(body.captcha).toEqual({
      enabled: true,
      provider: "hcaptcha",
      publicParams: { siteKey: "site-public" },
      secretParams: { secretKey: "[redacted]", apiToken: "[redacted]" }
    });
    expect(text).not.toContain("stored-secret");
    expect(text).not.toContain("raw-token");
  });

  it("lets a signed-in admin save a disabled CAPTCHA setting without provider parameters", async () => {
    const unrelatedData = { adminSessionShouldRemainValid: true, unrelatedRows: 3 };
    const env = {
      DB: createAdminCaptchaDb({
        enabled: 1,
        provider: "hcaptcha",
        public_params_json: JSON.stringify({ siteKey: "site-public" }),
        secret_params_json: JSON.stringify({ secretKey: "stored-secret" })
      }),
      SESSION_SECRET: "test-secret"
    } as Env;
    const session = await createCaptchaAdminSession(env);
    const headers = {
      Cookie: `${SESSION_COOKIE}=${session}`,
      "content-type": "application/json"
    };

    const updateResponse = await worker.fetch(
      new Request("http://localhost/api/admin/captcha/settings", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ enabled: false })
      }),
      env
    );
    const updateBody = await updateResponse.json() as {
      captcha: { enabled: boolean; provider: string; publicParams: Record<string, unknown>; secretParams: Record<string, string> };
    };
    const readResponse = await worker.fetch(
      new Request("http://localhost/api/admin/captcha/settings", {
        headers: { Cookie: `${SESSION_COOKIE}=${session}` }
      }),
      env
    );
    const readBody = await readResponse.json() as {
      captcha: { enabled: boolean; provider: string; publicParams: Record<string, unknown>; secretParams: Record<string, string> };
    };
    const meResponse = await worker.fetch(
      new Request("http://localhost/api/admin/me", {
        headers: { Cookie: `${SESSION_COOKIE}=${session}` }
      }),
      env
    );
    const publicResponse = await worker.fetch(new Request("http://localhost/api/admin/login/captcha"), env);
    const publicBody = await publicResponse.json() as { captcha: { enabled: boolean; provider?: string; publicParams?: Record<string, unknown> } };

    expect(updateResponse.status).toBe(200);
    expect(updateBody.captcha).toEqual({
      enabled: false,
      provider: "hcaptcha",
      publicParams: { siteKey: "site-public" },
      secretParams: { secretKey: "[redacted]" }
    });
    expect(readResponse.status).toBe(200);
    expect(readBody.captcha.enabled).toBe(false);
    expect(meResponse.status).toBe(200);
    expect(unrelatedData).toEqual({ adminSessionShouldRemainValid: true, unrelatedRows: 3 });
    expect(publicResponse.status).toBe(200);
    expect(publicBody.captcha).toEqual({ enabled: false });
  });

  it("validates and persists Turnstile, hCaptcha, and reCAPTCHA settings", async () => {
    const env = {
      DB: createAdminCaptchaDb({
        enabled: 0,
        provider: "cloudflare_turnstile",
        public_params_json: "{}",
        secret_params_json: "{}"
      }),
      SESSION_SECRET: "test-secret"
    } as Env;
    const session = await createCaptchaAdminSession(env);
    const providers = [
      ["cloudflare_turnstile", "turnstile-site-key", "turnstile-secret-key"],
      ["hcaptcha", "hcaptcha-site-key", "hcaptcha-secret-key"],
      ["google_recaptcha", "recaptcha-site-key", "recaptcha-secret-key"]
    ] as const;

    for (const [provider, siteKey, secretKey] of providers) {
      const update = await patchAdminCaptchaSettings(env, session, {
        enabled: true,
        provider,
        publicParams: { siteKey },
        secretParams: { secretKey }
      });
      const read = await readAdminCaptchaSettings(env, session);

      expect(update.response.status).toBe(200);
      expect(update.parsed.captcha).toEqual({
        enabled: true,
        provider,
        publicParams: { siteKey },
        secretParams: { secretKey: "[redacted]" }
      });
      expect(read.response.status).toBe(200);
      expect(read.parsed.captcha).toEqual(update.parsed.captcha);
      expect(update.text).not.toContain(secretKey);
      expect(read.text).not.toContain(secretKey);
    }

    const rejected = await patchAdminCaptchaSettings(env, session, {
      enabled: true,
      provider: "cloudflare_turnstile",
      publicParams: {},
      secretParams: { secretKey: "should-not-save" }
    });
    const afterRejected = await readAdminCaptchaSettings(env, session);

    expect(rejected.response.status).toBe(400);
    expect(afterRejected.response.status).toBe(200);
    expect(afterRejected.parsed.captcha).toEqual({
      enabled: true,
      provider: "google_recaptcha",
      publicParams: { siteKey: "recaptcha-site-key" },
      secretParams: { secretKey: "[redacted]" }
    });
  });
});
