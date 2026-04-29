import { describe, expect, it } from "vitest";
import { base64DecodedByteLength } from "../src/utils/encoding";

describe("base64DecodedByteLength", () => {
  it("subtracts base64 padding from decoded byte length", () => {
    expect(base64DecodedByteLength("TQ==")).toBe(1);
    expect(base64DecodedByteLength("TWE=")).toBe(2);
    expect(base64DecodedByteLength("TWFu")).toBe(3);
  });

  it("ignores folded whitespace in base64 content", () => {
    expect(base64DecodedByteLength("TQ==\r\n")).toBe(1);
  });
});
