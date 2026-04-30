import { describe, expect, it } from "vitest";
import { extractCodes } from "../src/services/codes";

describe("extractCodes", () => {
  it("extracts numeric and alphanumeric access codes", () => {
    const codes = extractCodes({
      subject: "Your Netflix code is 123456",
      text: "Use AB12CD within 15 minutes",
      html: "<b>9988</b>"
    });

    expect(codes.map((item) => item.code)).toEqual(["123456", "AB12CD"]);
  });

  it("deduplicates codes within the same source", () => {
    const codes = extractCodes({ text: "Code 123456. Again: 123456." });
    expect(codes).toEqual([{ code: "123456", source: "text" }]);
  });

  it("prefers clean text and ignores HTML CSS or URL noise", () => {
    const codes = extractCodes({
      subject: "Netflix：您的登录代码",
      text: `Date: 2026年4月27日周一 17:40
输入此代码登录
2220
https://www.netflix.com/browse?g=14440153-6eb4-4b72-a3b7-8a5fc1831963
SRC: 653956AC_14440153-6eb4-4b72-a3b7-8a5fc1831963_zh-CN_TG_EVO`,
      html: `<div style="background:#e5e5e5;width:500px;padding:40px">2220 14440153 6eb4 4b72 A3B7 2BPS8</div>`
    });

    expect(codes).toEqual([{ code: "2220", source: "text" }]);
  });

  it("can extract from stripped HTML when no text body exists", () => {
    const codes = extractCodes({ html: '<p>Your verification code is <b>778899</b></p><div style="width:500px;color:#e5e5e5"></div>' });
    expect(codes).toEqual([{ code: "778899", source: "html" }]);
  });
});
