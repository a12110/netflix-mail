import { describe, expect, it } from "vitest";
import { matchesAnyRule, matchesRule, parseRuleFields } from "../src/services/rules";
import type { RuleRow } from "../src/types";

const baseRule: RuleRow = {
  id: 1,
  name: "Netflix",
  fields_json: JSON.stringify(["subject", "code"]),
  keyword: "netflix",
  match_mode: "contains",
  case_sensitive: 0,
  enabled: 1,
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

  it("matches configured fields case-insensitively", () => {
    expect(matchesRule(email, baseRule)).toBe(true);
  });

  it("supports exact code matching", () => {
    const rule = { ...baseRule, fields_json: JSON.stringify(["code"]), keyword: "123456", match_mode: "exact" as const };
    expect(matchesAnyRule(email, [rule])).toBe(true);
  });

  it("ignores disabled rules", () => {
    expect(matchesRule(email, { ...baseRule, enabled: 0 })).toBe(false);
  });
});
