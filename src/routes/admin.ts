import type { Context, Hono } from "hono";
import { SESSION_COOKIE } from "../constants";
import {
  authenticateAdmin,
  countAdmins,
  createAdmin,
  createSessionValue,
  getCookie,
  sessionClearCookie,
  sessionSetCookie,
  verifySessionValue
} from "../services/auth";
import { getEmailDetail, listEmails } from "../services/emails";
import { writeAccessLog } from "../services/logs";
import { createRule, getRulesByIds, listRules, parseRuleFields, sanitizeRuleInput, updateRule } from "../services/rules";
import { createShareLink, listShareLinks, setShareLinkStatus } from "../services/share-links";
import type { AdminRow, AppEnv } from "../types";
import { badRequest, clampNumber, forbidden, notFound, readJson, unauthorized } from "../utils/http";
import { timingSafeEqual } from "../utils/encoding";

interface LoginBody {
  username?: string;
  password?: string;
}

interface SetupBody extends LoginBody {
  setupToken?: string;
}

interface ShareLinkBody {
  name?: string | null;
  expiresAt?: string | null;
  ruleIds?: number[];
}

export function registerAdminRoutes(app: Hono<AppEnv>): void {
  app.get("/api/setup/status", async (c) => c.json({ ok: true, hasAdmin: (await countAdmins(c.env.DB)) > 0 }));
  app.post("/api/setup/admin", createFirstAdmin);
  app.post("/api/admin/login", login);
  app.post("/api/admin/logout", async (c) => {
    c.header("Set-Cookie", sessionClearCookie());
    return c.json({ ok: true });
  });
  app.get("/api/admin/me", async (c) => withAdmin(c, (admin) => c.json({ ok: true, admin: publicAdmin(admin) })));
  app.get("/api/admin/emails", async (c) => withAdmin(c, () => adminListEmails(c)));
  app.get("/api/admin/emails/:id", async (c) => withAdmin(c, () => adminEmailDetail(c)));
  app.get("/api/admin/rules", async (c) => withAdmin(c, () => adminListRules(c)));
  app.post("/api/admin/rules", async (c) => withAdmin(c, () => adminCreateRule(c)));
  app.patch("/api/admin/rules/:id", async (c) => withAdmin(c, () => adminUpdateRule(c)));
  app.get("/api/admin/share-links", async (c) => withAdmin(c, () => adminListShareLinks(c)));
  app.post("/api/admin/share-links", async (c) => withAdmin(c, (admin) => adminCreateShareLink(c, admin)));
  app.patch("/api/admin/share-links/:id", async (c) => withAdmin(c, () => adminUpdateShareLink(c)));
  app.get("/api/admin/access-logs", async (c) => withAdmin(c, () => adminAccessLogs(c)));
}

async function createFirstAdmin(c: Context<AppEnv>): Promise<Response> {
  if ((await countAdmins(c.env.DB)) > 0) {
    return forbidden(c, "Admin already exists.");
  }
  if (!c.env.ADMIN_SETUP_TOKEN) {
    return c.json({ ok: false, error: "ADMIN_SETUP_TOKEN is required before setup." }, 500);
  }
  const body = await readJson<SetupBody>(c);
  const setupToken = typeof body?.setupToken === "string" ? body.setupToken : "";
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!setupToken || !username || !password) {
    return badRequest(c, "setupToken, username and password are required.");
  }
  if (!timingSafeEqual(setupToken, c.env.ADMIN_SETUP_TOKEN)) {
    return forbidden(c, "Invalid setup token.");
  }
  if (password.length < 10) {
    return badRequest(c, "Password must be at least 10 characters.");
  }
  const id = await createAdmin(c.env.DB, username, password);
  await writeAccessLog(c.env.DB, { actorType: "system", actorId: id, action: "admin.created", request: c.req.raw });
  return c.json({ ok: true, id });
}

async function login(c: Context<AppEnv>): Promise<Response> {
  const body = await readJson<LoginBody>(c);
  if (!body?.username || !body.password) {
    return badRequest(c, "username and password are required.");
  }
  const admin = await authenticateAdmin(c.env.DB, body.username.trim(), body.password);
  if (!admin) {
    return unauthorized(c, "Invalid credentials.");
  }
  const session = await createSessionValue(c.env, admin);
  c.header("Set-Cookie", sessionSetCookie(session));
  await writeAccessLog(c.env.DB, { actorType: "admin", actorId: admin.id, action: "admin.login", request: c.req.raw });
  return c.json({ ok: true, admin: publicAdmin(admin) });
}

