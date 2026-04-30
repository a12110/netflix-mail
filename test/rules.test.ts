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
