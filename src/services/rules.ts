import { RULE_FIELDS } from "../constants";
import type { RuleField, RuleRow } from "../types";

export interface RuleInput {
  name: string;
  keyword: string;
  fields: RuleField[];
  matchMode?: "contains" | "exact";
  caseSensitive?: boolean;
  enabled?: boolean;
}

export interface EmailForRuleMatching {
  fromAddress: string | null;
  envelopeTo: string;
  toAddresses: string[];
  subject: string | null;
  text: string;
  html: string;
  codes: string[];
}

export function parseRuleFields(value: string): RuleField[] {
  try {
    const parsed = JSON.parse(value) as string[];
    return parsed.filter((field): field is RuleField => RULE_FIELDS.includes(field as RuleField));
  } catch {
    return ["subject", "text", "html", "code"];
  }
}

export function sanitizeRuleInput(input: Partial<RuleInput>): RuleInput | null {
  const name = input.name?.trim();
  const keyword = input.keyword?.trim();
  const fields = (input.fields ?? []).filter((field): field is RuleField => RULE_FIELDS.includes(field));
  if (!name || !keyword || fields.length === 0) {
    return null;
  }
  return {
    name,
    keyword,
    fields,
    matchMode: input.matchMode === "exact" ? "exact" : "contains",
    caseSensitive: Boolean(input.caseSensitive),
    enabled: input.enabled ?? true
  };
}

export async function listRules(db: D1Database, includeDisabled = true): Promise<RuleRow[]> {
  const sql = includeDisabled ? "SELECT * FROM rules ORDER BY id DESC" : "SELECT * FROM rules WHERE enabled = 1 ORDER BY id DESC";
  const result = await db.prepare(sql).all<RuleRow>();
  return result.results;
}

export async function getRulesByIds(db: D1Database, ids: number[], includeDisabled = false): Promise<RuleRow[]> {
  if (ids.length === 0) {
    return [];
  }
  const placeholders = ids.map((_, index) => `?${index + 1}`).join(", ");
  const enabledClause = includeDisabled ? "" : "enabled = 1 AND ";
  const result = await db.prepare(`SELECT * FROM rules WHERE ${enabledClause}id IN (${placeholders})`).bind(...ids).all<RuleRow>();
  return result.results;
}

export async function createRule(db: D1Database, input: RuleInput): Promise<number> {
  const result = await db
    .prepare(
      "INSERT INTO rules (name, fields_json, keyword, match_mode, case_sensitive, enabled) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    )
    .bind(
      input.name,
      JSON.stringify(input.fields),
      input.keyword,
      input.matchMode ?? "contains",
      input.caseSensitive ? 1 : 0,
      input.enabled === false ? 0 : 1
    )
    .run();
  return Number(result.meta.last_row_id);
}

export async function updateRule(db: D1Database, id: number, input: RuleInput): Promise<void> {
  await db
    .prepare(
      `UPDATE rules
       SET name = ?1, fields_json = ?2, keyword = ?3, match_mode = ?4, case_sensitive = ?5, enabled = ?6,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?7`
    )
    .bind(
      input.name,
      JSON.stringify(input.fields),
      input.keyword,
      input.matchMode ?? "contains",
      input.caseSensitive ? 1 : 0,
      input.enabled === false ? 0 : 1,
      id
    )
    .run();
}

export async function deleteRule(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM rules WHERE id = ?1").bind(id).run();
}

function normalize(value: string, caseSensitive: boolean): string {
  return caseSensitive ? value : value.toLowerCase();
}

function fieldValues(email: EmailForRuleMatching, field: RuleField): string[] {
  if (field === "from") {
    return [email.fromAddress ?? ""];
  }
  if (field === "to") {
    return [email.envelopeTo, ...email.toAddresses];
  }
  if (field === "subject") {
    return [email.subject ?? ""];
  }
  if (field === "text") {
    return [email.text];
  }
  if (field === "html") {
    return [email.html];
  }
  return email.codes;
}

export function matchesRule(email: EmailForRuleMatching, rule: RuleRow): boolean {
  if (!rule.enabled) {
    return false;
  }
  const fields = parseRuleFields(rule.fields_json);
  const caseSensitive = Boolean(rule.case_sensitive);
  const keyword = normalize(rule.keyword, caseSensitive);
  for (const field of fields) {
    for (const rawValue of fieldValues(email, field)) {
      const value = normalize(rawValue, caseSensitive);
      if (rule.match_mode === "exact" ? value === keyword : value.includes(keyword)) {
        return true;
      }
    }
  }
  return false;
}

export function matchesAnyRule(email: EmailForRuleMatching, rules: RuleRow[]): boolean {
  return rules.some((rule) => matchesRule(email, rule));
}
