import { CONTENT_CHUNK_BYTES, DEFAULT_MAX_EMAIL_HEADERS_BYTES } from "../constants";
import { utf8ByteLength } from "../utils/encoding";

export type ContentKind = "headers" | "text" | "html";

export interface ContentChunkInput {
  kind: ContentKind;
  chunkIndex: number;
  content: string;
}

export interface PreparedContent {
  chunks: ContentChunkInput[];
  content: Record<ContentKind, string>;
  truncated: boolean;
}

export interface ContentLimits {
  bodyBytes: number;
  headersBytes?: number;
}

export function takeUtf8Bytes(value: string, maxBytes: number): string {
  if (maxBytes <= 0) {
    return "";
  }
  let used = 0;
  let result = "";
  for (const char of value) {
    const size = utf8ByteLength(char);
    if (used + size > maxBytes) {
      break;
    }
    result += char;
    used += size;
  }
  return result;
}

export function splitUtf8Chunks(value: string, maxBytes = CONTENT_CHUNK_BYTES): string[] {
  const chunks: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const char of value) {
    const size = utf8ByteLength(char);
    if (current && currentBytes + size > maxBytes) {
      chunks.push(current);
      current = "";
      currentBytes = 0;
    }
    current += char;
    currentBytes += size;
  }
  if (current) {
    chunks.push(current);
  }
  return chunks;
}

export function prepareContentChunks(input: Record<ContentKind, string>, limits: ContentLimits): PreparedContent {
  const chunks: ContentChunkInput[] = [];
  const content: Record<ContentKind, string> = { headers: "", text: "", html: "" };
  const headerLimit = Math.max(0, limits.headersBytes ?? DEFAULT_MAX_EMAIL_HEADERS_BYTES);
  let remainingBody = Math.max(0, limits.bodyBytes);
  let truncated = false;

  const headers = input.headers ?? "";
  content.headers = takeUtf8Bytes(headers, headerLimit);
  truncated ||= content.headers.length < headers.length;
  appendChunks(chunks, "headers", content.headers);

  for (const kind of ["text", "html"] as const) {
    const original = input[kind] ?? "";
    const allowed = takeUtf8Bytes(original, remainingBody);
    if (allowed.length < original.length) {
      truncated = true;
    }
    content[kind] = allowed;
    remainingBody -= utf8ByteLength(allowed);
    appendChunks(chunks, kind, allowed);
  }

  return { chunks, content, truncated };
}

export function reconstructContent(chunks: ContentChunkInput[]): Record<ContentKind, string> {
  const output: Record<ContentKind, string> = { headers: "", text: "", html: "" };
  const sorted = [...chunks].sort((a, b) => a.chunkIndex - b.chunkIndex);
  for (const chunk of sorted) {
    output[chunk.kind] += chunk.content;
  }
  return output;
}

export async function insertContentChunks(db: D1Database, emailId: number, chunks: ContentChunkInput[]): Promise<void> {
  if (chunks.length === 0) {
    return;
  }
  await db.batch(
    chunks.map((chunk) =>
      db
        .prepare("INSERT INTO email_content_chunks (email_id, kind, chunk_index, content) VALUES (?1, ?2, ?3, ?4)")
        .bind(emailId, chunk.kind, chunk.chunkIndex, chunk.content)
    )
  );
}

export async function getContentChunks(db: D1Database, emailId: number): Promise<ContentChunkInput[]> {
  const result = await db
    .prepare("SELECT kind, chunk_index, content FROM email_content_chunks WHERE email_id = ?1 ORDER BY kind, chunk_index")
    .bind(emailId)
    .all<{ kind: ContentKind; chunk_index: number; content: string }>();
  return result.results.map((row) => ({ kind: row.kind, chunkIndex: row.chunk_index, content: row.content }));
}

function appendChunks(chunks: ContentChunkInput[], kind: ContentKind, value: string): void {
  splitUtf8Chunks(value).forEach((content, chunkIndex) => {
    chunks.push({ kind, chunkIndex, content });
  });
}
