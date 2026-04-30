import { stripHtml } from "../utils/text";

export type CodeSource = "subject" | "text" | "html";

export interface CodeCandidate {
  code: string;
  source: CodeSource;
}

interface RawMatch {
  code: string;
  index: number;
}

const CODE_PATTERN = /\b(?:\d{4,8}|(?=[A-Za-z0-9]*\d)(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{4,8})\b/g;
const KEYWORD_PATTERN = /(验证码|校验码|动态码|登录代码|代码|code|verification|passcode|otp|security)/i;
const URL_PATTERN = /<?https?:\/\/\S+>?/gi;
const EMAIL_PATTERN = /\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g;
const UUID_PATTERN = /\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b/gi;

export function extractCodesFromText(value: string, source: CodeSource): CodeCandidate[] {
  const searchable = searchableText(value, source);
  const seen = new Set<string>();
  const codes: CodeCandidate[] = [];
  for (const match of rawMatches(searchable)) {
    const code = match.code.toUpperCase();
    if (seen.has(code) || !isUsableCode(code, searchable, match.index)) {
      continue;
    }
    seen.add(code);
    codes.push({ code, source });
  }
  return codes;
}

export function extractCodes(input: { subject?: string | null; text?: string | null; html?: string | null }): CodeCandidate[] {
  const subjectCodes = extractCodesFromText(input.subject ?? "", "subject");
  const textCodes = extractCodesFromText(input.text ?? "", "text");
  const htmlCodes = textCodes.length > 0 ? [] : extractCodesFromText(input.html ?? "", "html");
  return dedupeByCode([...subjectCodes, ...textCodes, ...htmlCodes]);
}

export async function insertCodes(db: D1Database, emailId: number, codes: CodeCandidate[]): Promise<void> {
  if (codes.length === 0) {
    return;
  }
  await db.batch(
    codes.map((code) =>
      db
        .prepare("INSERT INTO email_codes (email_id, code, source) VALUES (?1, ?2, ?3)")
        .bind(emailId, code.code, code.source)
    )
  );
}

function searchableText(value: string, source: CodeSource): string {
  const text = source === "html" ? stripHtml(value) : value;
  return text
    .replace(URL_PATTERN, " ")
    .replace(EMAIL_PATTERN, " ")
    .replace(UUID_PATTERN, " ")
    .split(/\r?\n/)
    .filter((line) => !/^\s*SRC\s*:/i.test(line))
    .join("\n");
}

function rawMatches(value: string): RawMatch[] {
  return [...value.matchAll(CODE_PATTERN)].map((match) => ({ code: match[0], index: match.index ?? 0 }));
}

function isUsableCode(code: string, text: string, index: number): boolean {
  if (isCssUnit(code) || isYear(code) || isGuidSegment(text, index, code.length)) {
    return false;
  }
  if (hasKeywordContext(text, index, code.length)) {
    return true;
  }
  if (/^\d{4}$/.test(code)) {
    return false;
  }
  return /^[A-Z0-9]{5,8}$/i.test(code) && !isLikelyCssColor(code, text, index);
}

function hasKeywordContext(text: string, index: number, length: number): boolean {
  const start = Math.max(0, index - 90);
  const end = Math.min(text.length, index + length + 90);
  return KEYWORD_PATTERN.test(text.slice(start, end));
}

function isCssUnit(code: string): boolean {
  return /^\d{1,4}PX$/i.test(code);
}

function isYear(code: string): boolean {
  const value = Number(code);
  return /^\d{4}$/.test(code) && value >= 1900 && value <= 2099;
}

function isGuidSegment(text: string, index: number, length: number): boolean {
  return text[index - 1] === "-" || text[index + length] === "-" || text[index - 1] === "_" || text[index + length] === "_";
}

function isLikelyCssColor(code: string, text: string, index: number): boolean {
  return /^[A-F0-9]{6}$/i.test(code) && /[#:]\s*$/i.test(text.slice(Math.max(0, index - 3), index));
}

function dedupeByCode(candidates: CodeCandidate[]): CodeCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.code)) {
      return false;
    }
    seen.add(candidate.code);
    return true;
  });
}
