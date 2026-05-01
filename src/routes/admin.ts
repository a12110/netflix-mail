import type { Context, Hono } from "hono";
import { DEFAULT_EMAIL_LIMIT, MAX_EMAIL_LIMIT, MAX_EMAIL_PAGE, SESSION_COOKIE } from "../constants";
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
import { applyPendingDatabaseMigrations, ensureDatabaseSchema, getDatabaseStatus } from "../services/database";
import { getEmailDetail, listEmailPage } from "../services/emails";
import { writeAccessLog } from "../services/logs";
import {
  createRule,
  deleteRule,
  getRulesByIds,
  listRules,
  normalizeShareLinkRuleLogic,
  parseRuleFields,
  ruleAction,
  ruleExpression,
  sanitizeRuleInput,
  updateRule
} from "../services/rules";
import { createShareLink, deleteShareLink, listShareLinks, resetShareLinkToken, updateShareLink } from "../services/share-links";
import type { AdminRow, AppEnv, ShareLinkRuleLogic } from "../types";
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
  status?: "active" | "disabled";
  allowRuleLogic?: ShareLinkRuleLogic;
  blockRuleLogic?: ShareLinkRuleLogic;
}

export function registerAdminRoutes(app: Hono<AppEnv>): void {
  app.get("/api/setup/status", async (c) => {
    await ensureDatabaseSchema(c.env.DB);
    return c.json({ ok: true, hasAdmin: (await countAdmins(c.env.DB)) > 0 });
  });
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
  app.delete("/api/admin/rules/:id", async (c) => withAdmin(c, () => adminDeleteRule(c)));
  app.get("/api/admin/share-links", async (c) => withAdmin(c, () => adminListShareLinks(c)));
  app.post("/api/admin/share-links", async (c) => withAdmin(c, (admin) => adminCreateShareLink(c, admin)));
  app.patch("/api/admin/share-links/:id", async (c) => withAdmin(c, () => adminUpdateShareLink(c)));
  app.post("/api/admin/share-links/:id/reset", async (c) => withAdmin(c, (admin) => adminResetShareLink(c, admin)));
  app.delete("/api/admin/share-links/:id", async (c) => withAdmin(c, () => adminDeleteShareLink(c)));
  app.get("/api/admin/database/status", async (c) => withAdmin(c, () => adminDatabaseStatus(c)));
  app.post("/api/admin/database/upgrade", async (c) => withAdmin(c, () => adminUpgradeDatabase(c)));
  app.get("/api/admin/access-logs", async (c) => withAdmin(c, () => adminAccessLogs(c)));
}

