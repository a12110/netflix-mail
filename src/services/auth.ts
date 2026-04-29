import {
  PASSWORD_ALGORITHM,
  PASSWORD_ITERATIONS,
  PASSWORD_MAX_ITERATIONS,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS
} from "../constants";
import type { AdminRow, Env, SessionPayload } from "../types";
import {
  base64UrlDecodeText,
  base64UrlEncodeText,
  base64UrlToBytes,
  bytesToBase64Url,
  hmacSha256Base64Url,
  randomToken,
  timingSafeEqual,
  utf8Bytes
} from "../utils/encoding";
import { epochSeconds, nowIso } from "../utils/time";

function requireSessionSecret(env: Env): string {
  if (!env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required. Set it with `wrangler secret put SESSION_SECRET`.");
  }
  return env.SESSION_SECRET;
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", utf8Bytes(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return bytesToBase64Url(new Uint8Array(bits));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = base64UrlToBytes(randomToken(16));
  const hash = await derivePassword(password, salt, PASSWORD_ITERATIONS);
  return `${PASSWORD_ALGORITHM}$${PASSWORD_ITERATIONS}$${bytesToBase64Url(salt)}$${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, iterationsText, saltText, expected] = stored.split("$");
  const iterations = Number(iterationsText);
  if (
    algorithm !== PASSWORD_ALGORITHM ||
    !Number.isInteger(iterations) ||
    iterations <= 0 ||
    iterations > PASSWORD_MAX_ITERATIONS ||
    !saltText ||
    !expected
  ) {
    return false;
  }
  const actual = await derivePassword(password, base64UrlToBytes(saltText), iterations);
  return timingSafeEqual(actual, expected);
}

export async function countAdmins(db: D1Database): Promise<number> {
  const row = await db.prepare("SELECT COUNT(*) AS count FROM admins").first<{ count: number }>();
  return row?.count ?? 0;
}

export async function createAdmin(db: D1Database, username: string, password: string): Promise<number> {
  const passwordHash = await hashPassword(password);
  const result = await db
    .prepare("INSERT INTO admins (username, password_hash, status) VALUES (?1, ?2, 'active')")
    .bind(username, passwordHash)
    .run();
  return Number(result.meta.last_row_id);
}

export async function findAdminByUsername(db: D1Database, username: string): Promise<AdminRow | null> {
  return await db.prepare("SELECT * FROM admins WHERE username = ?1").bind(username).first<AdminRow>();
}

export async function findAdminById(db: D1Database, id: number): Promise<AdminRow | null> {
  return await db.prepare("SELECT * FROM admins WHERE id = ?1").bind(id).first<AdminRow>();
}

export async function authenticateAdmin(db: D1Database, username: string, password: string): Promise<AdminRow | null> {
  const admin = await findAdminByUsername(db, username);
  if (!admin || admin.status !== "active") {
    return null;
  }
  if (!(await verifyPassword(password, admin.password_hash))) {
    return null;
  }
  await db.prepare("UPDATE admins SET last_login_at = ?1 WHERE id = ?2").bind(nowIso(), admin.id).run();
  return admin;
}

export async function createSessionValue(env: Env, admin: Pick<AdminRow, "id" | "username">): Promise<string> {
  const payload: SessionPayload = {
    sub: admin.id,
    username: admin.username,
    exp: epochSeconds() + SESSION_TTL_SECONDS
  };
  const encoded = base64UrlEncodeText(JSON.stringify(payload));
  const signature = await hmacSha256Base64Url(requireSessionSecret(env), encoded);
  return `${encoded}.${signature}`;
}

export async function verifySessionValue(db: D1Database, env: Env, value: string | null): Promise<AdminRow | null> {
  if (!value) {
    return null;
  }
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) {
    return null;
  }
  const expected = await hmacSha256Base64Url(requireSessionSecret(env), encoded);
  if (!timingSafeEqual(signature, expected)) {
    return null;
  }
  const payload = JSON.parse(base64UrlDecodeText(encoded)) as SessionPayload;
  if (!payload.sub || payload.exp <= epochSeconds()) {
    return null;
  }
  const admin = await findAdminById(db, payload.sub);
  return admin?.status === "active" ? admin : null;
}

export function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rest] = cookie.trim().split("=");
    if (rawName === name) {
      return rest.join("=") || null;
    }
  }
  return null;
}

export function sessionSetCookie(value: string): string {
  return `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

export function sessionClearCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}
