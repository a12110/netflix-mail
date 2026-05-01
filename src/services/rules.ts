import { RULE_FIELDS } from "../constants";
import type { RuleField, RuleRow, ShareLinkRuleLogic } from "../types";

export type RuleAction = "allow" | "block";
export type RuleOperator = "contains" | "exact" | "startsWith" | "endsWith" | "regex";
export type RuleLogicInput = "any" | "all" | "or" | "and";
export type RuleExpression =
  | { op: "condition"; field: RuleField; operator: RuleOperator; value: string; caseSensitive?: boolean }
  | { op: "and" | "or"; children: RuleExpression[] }
  | { op: "not"; child: RuleExpression };

export interface RuleInput {
  name: string;
  keyword: string;
  keywords: string[];
  fields: RuleField[];
  keywordLogic?: RuleLogicInput;
  fieldLogic?: RuleLogicInput;
  matchMode?: "contains" | "exact";
  caseSensitive?: boolean;
  enabled?: boolean;
  action: RuleAction;
  expression: RuleExpression;
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

export interface RuleSetEvaluation {
  allowed: boolean;
  blocked: boolean;
  visible: boolean;
  matchedAllowRuleIds: number[];
  matchedBlockRuleIds: number[];
}

export interface RuleSetEvaluationOptions {
  allowRuleLogic?: ShareLinkRuleLogic;
  blockRuleLogic?: ShareLinkRuleLogic;
}

const DEFAULT_RULE_FIELDS: RuleField[] = ["subject", "text", "html", "code"];
const MAX_REGEX_PATTERN_LENGTH = 200;

export function parseRuleFields(value: string): RuleField[] {
  try {
    const parsed = JSON.parse(value) as string[];
    return parsed.filter((field): field is RuleField => RULE_FIELDS.includes(field as RuleField));
  } catch {
    return DEFAULT_RULE_FIELDS;
  }
}

export function parseRuleKeywords(value: string | null | undefined): string[] {
  return String(value ?? "")
    .split(/[\n,]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .filter((keyword, index, keywords) => keywords.indexOf(keyword) === index);
}

export function sanitizeRuleInput(input: Partial<RuleInput> & { expression?: unknown }): RuleInput | null {
  const name = input.name?.trim();
  const action: RuleAction = input.action === "block" ? "block" : "allow";
  const caseSensitive = Boolean(input.caseSensitive);
  const expression = sanitizeRuleExpression(input.expression) ?? legacyExpressionFromInput(input, caseSensitive);
  if (!name || !expression) {
    return null;
  }
  const keywords = extractExpressionKeywords(expression);
  const fields = extractExpressionFields(expression);
  return {
    name,
    keyword: keywords.join("\n") || name,
    keywords,
    fields: fields.length > 0 ? fields : DEFAULT_RULE_FIELDS,
    matchMode: input.matchMode === "exact" ? "exact" : "contains",
    caseSensitive,
    enabled: input.enabled ?? true,
    action,
    expression
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
      `INSERT INTO rules (name, fields_json, keyword, match_mode, case_sensitive, enabled, action, expression_json, schema_version)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 2)`
    )
    .bind(
      input.name,
      JSON.stringify(input.fields),
      input.keyword,
      input.matchMode ?? "contains",
      input.caseSensitive ? 1 : 0,
      input.enabled === false ? 0 : 1,
      input.action,
      JSON.stringify(input.expression)
    )
    .run();
  return Number(result.meta.last_row_id);
}

export async function updateRule(db: D1Database, id: number, input: RuleInput): Promise<void> {
  await db
    .prepare(
      `UPDATE rules
       SET name = ?1, fields_json = ?2, keyword = ?3, match_mode = ?4, case_sensitive = ?5, enabled = ?6,
           action = ?7, expression_json = ?8, schema_version = 2,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?9`
    )
    .bind(
      input.name,
      JSON.stringify(input.fields),
      input.keyword,
      input.matchMode ?? "contains",
      input.caseSensitive ? 1 : 0,
      input.enabled === false ? 0 : 1,
      input.action,
      JSON.stringify(input.expression),
      id
    )
    .run();
}

export async function deleteRule(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM rules WHERE id = ?1").bind(id).run();
}

export function ruleAction(rule: RuleRow): RuleAction {
  return rule.action === "block" ? "block" : "allow";
}

export function ruleExpression(rule: RuleRow): RuleExpression {
  const parsed = sanitizeRuleExpression(parseJson(rule.expression_json));
  return parsed ?? legacyExpressionFromRule(rule);
}

export function matchesRule(email: EmailForRuleMatching, rule: RuleRow): boolean {
  return Boolean(rule.enabled) && evaluateExpression(email, ruleExpression(rule));
}

export function matchesAnyRule(email: EmailForRuleMatching, rules: RuleRow[]): boolean {
  return rules.some((rule) => matchesRule(email, rule));
}

export function evaluateRuleSet(email: EmailForRuleMatching, rules: RuleRow[], options: RuleSetEvaluationOptions = {}): RuleSetEvaluation {
  const allowRuleLogic = options.allowRuleLogic ?? "or";
  const blockRuleLogic = options.blockRuleLogic ?? "or";
  const enabledRules = rules.filter((rule) => Boolean(rule.enabled));
  const allowRules = enabledRules.filter((rule) => ruleAction(rule) === "allow");
  const blockRules = enabledRules.filter((rule) => ruleAction(rule) === "block");
  const matchedAllowRuleIds: number[] = [];
  const matchedBlockRuleIds: number[] = [];
  for (const rule of allowRules) {
    if (!matchesRule(email, rule)) continue;
    matchedAllowRuleIds.push(rule.id);
  }
  for (const rule of blockRules) {
    if (!matchesRule(email, rule)) continue;
    matchedBlockRuleIds.push(rule.id);
  }
  const allowed = evaluateRuleGroupMatch(allowRules.length, matchedAllowRuleIds.length, allowRuleLogic);
  const blocked = evaluateRuleGroupMatch(blockRules.length, matchedBlockRuleIds.length, blockRuleLogic);
  return { allowed, blocked, visible: allowed && !blocked, matchedAllowRuleIds, matchedBlockRuleIds };
}

export function normalizeShareLinkRuleLogic(value: unknown, fallback: ShareLinkRuleLogic = "or"): ShareLinkRuleLogic {
  if (value === "and" || value === "or") return value;
  return fallback;
}

export function extractExpressionKeywords(expression: RuleExpression): string[] {
  if (expression.op === "condition") return [expression.value];
  if (expression.op === "not") return extractExpressionKeywords(expression.child);
  return unique(expression.children.flatMap(extractExpressionKeywords));
}

export function extractExpressionFields(expression: RuleExpression): RuleField[] {
  if (expression.op === "condition") return [expression.field];
  if (expression.op === "not") return extractExpressionFields(expression.child);
  return unique(expression.children.flatMap(extractExpressionFields));
}

function sanitizeRuleExpression(value: unknown): RuleExpression | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (raw.op === "condition") return sanitizeCondition(raw);
  if (raw.op === "not") {
    const child = sanitizeRuleExpression(raw.child);
    return child ? { op: "not", child } : null;
  }
  if (raw.op !== "and" && raw.op !== "or") return null;
  if (!Array.isArray(raw.children)) return null;
  const children = raw.children.map(sanitizeRuleExpression).filter((child): child is RuleExpression => Boolean(child));
  if (children.length === 0) return null;
  return children.length === 1 ? children[0] : { op: raw.op, children };
}

function sanitizeCondition(raw: Record<string, unknown>): RuleExpression | null {
  const field = raw.field;
  const operator = raw.operator;
  const value = typeof raw.value === "string" ? raw.value.trim() : "";
  if (!RULE_FIELDS.includes(field as RuleField) || !isRuleOperator(operator) || !value) return null;
  if (operator === "regex" && !isSafeRegexPattern(value)) return null;
  return { op: "condition", field: field as RuleField, operator, value, caseSensitive: Boolean(raw.caseSensitive) };
}

function legacyExpressionFromInput(input: Partial<RuleInput>, caseSensitive: boolean): RuleExpression | null {
  const fields = (input.fields ?? []).filter((field): field is RuleField => RULE_FIELDS.includes(field));
  const keywords = input.keywords?.length ? input.keywords : parseRuleKeywords(input.keyword);
  if (fields.length === 0 || keywords.length === 0) return null;
  const operator: RuleOperator = input.matchMode === "exact" ? "exact" : "contains";
  const keywordLogic = normalizeRuleLogic(input.keywordLogic, "or");
  const fieldLogic = normalizeRuleLogic(input.fieldLogic, "or");
  const keywordGroups = keywords
    .map((keyword) => expressionGroup(fieldLogic, fields.map((field) => ({ op: "condition", field, operator, value: keyword, caseSensitive }))))
    .filter((group): group is RuleExpression => Boolean(group));
  return expressionGroup(keywordLogic, keywordGroups);
}

function legacyExpressionFromRule(rule: RuleRow): RuleExpression {
  const fields = parseRuleFields(rule.fields_json);
  const keywords = parseRuleKeywords(rule.keyword);
  const operator: RuleOperator = rule.match_mode === "exact" ? "exact" : "contains";
  const caseSensitive = Boolean(rule.case_sensitive);
  const conditions = keywords.flatMap((value) => fields.map((field) => ({ op: "condition" as const, field, operator, value, caseSensitive })));
  return expressionGroup("or", conditions) ?? { op: "condition", field: "subject", operator: "contains", value: "__never_match__" };
}

function evaluateExpression(email: EmailForRuleMatching, expression: RuleExpression): boolean {
  if (expression.op === "condition") return evaluateCondition(email, expression);
  if (expression.op === "not") return !evaluateExpression(email, expression.child);
  const matches = expression.children.map((child) => evaluateExpression(email, child));
  return expression.op === "and" ? matches.every(Boolean) : matches.some(Boolean);
}

function evaluateCondition(email: EmailForRuleMatching, condition: Extract<RuleExpression, { op: "condition" }>): boolean {
  return fieldValues(email, condition.field).some((rawValue) => matchesValue(rawValue, condition));
}

function matchesValue(rawValue: string, condition: Extract<RuleExpression, { op: "condition" }>): boolean {
  const value = normalize(rawValue, Boolean(condition.caseSensitive));
  const expected = normalize(condition.value, Boolean(condition.caseSensitive));
  if (condition.operator === "exact") return value === expected;
  if (condition.operator === "startsWith") return value.startsWith(expected);
  if (condition.operator === "endsWith") return value.endsWith(expected);
  if (condition.operator === "regex") return regexMatches(rawValue, condition.value, Boolean(condition.caseSensitive));
  return value.includes(expected);
}

function fieldValues(email: EmailForRuleMatching, field: RuleField): string[] {
  if (field === "from") return [email.fromAddress ?? ""];
  if (field === "to") return [email.envelopeTo, ...email.toAddresses];
  if (field === "subject") return [email.subject ?? ""];
  if (field === "text") return [email.text];
  if (field === "html") return [email.html];
  return email.codes;
}

function isRuleOperator(value: unknown): value is RuleOperator {
  return value === "contains" || value === "exact" || value === "startsWith" || value === "endsWith" || value === "regex";
}

function isSafeRegexPattern(pattern: string): boolean {
  if (pattern.length > MAX_REGEX_PATTERN_LENGTH) return false;
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

function regexMatches(value: string, pattern: string, caseSensitive: boolean): boolean {
  try {
    return new RegExp(pattern, caseSensitive ? "" : "i").test(value);
  } catch {
    return false;
  }
}

function normalize(value: string, caseSensitive: boolean): string {
  return caseSensitive ? value : value.toLowerCase();
}

function expressionGroup(op: "and" | "or", children: RuleExpression[]): RuleExpression | null {
  if (children.length === 0) return null;
  return children.length === 1 ? children[0] : { op, children };
}

function normalizeRuleLogic(value: unknown, fallback: "and" | "or"): "and" | "or" {
  if (value === "all" || value === "and") return "and";
  if (value === "any" || value === "or") return "or";
  return fallback;
}

function evaluateRuleGroupMatch(totalRuleCount: number, matchedRuleCount: number, logic: ShareLinkRuleLogic): boolean {
  if (totalRuleCount === 0) return false;
  return logic === "and" ? matchedRuleCount === totalRuleCount : matchedRuleCount > 0;
}

function parseJson(value: string | null | undefined): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function unique<T>(values: T[]): T[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}
