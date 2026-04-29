export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function previewText(value: string, length = 600): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > length ? `${trimmed.slice(0, length)}...` : trimmed;
}
