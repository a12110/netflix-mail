import { describe, expect, it } from "vitest";
import worker from "../src/index";
import type { Env } from "../src/types";

function createSetupDb(count = 0): { db: D1Database; runCount: () => number } {
  let writes = 0;
  const db = {
    prepare(sql: string) {
      const statement = {
        bind: () => statement,
        first: async () => (sql.includes("COUNT(*)") ? { count } : null),
        run: async () => {
          writes += 1;
          return { meta: { last_row_id: 1 } };
        },
        all: async () => ({ results: [] })
      };
      return statement;
    }
  } as unknown as D1Database;
  return { db, runCount: () => writes };
}

describe("admin setup routes", () => {
  it("rejects whitespace-only usernames before creating the first admin", async () => {
    const { db, runCount } = createSetupDb();
    const request = new Request("http://localhost/api/setup/admin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ setupToken: "setup-secret", username: "   ", password: "longpassword" })
    });

    const response = await worker.fetch(request, { DB: db, ADMIN_SETUP_TOKEN: "setup-secret" } as Env);
    const body = await response.json() as { ok: boolean; error?: string };

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(runCount()).toBe(0);
  });
});
