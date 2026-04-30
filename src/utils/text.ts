const HTML_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " "
};

const INVISIBLE_CHARS = /[\u00ad\u034f\u061c\u200b-\u200f\u202a-\u202e\u2060-\u206f]/g;

export function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p\s*>/gi, "\n")
      .replace(/<\/div\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function cleanEmailBody(value: string): string {
  const lines = value
    .replace(/\r\n?/g, "\n")
    .replace(INVISIBLE_CHARS, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""));
  return collapseBlankLines(removeForwardedHeader(lines)).trim();
}

export function previewText(value: string, length = 600): string {
  const trimmed = cleanEmailBody(value).replace(/\s+/g, " ").trim();
  return trimmed.length > length ? `${trimmed.slice(0, length)}...` : trimmed;
}

export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (entity, body: string) => {
    const normalized = body.toLowerCase();
    if (normalized.startsWith("#x")) {
      return codePointToString(Number.parseInt(normalized.slice(2), 16), entity);
    }
    if (normalized.startsWith("#")) {
      return codePointToString(Number.parseInt(normalized.slice(1), 10), entity);
    }
    return HTML_ENTITY_MAP[normalized] ?? entity;
  });
}

function removeForwardedHeader(lines: string[]): string[] {
  const output: string[] = [];
  let skippingForwardHeader = false;
  for (const line of lines) {
    if (/^-+\s*Forwarded message\s*-+$/i.test(line.trim())) {
      skippingForwardHeader = true;
      continue;
    }
    if (skippingForwardHeader && line.trim() === "") {
      skippingForwardHeader = false;
      continue;
    }
    if (skippingForwardHeader && isForwardHeaderLine(line)) {
      continue;
    }
    skippingForwardHeader = false;
    output.push(line);
  }
  return output;
}

function isForwardHeaderLine(line: string): boolean {
  return /^(发件人|寄件者|收件人|主题|日期|from|to|subject|date)[:：]/i.test(line.trim());
}

function collapseBlankLines(lines: string[]): string {
  const output: string[] = [];
  for (const line of lines) {
    if (line.trim() === "" && output.at(-1)?.trim() === "") {
      continue;
    }
    output.push(line);
  }
  return output.join("\n").replace(/\n{3,}/g, "\n\n");
}

function codePointToString(codePoint: number, fallback: string): string {
  return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : fallback;
}
