export const CAPTCHA_PROVIDERS = [
  "cloudflare_turnstile",
  "hcaptcha",
  "google_recaptcha",
  "tencent_cloud_captcha",
  "alibaba_cloud_captcha_2",
  "geetest_captcha"
] as const;

export type CaptchaProvider = (typeof CAPTCHA_PROVIDERS)[number];

export interface LoginCaptchaSettings {
  enabled: boolean;
  provider: CaptchaProvider;
  publicParams: Record<string, unknown>;
  secretParams: Record<string, unknown>;
}

interface LoginCaptchaSettingsRow {
  enabled: number;
  provider: CaptchaProvider;
  public_params_json: string;
  secret_params_json: string;
}

export async function getLoginCaptchaSettings(db: D1Database): Promise<LoginCaptchaSettings> {
  const row = await db
    .prepare(
      `SELECT enabled, provider, public_params_json, secret_params_json
       FROM login_captcha_settings
       WHERE id = 1`
    )
    .first<LoginCaptchaSettingsRow>();

  if (!row) {
    throw new Error("Login CAPTCHA settings are missing. Run the database upgrade first.");
  }

  return {
    enabled: row.enabled === 1,
    provider: row.provider,
    publicParams: parseParams(row.public_params_json, "public_params_json"),
    secretParams: parseParams(row.secret_params_json, "secret_params_json")
  };
}

function parseParams(value: string, fieldName: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Invalid CAPTCHA ${fieldName}.`);
  }
  return parsed as Record<string, unknown>;
}

export interface PublicCaptchaChallenge {
  enabled: boolean;
  provider?: CaptchaProvider;
  publicParams?: Record<string, unknown>;
}

export interface AdminCaptchaSettings {
  enabled: boolean;
  provider: CaptchaProvider;
  publicParams: Record<string, unknown>;
  secretParams: Record<string, string>;
}

export interface AdminCaptchaSettingsUpdate {
  enabled: boolean;
  provider?: CaptchaProvider;
  publicParams?: Record<string, unknown>;
  secretParams?: Record<string, unknown>;
}

export class CaptchaSettingsValidationError extends Error {}

const PUBLIC_PARAM_KEYS: Record<CaptchaProvider, readonly string[]> = {
  cloudflare_turnstile: ["siteKey"],
  hcaptcha: ["siteKey"],
  google_recaptcha: ["siteKey"],
  tencent_cloud_captcha: ["captchaAppId", "appId"],
  alibaba_cloud_captcha_2: ["captchaId", "sceneId", "prefix"],
  geetest_captcha: ["captchaId"]
};

const SECRET_PARAM_KEY_PATTERN = /secret|token|private|credential|keyid|accesskey|appsecret|captchaappsecret/i;
const ENABLED_BASIC_CAPTCHA_PROVIDERS = new Set<CaptchaProvider>([
  "cloudflare_turnstile",
  "hcaptcha",
  "google_recaptcha"
]);
const BROWSER_PUBLIC_KEY = "siteKey";
const SERVER_SECRET_KEY = "secretKey";

export async function getAdminCaptchaSettings(db: D1Database): Promise<AdminCaptchaSettings> {
  const settings = await getLoginCaptchaSettings(db);
  return {
    enabled: settings.enabled,
    provider: settings.provider,
    publicParams: settings.publicParams,
    secretParams: redactSecretParams(settings.secretParams)
  };
}

export async function updateAdminCaptchaSettings(
  db: D1Database,
  update: AdminCaptchaSettingsUpdate
): Promise<AdminCaptchaSettings> {
  if (!update.enabled) {
    await db
      .prepare(
        `UPDATE login_captcha_settings
         SET enabled = 0,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = 1`
      )
      .run();
    return await getAdminCaptchaSettings(db);
  }

  const validated = validateEnabledBasicProviderUpdate(update);
  await db
    .prepare(
      `UPDATE login_captcha_settings
       SET enabled = 1,
           provider = ?1,
           public_params_json = ?2,
           secret_params_json = ?3,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = 1`
    )
    .bind(validated.provider, JSON.stringify(validated.publicParams), JSON.stringify(validated.secretParams))
    .run();
  return await getAdminCaptchaSettings(db);
}

export async function getPublicLoginCaptchaChallenge(db: D1Database): Promise<PublicCaptchaChallenge> {
  if (!(await loginCaptchaSettingsTableExists(db))) {
    return disabledChallenge();
  }
  const settings = await getLoginCaptchaSettings(db);
  if (!settings.enabled) {
    return disabledChallenge();
  }
  return {
    enabled: true,
    provider: settings.provider,
    publicParams: pickPublicParams(settings.provider, settings.publicParams)
  };
}

function disabledChallenge(): PublicCaptchaChallenge {
  return { enabled: false };
}

async function loginCaptchaSettingsTableExists(db: D1Database): Promise<boolean> {
  const row = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?1")
    .bind("login_captcha_settings")
    .first<{ name: string }>();
  return Boolean(row);
}

function redactSecretParams(params: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.keys(params).map((key) => [key, "[redacted]"]));
}

function validateEnabledBasicProviderUpdate(update: AdminCaptchaSettingsUpdate): Required<AdminCaptchaSettingsUpdate> {
  if (!update.provider || !ENABLED_BASIC_CAPTCHA_PROVIDERS.has(update.provider)) {
    throw new CaptchaSettingsValidationError("Unsupported CAPTCHA provider.");
  }
  const publicParams = requireParamRecord(update.publicParams, "publicParams");
  const secretParams = requireParamRecord(update.secretParams, "secretParams");
  requireStringParam(publicParams, BROWSER_PUBLIC_KEY, "publicParams");
  requireStringParam(secretParams, SERVER_SECRET_KEY, "secretParams");
  return {
    enabled: true,
    provider: update.provider,
    publicParams,
    secretParams
  };
}

function requireParamRecord(value: Record<string, unknown> | undefined, fieldName: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new CaptchaSettingsValidationError(`${fieldName} is required.`);
  }
  return value;
}

function requireStringParam(params: Record<string, unknown>, key: string, fieldName: string): void {
  if (typeof params[key] !== "string" || params[key].trim() === "") {
    throw new CaptchaSettingsValidationError(`${fieldName}.${key} is required.`);
  }
}

function pickPublicParams(provider: CaptchaProvider, params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    PUBLIC_PARAM_KEYS[provider]
      .filter((key) => Object.prototype.hasOwnProperty.call(params, key) && !SECRET_PARAM_KEY_PATTERN.test(key))
      .map((key) => [key, params[key]])
  );
}
