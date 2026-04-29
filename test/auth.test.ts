import { describe, expect, it } from "vitest";
import { PASSWORD_ITERATIONS, PASSWORD_MAX_ITERATIONS } from "../src/constants";
import { hashPassword, verifyPassword } from "../src/services/auth";

describe("password hashing", () => {
  it("uses an iteration count supported by Cloudflare Workers", async () => {
    const passwordHash = await hashPassword("longpassword");
    const [, iterationsText] = passwordHash.split("$");

    expect(Number(iterationsText)).toBe(PASSWORD_ITERATIONS);
    expect(PASSWORD_ITERATIONS).toBeLessThanOrEqual(PASSWORD_MAX_ITERATIONS);
  });

  it("rejects stored hashes with unsupported iteration counts", async () => {
    const passwordHash = await hashPassword("longpassword");
    const parts = passwordHash.split("$");
    parts[1] = String(PASSWORD_MAX_ITERATIONS + 1);

    await expect(verifyPassword("longpassword", parts.join("$"))).resolves.toBe(false);
  });
});
