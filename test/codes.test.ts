import { describe, expect, it } from "vitest";
import { extractCodes } from "../src/services/codes";

describe("extractCodes", () => {
  it("extracts numeric and alphanumeric access codes", () => {
    const codes = extractCodes({
      subject: "Your Netflix code is 123456",
      text: "Use AB12CD within 15 minutes",
      html: "<b>9988</b>"
    });

    expect(codes.map((item) => item.code)).toEqual(["123456", "AB12CD", "9988"]);
  });

  it("deduplicates codes within the same source", () => {
    const codes = extractCodes({ text: "Code 123456. Again: 123456." });
    expect(codes).toEqual([{ code: "123456", source: "text" }]);
  });
});
