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

export type CaptchaVerifierFetch = typeof fetch;

export interface CaptchaVerificationInput {
  settings: LoginCaptchaSettings;
  token?: string;
  payload?: Record<string, unknown>;
  fetcher?: CaptchaVerifierFetch;
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

export class CaptchaVerificationError extends Error {}

const PUBLIC_PARAM_KEYS: Record<CaptchaProvider, readonly string[]> = {
  cloudflare_turnstile: ["siteKey"],
  hcaptcha: ["siteKey"],
  google_recaptcha: ["siteKey"],
  tencent_cloud_captcha: ["captchaAppId", "appId"],
  alibaba_cloud_captcha_2: ["captchaId", "sceneId", "prefix"],
  geetest_captcha: ["captchaId"]
};

const SECRET_PARAM_KEY_PATTERN = /secret|token|private|credential|keyid|accesskey|appsecret|captchaappsecret/i;
const BROWSER_PUBLIC_KEY = "siteKey";
const SERVER_SECRET_KEY = "secretKey";
const CAPTCHA_VERIFY_ENDPOINTS: Partial<Record<CaptchaProvider, string>> = {
  cloudflare_turnstile: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  hcaptcha: "https://api.hcaptcha.com/siteverify",
  google_recaptcha: "https://www.google.com/recaptcha/api/siteverify",
  tencent_cloud_captcha: "https://captcha.tencentcloudapi.com/",
  alibaba_cloud_captcha_2: "https://captcha.aliyuncs.com/verify",
  geetest_captcha: "https://gcaptcha4.geetest.com/validate"
};

const BASIC_CAPTCHA_PROVIDERS = [
  "cloudflare_turnstile",
  "hcaptcha",
  "google_recaptcha"
] as const;

const CAPTCHA_PAYLOAD_KEYS: Partial<Record<CaptchaProvider, readonly string[]>> = {
  tencent_cloud_captcha: ["ticket", "randstr"],
  alibaba_cloud_captcha_2: ["captchaVerifyParam"],
  geetest_captcha: ["captchaOutput", "lotNumber", "passToken", "genTime"]
};
const REQUIRED_SECRET_PARAM_KEYS: Record<CaptchaProvider, readonly string[]> = {
  cloudflare_turnstile: [SERVER_SECRET_KEY],
  hcaptcha: [SERVER_SECRET_KEY],
  google_recaptcha: [SERVER_SECRET_KEY],
  tencent_cloud_captcha: ["secretId", SERVER_SECRET_KEY],
  alibaba_cloud_captcha_2: ["accessKeyId", "accessKeySecret"],
  geetest_captcha: ["captchaKey"]
};

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

