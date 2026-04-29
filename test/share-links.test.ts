import { describe, expect, it } from "vitest";
import { hashShareToken, isShareLinkUsable } from "../src/services/share-links";
import type { ShareLinkRow } from "../src/types";

const link: ShareLinkRow = {
  id: 1,
  name: "Visitor",
  token_hash: "hash",
  expires_at: null,
  status: "active",
  window_minutes: 30,
  created_by_admin_id: 1,
  created_at: "2026-04-28T00:00:00.000Z",
  last_accessed_at: null
};

describe("share links", () => {
  it("hashes tokens deterministically without storing raw token", async () => {
    await expect(hashShareToken("secret-token")).resolves.toBe(await hashShareToken("secret-token"));
    await expect(hashShareToken("secret-token")).resolves.not.toBe("secret-token");
  });

  it("checks status and expiration", () => {
    expect(isShareLinkUsable(link)).toBe(true);
    expect(isShareLinkUsable({ ...link, status: "disabled" })).toBe(false);
    expect(isShareLinkUsable({ ...link, expires_at: "2020-01-01T00:00:00.000Z" })).toBe(false);
  });
});
