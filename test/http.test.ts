import { describe, expect, it } from "vitest";
import { clampNumber } from "../src/utils/http";

describe("clampNumber", () => {
  it("uses fallback for missing or empty values", () => {
    expect(clampNumber(null, 50, 1, 100)).toBe(50);
    expect(clampNumber(undefined, 50, 1, 100)).toBe(50);
    expect(clampNumber("", 50, 1, 100)).toBe(50);
    expect(clampNumber("   ", 50, 1, 100)).toBe(50);
  });

  it("clamps valid numeric values to the configured range", () => {
    expect(clampNumber("0", 50, 1, 100)).toBe(1);
    expect(clampNumber("25", 50, 1, 100)).toBe(25);
    expect(clampNumber("999", 50, 1, 100)).toBe(100);
  });
});
