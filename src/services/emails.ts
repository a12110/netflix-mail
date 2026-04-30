import PostalMime from "postal-mime";
import type { Address, Attachment, Email, Mailbox } from "postal-mime";
import { DEFAULT_EMAIL_LIMIT, DEFAULT_MAX_EMAIL_BODY_BYTES, DEFAULT_MAX_EMAIL_HEADERS_BYTES, MAX_EMAIL_LIMIT } from "../constants";
import type { EmailCodeRow, EmailRow, EmailSummary, Env } from "../types";
import { extractCodes, insertCodes, type CodeCandidate } from "./codes";
import {
  getContentChunks,
  insertContentChunks,
  prepareContentChunks,
  reconstructContent,
  type ContentKind
} from "./content";
import type { EmailForRuleMatching } from "./rules";
import { takeUtf8Bytes } from "./content";
import { base64DecodedByteLength, utf8ByteLength } from "../utils/encoding";
import { nowIso } from "../utils/time";

export interface EmailDetail extends EmailRow {
  toAddresses: string[];
  attachments: AttachmentMeta[];
  content: Record<ContentKind, string>;
  codes: EmailCodeRow[];
}

export interface AttachmentMeta {
  filename: string | null;
  mimeType: string | null;
  disposition: string | null;
  related: boolean;
  contentId: string | null;
  size: number | null;
}

interface EmailListOptions {
  q?: string | null;
  limit?: number;
}

export async function storeInboundEmail(message: ForwardableEmailMessage, env: Env): Promise<number> {
  const receivedAt = nowIso();
  const parsed = await PostalMime.parse(message.raw, { attachmentEncoding: "base64", maxNestingDepth: 64 });
  const email = parsed as Email;
  const text = email.text ?? "";
  const html = email.html ?? "";
  const headersJson = JSON.stringify(email.headers ?? []);
  const prepared = prepareContentChunks(
    { headers: headersJson, text, html },
    { bodyBytes: maxEmailBodyBytes(env), headersBytes: maxEmailHeadersBytes(env) }
  );
  const attachments = attachmentMetadata(email.attachments ?? []);
  const codes = extractCodes({ subject: email.subject, text: prepared.content.text, html: prepared.content.html });

  const result = await env.DB.prepare(
    `INSERT INTO emails
      (message_id, envelope_from, envelope_to, from_address, to_addresses_json, subject, sent_at, received_at,
       raw_size, has_attachments, attachment_count, attachments_json, content_truncated, parse_status)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 'parsed')`
  )
    .bind(
      email.messageId ?? message.headers.get("message-id"),
      message.from,
      message.to,
      addressToString(email.from),
      JSON.stringify(addressesToStrings(email.to)),
      email.subject ?? null,
      toIsoDate(email.date),
      receivedAt,
      message.rawSize,
      attachments.length > 0 ? 1 : 0,
      attachments.length,
      JSON.stringify(attachments),
      prepared.truncated ? 1 : 0
    )
    .run();

  const emailId = Number(result.meta.last_row_id);
  await insertContentChunks(env.DB, emailId, prepared.chunks);
  await insertCodes(env.DB, emailId, codes);
  return emailId;
}

export async function listEmails(db: D1Database, options: EmailListOptions = {}): Promise<EmailSummary[]> {
  const limit = clampLimit(options.limit);
  const params: Array<string | number> = [];
  const where: string[] = [];
  const q = safeLikePattern(options.q);
  if (q) {
    where.push(
      "(e.subject LIKE ? ESCAPE '\\' OR e.from_address LIKE ? ESCAPE '\\' OR e.envelope_to LIKE ? ESCAPE '\\')"
    );
    params.push(q, q, q);
  }
  params.push(limit);
  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const result = await db
    .prepare(
      `SELECT e.*,
        (SELECT group_concat(code, ', ') FROM email_codes WHERE email_id = e.id) AS codes
       FROM emails e
       ${whereSql}
       ORDER BY e.received_at DESC
       LIMIT ?`
    )
    .bind(...params)
    .all<EmailSummary>();
  return result.results;
}

