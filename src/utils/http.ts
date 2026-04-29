import type { Context } from "hono";
import type { AppEnv } from "../types";

export async function readJson<T>(c: Context<AppEnv>): Promise<T | null> {
  try {
    return (await c.req.json()) as T;
  } catch {
    return null;
  }
}

export function badRequest(c: Context<AppEnv>, message: string): Response {
  return c.json({ ok: false, error: message }, 400);
}

export function unauthorized(c: Context<AppEnv>, message = "Unauthorized"): Response {
  return c.json({ ok: false, error: message }, 401);
}

export function forbidden(c: Context<AppEnv>, message = "Forbidden"): Response {
  return c.json({ ok: false, error: message }, 403);
}

export function notFound(c: Context<AppEnv>, message = "Not found"): Response {
  return c.json({ ok: false, error: message }, 404);
}

export function clampNumber(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}