async function withAdmin(c: Context<AppEnv>, handler: (admin: AdminRow) => Promise<Response> | Response): Promise<Response> {
  const value = getCookie(c.req.raw, SESSION_COOKIE);
  const admin = await verifySessionValue(c.env.DB, c.env, value);
  if (!admin) {
    return unauthorized(c);
  }
  return await handler(admin);
}

async function adminListEmails(c: Context<AppEnv>): Promise<Response> {
  const limit = clampNumber(c.req.query("limit") ?? null, 50, 1, 100);
  const emails = await listEmails(c.env.DB, { q: c.req.query("q"), limit });
  return c.json({ ok: true, emails });
}

async function adminEmailDetail(c: Context<AppEnv>): Promise<Response> {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return badRequest(c, "Invalid email id.");
  }
  const email = await getEmailDetail(c.env.DB, id);
  return email ? c.json({ ok: true, email }) : notFound(c, "Email not found.");
}

async function adminListRules(c: Context<AppEnv>): Promise<Response> {
  const rules = (await listRules(c.env.DB)).map((rule) => ({
    ...rule,
    fields: parseRuleFields(rule.fields_json),
    matchMode: rule.match_mode,
    caseSensitive: Boolean(rule.case_sensitive),
    enabled: Boolean(rule.enabled)
  }));
  return c.json({ ok: true, rules });
}

async function adminCreateRule(c: Context<AppEnv>): Promise<Response> {
  const input = sanitizeRuleInput(await readJson(c) ?? {});
  if (!input) {
    return badRequest(c, "name, keyword and at least one field are required.");
  }
  const id = await createRule(c.env.DB, input);
  return c.json({ ok: true, id }, 201);
}

async function adminUpdateRule(c: Context<AppEnv>): Promise<Response> {
  const id = Number(c.req.param("id"));
  const input = sanitizeRuleInput(await readJson(c) ?? {});
  if (!Number.isInteger(id) || !input) {
    return badRequest(c, "Invalid rule update.");
  }
  await updateRule(c.env.DB, id, input);
  return c.json({ ok: true });
}

async function adminListShareLinks(c: Context<AppEnv>): Promise<Response> {
  return c.json({ ok: true, links: await listShareLinks(c.env.DB) });
}

async function adminCreateShareLink(c: Context<AppEnv>, admin: AdminRow): Promise<Response> {
  const body = await readJson<ShareLinkBody>(c);
  const ruleIds = body?.ruleIds?.filter(Number.isInteger) ?? [];
  if (ruleIds.length === 0) {
    return badRequest(c, "At least one rule is required.");
  }
  const uniqueRuleIds = [...new Set(ruleIds)];
  const rules = await getRulesByIds(c.env.DB, uniqueRuleIds);
  if (rules.length !== uniqueRuleIds.length) {
    return badRequest(c, "All selected rules must exist and be enabled.");
  }
  const created = await createShareLink(c.env.DB, {
    name: body?.name?.trim() || null,
    expiresAt: normalizeExpiresAt(body?.expiresAt),
    ruleIds: uniqueRuleIds,
    adminId: admin.id
  });
  const url = new URL(`/v/${created.token}`, c.req.url).toString();
  await writeAccessLog(c.env.DB, {
    actorType: "admin",
    actorId: admin.id,
    action: `share_link.created:${created.id}`,
    request: c.req.raw
  });
  return c.json({ ok: true, id: created.id, token: created.token, url }, 201);
}

async function adminUpdateShareLink(c: Context<AppEnv>): Promise<Response> {
  const id = Number(c.req.param("id"));
  const body = await readJson<{ status?: "active" | "disabled" }>(c);
  if (!Number.isInteger(id) || (body?.status !== "active" && body?.status !== "disabled")) {
    return badRequest(c, "Invalid share link update.");
  }
  await setShareLinkStatus(c.env.DB, id, body.status);
  return c.json({ ok: true });
}

async function adminAccessLogs(c: Context<AppEnv>): Promise<Response> {
  const limit = clampNumber(c.req.query("limit") ?? null, 50, 1, 100);
  const result = await c.env.DB.prepare("SELECT * FROM access_logs ORDER BY created_at DESC LIMIT ?1").bind(limit).all();
  return c.json({ ok: true, logs: result.results });
}

function publicAdmin(admin: AdminRow): Pick<AdminRow, "id" | "username" | "status" | "last_login_at"> {
  return {
    id: admin.id,
    username: admin.username,
    status: admin.status,
    last_login_at: admin.last_login_at
  };
}

function normalizeExpiresAt(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
