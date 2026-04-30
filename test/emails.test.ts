import { describe, expect, it } from "vitest";
import { listEmailPage } from "../src/services/emails";
import type { EmailSummary } from "../src/types";

function emailSummary(id: number): EmailSummary {
  return {
    id,
    message_id: `message-${id}`,
    envelope_from: "sender@example.com",
    envelope_to: "receiver@example.com",
    from_address: "sender@example.com",
    to_addresses_json: "[]",
    subject: `Email ${id}`,
    sent_at: null,
    received_at: `2026-04-30T00:00:0${id}.000Z`,
    raw_size: 100,
    has_attachments: 0,
    attachment_count: 0,
    attachments_json: "[]",
    content_truncated: 0,
    parse_status: "parsed",
    created_at: `2026-04-30T00:00:0${id}.000Z`,
    codes: id % 2 === 0 ? "246810" : null
  };
}

function emailDb(rows: EmailSummary[]): D1Database {
  return {
    prepare(sql: string) {
      let bindings: unknown[] = [];
      const statement = {
        bind: (...values: unknown[]) => {
          bindings = values;
          return statement;
        },
        first: async () => (sql.includes("COUNT(*)") ? { count: rows.length } : null),
        all: async () => {
          if (!sql.includes("SELECT e.*")) return { results: [] };
          const limit = Number(bindings.at(-2));
          const offset = Number(bindings.at(-1));
          return { results: rows.slice(offset, offset + limit) };
        },
        run: async () => ({ meta: { last_row_id: 0 } })
      };
      return statement;
    }
  } as unknown as D1Database;
}

describe("email pagination", () => {
  it("returns the requested page slice and pagination metadata", async () => {
    const rows = [5, 4, 3, 2, 1].map(emailSummary);
    const result = await listEmailPage(emailDb(rows), { page: 2, limit: 2 });

    expect(result.emails.map((email) => email.id)).toEqual([3, 2]);
    expect(result.pagination).toEqual({
      page: 2,
      pageSize: 2,
      total: 5,
      totalPages: 3,
      hasPreviousPage: true,
      hasNextPage: true
    });
  });

  it("normalizes out-of-range pages to the last available page", async () => {
    const rows = [3, 2, 1].map(emailSummary);
    const result = await listEmailPage(emailDb(rows), { page: 99, limit: 2 });

    expect(result.emails.map((email) => email.id)).toEqual([1]);
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.hasNextPage).toBe(false);
  });
});