export async function getEmailDetail(db: D1Database, id: number): Promise<EmailDetail | null> {
  const row = await db.prepare("SELECT * FROM emails WHERE id = ?1").bind(id).first<EmailRow>();
  if (!row) {
    return null;
  }
  const [chunks, storedCodes] = await Promise.all([getContentChunks(db, id), listCodes(db, id)]);
  const content = reconstructContent(chunks);
  const codes = materializeCodeRows(id, storedCodes, extractCodes({ subject: row.subject, text: content.text, html: content.html }));
  return {
    ...row,
    toAddresses: parseJsonArray(row.to_addresses_json),
    attachments: parseJsonArray<AttachmentMeta>(row.attachments_json),
    content,
    codes
  };
}

export async function listCandidateEmailDetailsSince(
  db: D1Database,
  sinceIso: string,
  limit = MAX_EMAIL_LIMIT
): Promise<EmailDetail[]> {
  const result = await db
    .prepare("SELECT id FROM emails WHERE received_at >= ?1 ORDER BY received_at DESC LIMIT ?2")
    .bind(sinceIso, clampLimit(limit))
    .all<{ id: number }>();
  const details = await Promise.all(result.results.map((row) => getEmailDetail(db, row.id)));
  return details.filter((detail): detail is EmailDetail => detail !== null);
}

export function emailDetailToRuleInput(email: EmailDetail): EmailForRuleMatching {
  return {
    fromAddress: email.from_address,
    envelopeTo: email.envelope_to,
    toAddresses: email.toAddresses,
    subject: email.subject,
    text: email.content.text,
    html: email.content.html,
    codes: email.codes.map((code) => code.code)
  };
}

function maxEmailBodyBytes(env: Env): number {
  const parsed = Number(env.MAX_EMAIL_CONTENT_BYTES);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_MAX_EMAIL_BODY_BYTES;
}

function maxEmailHeadersBytes(env: Env): number {
  const parsed = Number(env.MAX_EMAIL_HEADERS_BYTES);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_MAX_EMAIL_HEADERS_BYTES;
}

function clampLimit(value: number | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_EMAIL_LIMIT;
  }
  return Math.min(MAX_EMAIL_LIMIT, Math.max(1, Math.floor(parsed)));
}

function safeLikePattern(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  const term = takeUtf8Bytes(trimmed, 40).replace(/[\\%_]/g, (match) => `\\${match}`);
  return `%${term}%`;
}

function isMailbox(address: Address): address is Mailbox {
  return !("group" in address) || !address.group;
}

function addressToString(address: Address | null | undefined): string | null {
  if (!address) {
    return null;
  }
  if (isMailbox(address)) {
    return address.address || null;
  }
  return address.group.map((mailbox) => mailbox.address).filter(Boolean).join(", ") || null;
}

function addressesToStrings(addresses: Address[] | null | undefined): string[] {
  return (addresses ?? []).flatMap((address) => {
    const text = addressToString(address);
    return text ? [text] : [];
  });
}

function attachmentMetadata(attachments: Attachment[]): AttachmentMeta[] {
  return attachments.map((attachment) => ({
    filename: attachment.filename ?? null,
    mimeType: attachment.mimeType ?? null,
    disposition: attachment.disposition ?? null,
    related: Boolean(attachment.related),
    contentId: attachment.contentId ?? null,
    size: attachmentSize(attachment)
  }));
}

function attachmentSize(attachment: Attachment): number | null {
  const content = attachment.content as unknown;
  if (content instanceof ArrayBuffer) {
    return content.byteLength;
  }
  if (typeof content === "string") {
    return attachment.encoding === "base64" ? base64DecodedByteLength(content) : utf8ByteLength(content);
  }
  return null;
}

function toIsoDate(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseJsonArray<T = string>(value: string): T[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}


function materializeCodeRows(emailId: number, storedRows: EmailCodeRow[], candidates: CodeCandidate[]): EmailCodeRow[] {
  return candidates.map((candidate, index) => {
    const stored = storedRows.find((row) => row.code === candidate.code && row.source === candidate.source);
    return stored ?? { id: 0 - index, email_id: emailId, code: candidate.code, source: candidate.source, created_at: "" };
  });
}

async function listCodes(db: D1Database, emailId: number): Promise<EmailCodeRow[]> {
  const result = await db
    .prepare("SELECT * FROM email_codes WHERE email_id = ?1 ORDER BY id")
    .bind(emailId)
    .all<EmailCodeRow>();
  return result.results;
}
