import { describe, expect, it } from "vitest";
import { prepareContentChunks, reconstructContent, splitUtf8Chunks, takeUtf8Bytes } from "../src/services/content";

describe("content chunks", () => {
  it("splits and reconstructs utf8 content", () => {
    const chunks = splitUtf8Chunks("验证码1234中文", 8);
    const rebuilt = chunks.join("");
    expect(rebuilt).toBe("验证码1234中文");
  });

  it("truncates without splitting utf8 characters", () => {
    expect(takeUtf8Bytes("你好ab", 7)).toBe("你好a");
  });

  it("prepares content chunks and reports truncation", () => {
    const prepared = prepareContentChunks({ headers: "{}", text: "abcdef", html: "ghijkl" }, { bodyBytes: 8 });
    expect(prepared.truncated).toBe(true);
    expect(reconstructContent(prepared.chunks).headers).toBe("{}");
    expect(reconstructContent(prepared.chunks).text).toBe("abcdef");
    expect(reconstructContent(prepared.chunks).html).toBe("gh");
  });

  it("does not let large headers consume the body budget", () => {
    const prepared = prepareContentChunks(
      { headers: "header-header", text: "abcdef", html: "ghijkl" },
      { headersBytes: 6, bodyBytes: 8 }
    );
    const content = reconstructContent(prepared.chunks);

    expect(prepared.truncated).toBe(true);
    expect(content.headers).toBe("header");
    expect(content.text).toBe("abcdef");
    expect(content.html).toBe("gh");
    expect(prepared.content).toEqual(content);
  });
});
