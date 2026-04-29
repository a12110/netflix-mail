import PostalMime from "postal-mime";
import { describe, expect, it } from "vitest";

describe("PostalMime parsing", () => {
  it("parses multipart email and exposes attachment metadata", async () => {
    const raw = `From: Netflix <no-reply@netflix.example>
To: user@example.com
Subject: Your temporary access code 123456
Content-Type: multipart/mixed; boundary="boundary"

--boundary
Content-Type: text/plain; charset=utf-8

Use 123456 to sign in.
--boundary
Content-Type: text/html; charset=utf-8

<p>Use <b>123456</b> to sign in.</p>
--boundary
Content-Type: application/pdf
Content-Disposition: attachment; filename="receipt.pdf"
Content-Transfer-Encoding: base64

JVBERi0xLjQK
--boundary--`;

    const email = await PostalMime.parse(raw, { attachmentEncoding: "base64" });
    expect(email.subject).toContain("123456");
    expect(email.text).toContain("Use 123456");
    expect(email.html).toContain("<b>123456</b>");
    expect(email.attachments).toHaveLength(1);
    expect(email.attachments[0]?.filename).toBe("receipt.pdf");
  });
});
