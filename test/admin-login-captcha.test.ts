import { afterEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE } from "../src/constants";
import worker from "../src/index";
import { hashPassword } from "../src/services/auth";
import type { AdminRow, Env } from "../src/types";

afterEach(() => {
  vi.unstubAllGlobals();
});

const CAPTCHA_ADMIN: AdminRow = {
  id: 1,
  username: "admin",
  password_hash: "unused",
  status: "active",
  created_at: "2026-05-05T00:00:00.000Z",
  last_login_at: null
};

const BASIC_CAPTCHA_VERIFY_CASES = [
  {
    provider: "cloudflare_turnstile",
    secretKey: "turnstile-secret-key",
    verifyUrl: "https://challenges.cloudflare.com/turnstile/v0/siteverify"
  },
  {
    provider: "hcaptcha",
    secretKey: "hcaptcha-secret-key",
    verifyUrl: "https://api.hcaptcha.com/siteverify"
  },
  {
    provider: "google_recaptcha",
    secretKey: "recaptcha-secret-key",
    verifyUrl: "https://www.google.com/recaptcha/api/siteverify"
  }
] as const;

const ADVANCED_CAPTCHA_VERIFY_CASES = [
  {
    provider: "tencent_cloud_captcha",
    verifyUrl: "https://captcha.tencentcloudapi.com/",
    publicParams: { captchaAppId: "tencent-captcha-app-id", appId: "tencent-app-id" },
    secretParams: { secretId: "tencent-secret-id", secretKey: "tencent-secret-key" },
    payload: { ticket: "tencent-ticket", randstr: "tencent-randstr" },
    expectedBody: {
      captchaAppId: "tencent-captcha-app-id",
      appId: "tencent-app-id",
      secretId: "tencent-secret-id",
      secretKey: "tencent-secret-key",
      ticket: "tencent-ticket",
      randstr: "tencent-randstr"
    }
  },
  {
    provider: "alibaba_cloud_captcha_2",
    verifyUrl: "https://captcha.aliyuncs.com/verify",
    publicParams: { captchaId: "aliyun-captcha-id", sceneId: "aliyun-scene-id", prefix: "aliyun-prefix" },
    secretParams: { accessKeyId: "aliyun-access-key-id", accessKeySecret: "aliyun-access-key-secret" },
    payload: { captchaVerifyParam: "aliyun-captcha-verify-param" },
    expectedBody: {
      accessKeyId: "aliyun-access-key-id",
      accessKeySecret: "aliyun-access-key-secret",
      captchaId: "aliyun-captcha-id",
      sceneId: "aliyun-scene-id",
      prefix: "aliyun-prefix",
      captchaVerifyParam: "aliyun-captcha-verify-param"
    }
  },
  {
    provider: "geetest_captcha",
    verifyUrl: "https://gcaptcha4.geetest.com/validate",
    publicParams: { captchaId: "geetest-captcha-id" },
    secretParams: { captchaKey: "geetest-captcha-key" },
    payload: {
      captchaOutput: "geetest-output",
      lotNumber: "geetest-lot-number",
      passToken: "geetest-pass-token",
      genTime: "1700000000"
    },
    expectedBody: {
      captchaId: "geetest-captcha-id",
      captchaKey: "geetest-captcha-key",
      captchaOutput: "geetest-output",
      lotNumber: "geetest-lot-number",
      passToken: "geetest-pass-token",
      genTime: "1700000000"
    }
  }
] as const;

interface CaptchaRow {
  enabled: number;
  provider: string;
  public_params_json: string;
  secret_params_json: string;
}

interface CaptchaLoginDbState {
  authLookups: number;
  lastLoginUpdates: number;
}

function createCaptchaLoginDb(row: CaptchaRow, admin: AdminRow, state: CaptchaLoginDbState): D1Database {
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
          if (sql.includes("login_captcha_settings")) {
            return row;
          }
          if (sql.includes("SELECT * FROM admins WHERE username")) {
            state.authLookups += 1;
            return values[0] === admin.username ? admin : null;
          }
          return null;
        },
        run: async () => {
          if (sql.includes("UPDATE admins SET last_login_at")) {
            state.lastLoginUpdates += 1;
          }
          return { meta: { last_row_id: 1 } };
        },
        all: async () => ({ results: [] })
      };
      return statement;
    }
  } as unknown as D1Database;
}

async function createCaptchaLoginEnv(provider: string, secretKey: string): Promise<{ env: Env; state: CaptchaLoginDbState }> {
  return createCaptchaLoginEnvWithParams(provider, { siteKey: `${provider}-site-key` }, { secretKey });
}

async function createCaptchaLoginEnvWithParams(
  provider: string,
  publicParams: Record<string, unknown>,
  secretParams: Record<string, unknown>
): Promise<{ env: Env; state: CaptchaLoginDbState }> {
  const state = { authLookups: 0, lastLoginUpdates: 0 };
  const admin = {
    ...CAPTCHA_ADMIN,
    password_hash: await hashPassword("correct-password")
  };
  return {
    env: {
      DB: createCaptchaLoginDb({
        enabled: 1,
        provider,
        public_params_json: JSON.stringify(publicParams),
        secret_params_json: JSON.stringify(secretParams)
      }, admin, state),
      SESSION_SECRET: "test-secret"
    } as Env,
    state
  };
}

function captchaLoginRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "admin",
      password: "correct-password",
      ...body
    })
  });
}