  const validated = validateEnabledProviderUpdate(update);
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

export async function getEnabledLoginCaptchaSettings(db: D1Database): Promise<LoginCaptchaSettings | null> {
  if (!(await loginCaptchaSettingsTableExists(db))) {
    return null;
  }
  const settings = await getLoginCaptchaSettings(db);
  return settings.enabled ? settings : null;
}

export async function verifyLoginCaptchaToken(input: CaptchaVerificationInput): Promise<boolean> {
  const endpoint = CAPTCHA_VERIFY_ENDPOINTS[input.settings.provider];
  if (!endpoint) {
    throw new CaptchaVerificationError("CAPTCHA verification is not supported for this provider.");
  }
  const request = buildProviderVerificationRequest(input, endpoint);
  const response = await (input.fetcher ?? fetch)(endpoint, request);
  if (!response.ok) {
    return false;
  }
  return parseVerificationSuccess(await response.json());
}

function disabledChallenge(): PublicCaptchaChallenge {
  return { enabled: false };
}

function buildProviderVerificationRequest(input: CaptchaVerificationInput, endpoint: string): RequestInit {
  if (isBasicCaptchaProvider(input.settings.provider)) {
    return buildBasicVerificationRequest(input);
  }
  const payload = requireCaptchaPayload(input.settings.provider, input.payload);
  if (input.settings.provider === "tencent_cloud_captcha") {
    return buildTencentVerificationRequest(input.settings, payload);
  }
  if (input.settings.provider === "alibaba_cloud_captcha_2") {
    return buildAlibabaVerificationRequest(input.settings, payload);
  }
  return buildGeetestVerificationRequest(input.settings, payload);
}

function buildBasicVerificationRequest(input: CaptchaVerificationInput): RequestInit {
  const token = typeof input.token === "string" ? input.token.trim() : "";
  if (!token) {
    throw new CaptchaVerificationError("CAPTCHA token is required.");
  }
  const secretKey = getRequiredString(input.settings.secretParams, SERVER_SECRET_KEY, "secretParams");
  return {
    method: "POST",
    body: buildBasicVerificationBody(secretKey, token),
    headers: { "content-type": "application/x-www-form-urlencoded" }
  };
}

function buildBasicVerificationBody(secretKey: string, token: string): URLSearchParams {
  const body = new URLSearchParams();
  body.set("secret", secretKey);
  body.set("response", token);
  return body;
}

function buildTencentVerificationRequest(settings: LoginCaptchaSettings, payload: Record<string, unknown>): RequestInit {
  const secretId = getRequiredString(settings.secretParams, "secretId", "secretParams");
  return jsonVerificationRequest({
    secretId,
    secretKey: getRequiredString(settings.secretParams, SERVER_SECRET_KEY, "secretParams"),
    captchaAppId: getRequiredString(settings.publicParams, "captchaAppId", "publicParams"),
    appId: getRequiredString(settings.publicParams, "appId", "publicParams"),
    ticket: getRequiredString(payload, "ticket", "captchaPayload"),
    randstr: getRequiredString(payload, "randstr", "captchaPayload")
  }, { "x-tc-secret-id": secretId });
}

function buildAlibabaVerificationRequest(settings: LoginCaptchaSettings, payload: Record<string, unknown>): RequestInit {
  const accessKeyId = getRequiredString(settings.secretParams, "accessKeyId", "secretParams");
  return jsonVerificationRequest({
    accessKeyId,
    accessKeySecret: getRequiredString(settings.secretParams, "accessKeySecret", "secretParams"),
    captchaId: getRequiredString(settings.publicParams, "captchaId", "publicParams"),
    sceneId: getRequiredString(settings.publicParams, "sceneId", "publicParams"),
    prefix: getRequiredString(settings.publicParams, "prefix", "publicParams"),
    captchaVerifyParam: getRequiredString(payload, "captchaVerifyParam", "captchaPayload")
  }, { "x-acs-access-key-id": accessKeyId });
}

function buildGeetestVerificationRequest(settings: LoginCaptchaSettings, payload: Record<string, unknown>): RequestInit {
  return jsonVerificationRequest({
    captchaId: getRequiredString(settings.publicParams, "captchaId", "publicParams"),
    captchaKey: getRequiredString(settings.secretParams, "captchaKey", "secretParams"),
    captchaOutput: getRequiredString(payload, "captchaOutput", "captchaPayload"),
    lotNumber: getRequiredString(payload, "lotNumber", "captchaPayload"),
    passToken: getRequiredString(payload, "passToken", "captchaPayload"),
    genTime: getRequiredString(payload, "genTime", "captchaPayload")
  });
}

function jsonVerificationRequest(value: Record<string, string>, headers: Record<string, string> = {}): RequestInit {
  return {
    method: "POST",
    body: JSON.stringify(value),
    headers: { "content-type": "application/json", ...headers }
  };
}

function requireCaptchaPayload(provider: CaptchaProvider, value: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new CaptchaVerificationError("captchaPayload is required.");
  }
  for (const key of CAPTCHA_PAYLOAD_KEYS[provider] ?? []) {
    getRequiredString(value, key, "captchaPayload");
  }
  return value;
}

function isBasicCaptchaProvider(provider: CaptchaProvider): boolean {
  return BASIC_CAPTCHA_PROVIDERS.includes(provider as (typeof BASIC_CAPTCHA_PROVIDERS)[number]);
}

function getRequiredString(params: Record<string, unknown>, key: string, fieldName: string): string {
  const value = params[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new CaptchaVerificationError(`${fieldName}.${key} is required.`);
  }
  return value;
}

function parseVerificationSuccess(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const result = value as { success?: unknown; result?: unknown; status?: unknown; CaptchaCode?: unknown; Response?: unknown };
  return result.success === true
    || result.result === true
    || result.result === "success"
    || result.status === "success"
    || result.CaptchaCode === 1
    || parseNestedTencentSuccess(result.Response);
}

function parseNestedTencentSuccess(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return (value as { CaptchaCode?: unknown }).CaptchaCode === 1;
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

function validateEnabledProviderUpdate(update: AdminCaptchaSettingsUpdate): Required<AdminCaptchaSettingsUpdate> {
  if (!update.provider || !isCaptchaProvider(update.provider)) {
    throw new CaptchaSettingsValidationError("Unsupported CAPTCHA provider.");
  }
  const publicParams = requireParamRecord(update.publicParams, "publicParams");
  const secretParams = requireParamRecord(update.secretParams, "secretParams");
  requireStringParams(publicParams, PUBLIC_PARAM_KEYS[update.provider], "publicParams");
  requireStringParams(secretParams, REQUIRED_SECRET_PARAM_KEYS[update.provider], "secretParams");
  return {
    enabled: true,
    provider: update.provider,
    publicParams,
    secretParams
  };
}

function isCaptchaProvider(value: string): value is CaptchaProvider {
  return CAPTCHA_PROVIDERS.includes(value as CaptchaProvider);
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

function requireStringParams(params: Record<string, unknown>, keys: readonly string[], fieldName: string): void {
  for (const key of keys) {
    requireStringParam(params, key, fieldName);
  }
}

function pickPublicParams(provider: CaptchaProvider, params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    PUBLIC_PARAM_KEYS[provider]
      .filter((key) => Object.prototype.hasOwnProperty.call(params, key) && !SECRET_PARAM_KEY_PATTERN.test(key))
      .map((key) => [key, params[key]])
  );
}