async function createFirstAdmin(c: Context<AppEnv>): Promise<Response> {
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
  await ensureDatabaseSchema(c.env.DB);
  if ((await countAdmins(c.env.DB)) > 0) {
    return forbidden(c, "Admin already exists.");
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
  const page = clampNumber(c.req.query("page"), 1, 1, MAX_EMAIL_PAGE);
  const pageSizeParam = c.req.query("pageSize") ?? c.req.query("limit");
  const pageSize = clampNumber(pageSizeParam, DEFAULT_EMAIL_LIMIT, 1, MAX_EMAIL_LIMIT);
  const result = await listEmailPage(c.env.DB, { q: c.req.query("q"), page, limit: pageSize });
  return c.json({ ok: true, emails: result.emails, pagination: result.pagination });
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
    enabled: Boolean(rule.enabled),
    action: ruleAction(rule),
    expression: ruleExpression(rule)
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

async function adminDeleteRule(c: Context<AppEnv>): Promise<Response> {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return badRequest(c, "Invalid rule id.");
  }
  await deleteRule(c.env.DB, id);
  return c.json({ ok: true });
}

async function adminListShareLinks(c: Context<AppEnv>): Promise<Response> {
  const links = await listShareLinks(c.env.DB);
  return c.json({ ok: true, links: links.map((link) => publicShareLink(c, link)) });
}

async function adminCreateShareLink(c: Context<AppEnv>, admin: AdminRow): Promise<Response> {
  const body = await readJson<ShareLinkBody>(c);
  if (!isValidOptionalShareRuleLogic(body?.allowRuleLogic) || !isValidOptionalShareRuleLogic(body?.blockRuleLogic)) {
    return badRequest(c, "allowRuleLogic and blockRuleLogic must be 'and' or 'or'.");
  }
  const ruleIds = body?.ruleIds?.filter(Number.isInteger) ?? [];
  if (ruleIds.length === 0) {
    return badRequest(c, "At least one rule is required.");
  }
  const uniqueRuleIds = [...new Set(ruleIds)];
  const rules = await getRulesByIds(c.env.DB, uniqueRuleIds);
  if (rules.length !== uniqueRuleIds.length) {
    return badRequest(c, "All selected rules must exist and be enabled.");
  }
  if (!hasAllowRule(rules)) {
    return badRequest(c, "At least one allow rule is required.");
  }
  const created = await createShareLink(c.env.DB, {
    name: body?.name?.trim() || null,
    expiresAt: normalizeExpiresAt(body?.expiresAt),
    ruleIds: uniqueRuleIds,
    adminId: admin.id,
    allowRuleLogic: normalizeShareLinkRuleLogic(body?.allowRuleLogic),
    blockRuleLogic: normalizeShareLinkRuleLogic(body?.blockRuleLogic)
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
  const body = await readJson<ShareLinkBody>(c) ?? {};
  if (!Number.isInteger(id) || !isValidShareStatus(body.status) || !isValidOptionalShareRuleLogic(body.allowRuleLogic)) {
    return badRequest(c, "Invalid share link update.");
  }
  if (!isValidOptionalShareRuleLogic(body.blockRuleLogic)) {
    return badRequest(c, "Invalid share link update.");
  }
  const update = await buildShareLinkUpdate(c, body);
  if (!update) {
    return badRequest(c, "Invalid share link update.");
  }
  await updateShareLink(c.env.DB, id, update);
  return c.json({ ok: true });
}

async function adminDeleteShareLink(c: Context<AppEnv>): Promise<Response> {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return badRequest(c, "Invalid share link id.");
  }
  await deleteShareLink(c.env.DB, id);
  return c.json({ ok: true });
}

async function adminResetShareLink(c: Context<AppEnv>, admin: AdminRow): Promise<Response> {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return badRequest(c, "Invalid share link id.");
  }
  const token = await resetShareLinkToken(c.env.DB, id);
  const url = new URL(`/v/${token}`, c.req.url).toString();
  await writeAccessLog(c.env.DB, {
    actorType: "admin",
    actorId: admin.id,
    action: `share_link.reset:${id}`,
    request: c.req.raw
  });
  return c.json({ ok: true, id, token, url });
}

async function adminDatabaseStatus(c: Context<AppEnv>): Promise<Response> {
  return c.json({ ok: true, ...(await getDatabaseStatus(c.env.DB)) });
}

async function adminUpgradeDatabase(c: Context<AppEnv>): Promise<Response> {
  return c.json({ ok: true, ...(await applyPendingDatabaseMigrations(c.env.DB)) });
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

function publicShareLink(c: Context<AppEnv>, link: Awaited<ReturnType<typeof listShareLinks>>[number]) {
  return {
    id: link.id,
    name: link.name,
    expires_at: link.expires_at,
    status: link.status,
    window_minutes: link.window_minutes,
    created_by_admin_id: link.created_by_admin_id,
    created_at: link.created_at,
    last_accessed_at: link.last_accessed_at,
    ruleIds: link.ruleIds,
    allowRuleLogic: normalizeShareLinkRuleLogic(link.allow_rule_logic),
    blockRuleLogic: normalizeShareLinkRuleLogic(link.block_rule_logic),
    url: link.token ? new URL(`/v/${link.token}`, c.req.url).toString() : null
  };
}

function normalizeExpiresAt(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function hasAllowRule(rules: Awaited<ReturnType<typeof getRulesByIds>>): boolean {
  return rules.some((rule) => Boolean(rule.enabled) && ruleAction(rule) === "allow");
}

function isValidShareStatus(status: ShareLinkBody["status"]): boolean {
  return status === undefined || status === "active" || status === "disabled";
}

function isValidOptionalShareRuleLogic(value: unknown): value is ShareLinkRuleLogic | undefined {
  return value === undefined || value === "and" || value === "or";
}

async function buildShareLinkUpdate(c: Context<AppEnv>, body: ShareLinkBody) {
  const update: {
    name?: string | null;
    expiresAt?: string | null;
    ruleIds?: number[];
    status?: "active" | "disabled";
    allowRuleLogic?: ShareLinkRuleLogic;
    blockRuleLogic?: ShareLinkRuleLogic;
  } = {};
  if ("name" in body) update.name = body.name?.trim() || null;
  if ("expiresAt" in body) update.expiresAt = normalizeExpiresAt(body.expiresAt);
  if (body.status) update.status = body.status;
  if ("allowRuleLogic" in body) update.allowRuleLogic = normalizeShareLinkRuleLogic(body.allowRuleLogic);
  if ("blockRuleLogic" in body) update.blockRuleLogic = normalizeShareLinkRuleLogic(body.blockRuleLogic);
  if (Array.isArray(body.ruleIds)) {
    const ruleIds = body.ruleIds.filter(Number.isInteger);
    if (ruleIds.length === 0) return null;
    const uniqueRuleIds = [...new Set(ruleIds)];
    const rules = await getRulesByIds(c.env.DB, uniqueRuleIds, true);
    if (rules.length !== uniqueRuleIds.length || !hasAllowRule(rules)) return null;
    update.ruleIds = uniqueRuleIds;
  }
  return Object.keys(update).length > 0 ? update : null;
}
