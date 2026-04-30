import { DEFAULT_WINDOW_MINUTES } from "../constants";
import type { ShareLinkRow } from "../types";
import { randomToken, sha256Base64Url } from "../utils/encoding";
import { isPastIso, nowIso } from "../utils/time";

export interface ShareLinkWithRules extends ShareLinkRow {
  ruleIds: number[];
}

export interface CreateShareLinkInput {
  name?: string | null;
  expiresAt?: string | null;
  ruleIds: number[];
  adminId: number;
}

export interface UpdateShareLinkInput {
  name?: string | null;
  expiresAt?: string | null;
  ruleIds?: number[];
  status?: "active" | "disabled";
}

export async function hashShareToken(token: string): Promise<string> {
  return await sha256Base64Url(token);
}

export async function createShareLink(db: D1Database, input: CreateShareLinkInput): Promise<{ id: number; token: string }> {
  if (input.ruleIds.length === 0) {
    throw new Error("At least one rule is required.");
  }
  const token = randomToken();
  const tokenHash = await hashShareToken(token);
  const result = await db
    .prepare(
      `INSERT INTO share_links (name, token, token_hash, expires_at, status, window_minutes, created_by_admin_id)
       VALUES (?1, ?2, ?3, ?4, 'active', ?5, ?6)`
    )
    .bind(input.name ?? null, token, tokenHash, input.expiresAt ?? null, DEFAULT_WINDOW_MINUTES, input.adminId)
    .run();
  const id = Number(result.meta.last_row_id);
  await db.batch(
    input.ruleIds.map((ruleId) =>
      db.prepare("INSERT INTO share_link_rules (share_link_id, rule_id) VALUES (?1, ?2)").bind(id, ruleId)
    )
  );
  return { id, token };
}

export async function listShareLinks(db: D1Database): Promise<ShareLinkWithRules[]> {
  const result = await db.prepare("SELECT * FROM share_links ORDER BY id DESC").all<ShareLinkRow>();
  return await Promise.all(result.results.map((row) => withRuleIds(db, row)));
}

export async function setShareLinkStatus(db: D1Database, id: number, status: "active" | "disabled"): Promise<void> {
  await updateShareLink(db, id, { status });
}

export async function updateShareLink(db: D1Database, id: number, input: UpdateShareLinkInput): Promise<void> {
  const updates: string[] = [];
  const values: Array<string | number | null> = [];
  addShareLinkUpdate(updates, values, "name", input.name);
  addShareLinkUpdate(updates, values, "expires_at", input.expiresAt);
  addShareLinkUpdate(updates, values, "status", input.status);
  if (updates.length > 0) {
    values.push(id);
    await db.prepare(`UPDATE share_links SET ${updates.join(", ")} WHERE id = ?${values.length}`).bind(...values).run();
  }
  if (input.ruleIds) {
    await replaceShareLinkRules(db, id, input.ruleIds);
  }
}

export async function deleteShareLink(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM share_links WHERE id = ?1").bind(id).run();
}

export async function getShareLinkByToken(db: D1Database, token: string): Promise<ShareLinkWithRules | null> {
  const tokenHash = await hashShareToken(token);
  const row = await db.prepare("SELECT * FROM share_links WHERE token_hash = ?1").bind(tokenHash).first<ShareLinkRow>();
  return row ? await withRuleIds(db, row) : null;
}

export function isShareLinkUsable(link: ShareLinkRow): boolean {
  return link.status === "active" && !isPastIso(link.expires_at);
}

export async function markShareLinkAccessed(db: D1Database, id: number): Promise<void> {
  await db.prepare("UPDATE share_links SET last_accessed_at = ?1 WHERE id = ?2").bind(nowIso(), id).run();
}

async function withRuleIds(db: D1Database, row: ShareLinkRow): Promise<ShareLinkWithRules> {
  const rules = await db
    .prepare("SELECT rule_id FROM share_link_rules WHERE share_link_id = ?1 ORDER BY rule_id")
    .bind(row.id)
    .all<{ rule_id: number }>();
  return { ...row, ruleIds: rules.results.map((rule) => rule.rule_id) };
}

function addShareLinkUpdate(
  updates: string[],
  values: Array<string | number | null>,
  column: string,
  value: string | null | undefined
): void {
  if (value === undefined) {
    return;
  }
  values.push(value);
  updates.push(`${column} = ?${values.length}`);
}

async function replaceShareLinkRules(db: D1Database, id: number, ruleIds: number[]): Promise<void> {
  await db.prepare("DELETE FROM share_link_rules WHERE share_link_id = ?1").bind(id).run();
  if (ruleIds.length === 0) {
    return;
  }
  await db.batch(
    ruleIds.map((ruleId) =>
      db.prepare("INSERT INTO share_link_rules (share_link_id, rule_id) VALUES (?1, ?2)").bind(id, ruleId)
    )
  );
}