function mockCaptchaVerification(success: boolean): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success }), {
    headers: { "content-type": "application/json" }
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("admin login CAPTCHA token verification", () => {
  it("rejects enabled CAPTCHA login without a token before password authentication", async () => {
    const { env, state } = await createCaptchaLoginEnv("cloudflare_turnstile", "turnstile-secret-key");
    const fetchMock = mockCaptchaVerification(true);

    const response = await worker.fetch(captchaLoginRequest({ captchaToken: "" }), env);
    const body = await response.json() as { ok: boolean; error?: string };

    expect(response.status).toBe(400);
    expect(body).toEqual({ ok: false, error: "CAPTCHA token is required." });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(state.authLookups).toBe(0);
    expect(state.lastLoginUpdates).toBe(0);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("allows password login after successful basic CAPTCHA provider verification", async () => {
    for (const providerCase of BASIC_CAPTCHA_VERIFY_CASES) {
      const { env, state } = await createCaptchaLoginEnv(providerCase.provider, providerCase.secretKey);
      const fetchMock = mockCaptchaVerification(true);

      const response = await worker.fetch(captchaLoginRequest({ captchaToken: "captcha-response-token" }), env);
      const body = await response.json() as { ok: boolean; admin?: { username: string } };
      const [, verifyInit] = fetchMock.mock.calls[0];
      const verifyBody = (verifyInit as RequestInit).body as URLSearchParams;

      expect(response.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.admin?.username).toBe("admin");
      expect(response.headers.get("set-cookie")).toContain(`${SESSION_COOKIE}=`);
      expect(fetchMock).toHaveBeenCalledWith(providerCase.verifyUrl, expect.objectContaining({ method: "POST" }));
      expect(verifyBody.get("secret")).toBe(providerCase.secretKey);
      expect(verifyBody.get("response")).toBe("captcha-response-token");
      expect(state.authLookups).toBe(1);
      expect(state.lastLoginUpdates).toBe(1);
    }
  });

  it("rejects failed CAPTCHA verification without creating a session cookie", async () => {
    const { env, state } = await createCaptchaLoginEnv("hcaptcha", "hcaptcha-secret-key");
    const fetchMock = mockCaptchaVerification(false);

    const response = await worker.fetch(captchaLoginRequest({ captchaToken: "bad-token" }), env);
    const body = await response.json() as { ok: boolean; error?: string };

    expect(response.status).toBe(401);
    expect(body).toEqual({ ok: false, error: "CAPTCHA verification failed." });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(state.authLookups).toBe(0);
    expect(state.lastLoginUpdates).toBe(0);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

describe("admin login advanced CAPTCHA payload verification", () => {
  it("rejects advanced CAPTCHA login without a provider payload before password authentication", async () => {
    for (const providerCase of ADVANCED_CAPTCHA_VERIFY_CASES) {
      const { env, state } = await createCaptchaLoginEnvWithParams(
        providerCase.provider,
        providerCase.publicParams,
        providerCase.secretParams
      );
      const fetchMock = mockCaptchaVerification(true);

      const response = await worker.fetch(captchaLoginRequest({}), env);
      const body = await response.json() as { ok: boolean; error?: string };

      expect(response.status).toBe(400);
      expect(body).toEqual({ ok: false, error: "captchaPayload is required." });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(state.authLookups).toBe(0);
      expect(state.lastLoginUpdates).toBe(0);
      expect(response.headers.get("set-cookie")).toBeNull();
    }
  });

  it("allows password login after successful advanced CAPTCHA provider verification", async () => {
    for (const providerCase of ADVANCED_CAPTCHA_VERIFY_CASES) {
      const { env, state } = await createCaptchaLoginEnvWithParams(
        providerCase.provider,
        providerCase.publicParams,
        providerCase.secretParams
      );
      const fetchMock = mockCaptchaVerification(true);

      const response = await worker.fetch(captchaLoginRequest({ captchaPayload: providerCase.payload }), env);
      const body = await response.json() as { ok: boolean; admin?: { username: string } };
      const [, verifyInit] = fetchMock.mock.calls[0];
      const verifyBody = JSON.parse((verifyInit as RequestInit).body as string) as Record<string, unknown>;

      expect(response.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.admin?.username).toBe("admin");
      expect(response.headers.get("set-cookie")).toContain(`${SESSION_COOKIE}=`);
      expect(fetchMock).toHaveBeenCalledWith(providerCase.verifyUrl, expect.objectContaining({ method: "POST" }));
      expect(verifyBody).toEqual(providerCase.expectedBody);
      expect(state.authLookups).toBe(1);
      expect(state.lastLoginUpdates).toBe(1);
    }
  });

  it("rejects failed advanced CAPTCHA verification without creating a session cookie", async () => {
    for (const providerCase of ADVANCED_CAPTCHA_VERIFY_CASES) {
      const { env, state } = await createCaptchaLoginEnvWithParams(
        providerCase.provider,
        providerCase.publicParams,
        providerCase.secretParams
      );
      const fetchMock = mockCaptchaVerification(false);

      const response = await worker.fetch(captchaLoginRequest({ captchaPayload: providerCase.payload }), env);
      const body = await response.json() as { ok: boolean; error?: string };

      expect(response.status).toBe(401);
      expect(body).toEqual({ ok: false, error: "CAPTCHA verification failed." });
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(state.authLookups).toBe(0);
      expect(state.lastLoginUpdates).toBe(0);
      expect(response.headers.get("set-cookie")).toBeNull();
    }
  });
});
