export type CodeSource = "subject" | "text" | "html";

export interface CodeCandidate {
  code: string;
  source: CodeSource;
}

const CODE_PATTERN = /\b(?:\d{4,8}|(?=[A-Za-z0-9]*\d)(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{4,8})\b/g;

export function extractCodesFromText(value: string, source: CodeSource): CodeCandidate[] {
  const matches = value.match(CODE_PATTERN) ?? [];
  const seen = new Set<string>();
  const codes: CodeCandidate[] = [];
  for (const match of matches) {
    const code = match.toUpperCase();
    const key = `${source}:${code}`;
    if (!seen.has(key)) {
      seen.add(key);
      codes.push({ code, source });
    }
  }
  return codes;
}

export function extractCodes(input: { subject?: string | null; text?: string | null; html?: string | null }): CodeCandidate[] {
  const seen = new Set<string>();
  const candidates = [
    ...extractCodesFromText(input.subject ?? "", "subject"),
    ...extractCodesFromText(input.text ?? "", "text"),
    ...extractCodesFromText(input.html ?? "", "html")
  ];
  return candidates.filter((candidate) => {
    const key = `${candidate.source}:${candidate.code}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
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
