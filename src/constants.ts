export const SESSION_COOKIE = "nm_session";
export const SESSION_TTL_SECONDS = 12 * 60 * 60;
export const PASSWORD_ITERATIONS = 120_000;
export const PASSWORD_ALGORITHM = "pbkdf2-sha256";
export const DEFAULT_WINDOW_MINUTES = 30;
export const DEFAULT_MAX_EMAIL_BODY_BYTES = 24_000_000;
export const DEFAULT_MAX_EMAIL_HEADERS_BYTES = 200_000;
export const CONTENT_CHUNK_BYTES = 500_000;
export const DEFAULT_EMAIL_LIMIT = 50;
export const MAX_EMAIL_LIMIT = 100;

export const RULE_FIELDS = ["from", "to", "subject", "text", "html", "code"] as const;
