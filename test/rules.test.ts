import { describe, expect, it } from "vitest";
import { evaluateRuleSet, matchesAnyRule, matchesRule, parseRuleFields, sanitizeRuleInput } from "../src/services/rules";
import type { RuleRow } from "../src/types";

const baseRule: RuleRow = {
  id: 1,
  name: "Netflix",
  fields_json: JSON.stringify(["subject", "code"]),
  keyword: "netflix",
  match_mode: "contains",
  case_sensitive: 0,
  enabled: 1,
  action: "allow",
  expression_json: null,
  schema_version: 2,
  created_at: "2026-04-28T00:00:00.000Z",
  updated_at: "2026-04-28T00:00:00.000Z"
};

const email = {
  fromAddress: "no-reply@example.com",
  envelopeTo: "codes@example.com",
  toAddresses: ["codes@example.com"],
  subject: "Netflix temporary access code",
  text: "Your code is 123456.",
  html: "",
  codes: ["123456"]
};

describe("rules", () => {
  it("parses only allowed fields", () => {
    expect(parseRuleFields('["subject","bad","code"]')).toEqual(["subject", "code"]);
  });

  it("matches legacy configured fields case-insensitively", () => {
    expect(matchesRule(email, baseRule)).toBe(true);
  });

  it("supports exact code matching", () => {
    const rule = { ...baseRule, fields_json: JSON.stringify(["code"]), keyword: "123456", match_mode: "exact" as const };
    expect(matchesAnyRule(email, [rule])).toBe(true);
  });

  it("ignores disabled rules", () => {
    expect(matchesRule(email, { ...baseRule, enabled: 0 })).toBe(false);
  });

  it("allows only when allow matches and block does not match", () => {
    const allow = { ...baseRule, id: 1, action: "allow" as const };
    const block = { ...baseRule, id: 2, action: "block" as const, keyword: "phishing" };

    expect(evaluateRuleSet(email, [allow, block])).toMatchObject({ allowed: true, blocked: false, visible: true });
  });

  it("hides email when a bound block rule also matches", () => {
    const allow = { ...baseRule, id: 1, action: "allow" as const };
    const block = { ...baseRule, id: 2, action: "block" as const, keyword: "temporary access" };

    expect(evaluateRuleSet(email, [allow, block])).toMatchObject({ allowed: true, blocked: true, visible: false });
  });

  it("does not show emails that only match block rules", () => {
    const block = { ...baseRule, id: 2, action: "block" as const, keyword: "netflix" };

    expect(evaluateRuleSet(email, [block])).toMatchObject({ allowed: false, blocked: true, visible: false });
  });

  it("evaluates share-link allow rules with OR and AND logic", () => {
    const subjectRule = { ...baseRule, id: 1, action: "allow" as const, keyword: "Netflix" };
    const codeRule = { ...baseRule, id: 2, action: "allow" as const, fields_json: JSON.stringify(["code"]), keyword: "123456", match_mode: "exact" as const };
    const missRule = { ...baseRule, id: 3, action: "allow" as const, keyword: "Disney" };

    expect(evaluateRuleSet(email, [subjectRule, missRule], { allowRuleLogic: "or" })).toMatchObject({ allowed: true, visible: true });
    expect(evaluateRuleSet(email, [subjectRule, missRule], { allowRuleLogic: "and" })).toMatchObject({ allowed: false, visible: false });
    expect(evaluateRuleSet(email, [subjectRule, codeRule], { allowRuleLogic: "and" })).toMatchObject({ allowed: true, visible: true });
  });

  it("evaluates share-link block rules with OR and AND logic", () => {
    const allow = { ...baseRule, id: 1, action: "allow" as const };
    const subjectBlock = { ...baseRule, id: 2, action: "block" as const, keyword: "temporary access" };
    const missBlock = { ...baseRule, id: 3, action: "block" as const, keyword: "phishing" };
    const codeBlock = { ...baseRule, id: 4, action: "block" as const, fields_json: JSON.stringify(["code"]), keyword: "123456", match_mode: "exact" as const };

    expect(evaluateRuleSet(email, [allow, subjectBlock, missBlock], { blockRuleLogic: "or" })).toMatchObject({ blocked: true, visible: false });
    expect(evaluateRuleSet(email, [allow, subjectBlock, missBlock], { blockRuleLogic: "and" })).toMatchObject({ blocked: false, visible: true });
    expect(evaluateRuleSet(email, [allow, subjectBlock, codeBlock], { blockRuleLogic: "and" })).toMatchObject({ blocked: true, visible: false });
  });

  it("does not count disabled rules toward share-link AND logic", () => {
    const allow = { ...baseRule, id: 1, action: "allow" as const };
    const disabledMiss = { ...baseRule, id: 2, action: "allow" as const, enabled: 0, keyword: "Disney" };

    expect(evaluateRuleSet(email, [allow, disabledMiss], { allowRuleLogic: "and" })).toMatchObject({ allowed: true, visible: true });
  });

  it("matches nested expression rules", () => {
    const rule = {
      ...baseRule,
      expression_json: JSON.stringify({
        op: "and",
        children: [
          { op: "condition", field: "subject", operator: "contains", value: "Netflix" },
          { op: "not", child: { op: "condition", field: "from", operator: "contains", value: "spam" } }
        ]
      })
    };

    expect(matchesRule(email, rule)).toBe(true);
  });

  it("evaluates AND and OR expression branches distinctly", () => {
    const andRule = {
      ...baseRule,
      expression_json: JSON.stringify({
        op: "and",
        children: [
          { op: "condition", field: "subject", operator: "contains", value: "Netflix" },
          { op: "condition", field: "code", operator: "exact", value: "000000" }
        ]
      })
    };
    const orRule = {
      ...baseRule,
      expression_json: JSON.stringify({
        op: "or",
        children: [
          { op: "condition", field: "subject", operator: "contains", value: "Netflix" },
          { op: "condition", field: "code", operator: "exact", value: "000000" }
        ]
      })
    };

    expect(matchesRule(email, andRule)).toBe(false);
    expect(matchesRule(email, orRule)).toBe(true);
  });

  it("honors legacy quick-rule AND/OR logic when no expression JSON is provided", () => {
    const anyFieldAllKeywords = sanitizeRuleInput({
      name: "Quick AND",
      action: "allow",
      keyword: "Netflix\n123456",
      fields: ["subject", "code"],
      keywordLogic: "all",
      fieldLogic: "any"
    });
    const allFieldsAnyKeyword = sanitizeRuleInput({
      name: "Quick field AND",
      action: "allow",
      keyword: "Netflix",
      fields: ["subject", "code"],
      keywordLogic: "any",
      fieldLogic: "all"
    });

    expect(anyFieldAllKeywords).not.toBeNull();
    expect(allFieldsAnyKeyword).not.toBeNull();
    expect(matchesRule(email, { ...baseRule, expression_json: JSON.stringify(anyFieldAllKeywords?.expression) })).toBe(true);
    expect(matchesRule(email, { ...baseRule, expression_json: JSON.stringify(allFieldsAnyKeyword?.expression) })).toBe(false);
  });

  it("supports regex expression and rejects invalid regex input", () => {
    const valid = sanitizeRuleInput({
      name: "Regex",
      action: "allow",
      expression: { op: "condition", field: "code", operator: "regex", value: "^\\d{6}$" }
    });
    const invalid = sanitizeRuleInput({
      name: "Bad Regex",
      action: "allow",
      expression: { op: "condition", field: "code", operator: "regex", value: "[" }
    });

    expect(valid?.expression).toEqual({ op: "condition", field: "code", operator: "regex", value: "^\\d{6}$", caseSensitive: false });
    expect(invalid).toBeNull();
  });
});
