export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function page(title: string, body: string, script = ""): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>${styles()}</style>
</head>
<body>
${body}
${script ? `<script>${script}</script>` : ""}
</body>
</html>`;
}

const BASE_STYLES = String.raw`
:root {
  color-scheme: light;
  --bg: #f6f7f9;
  --surface: #ffffff;
  --text: #1b1f24;
  --muted: #65707f;
  --line: #d9dee7;
  --accent: #0b63ce;
  --danger: #b42318;
  --ok: #047857;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}
main { width: min(1180px, calc(100vw - 32px)); margin: 24px auto; }
section {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}
h1, h2, h3 { margin: 0; line-height: 1.2; }
h1 { font-size: 20px; }
h2 { font-size: 16px; margin-bottom: 12px; }
h3 { font-size: 14px; margin-bottom: 8px; }
.grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }
.span-4 { grid-column: span 4; }
.span-5 { grid-column: span 5; }
.span-7 { grid-column: span 7; }
.span-8 { grid-column: span 8; }
.span-12 { grid-column: span 12; }
label { display: block; color: var(--muted); font-size: 12px; margin: 10px 0 4px; }
input, select, textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 9px 10px;
  background: #fff;
  color: var(--text);
  font: inherit;
}
textarea { min-height: 78px; resize: vertical; }
button {
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
  border-radius: 6px;
  padding: 9px 12px;
  font: inherit;
  cursor: pointer;
}
button.secondary { background: #fff; color: var(--accent); }
button.danger { background: var(--danger); border-color: var(--danger); }
button:disabled { opacity: 0.55; cursor: not-allowed; }
.toolbar { display: flex; gap: 8px; align-items: end; flex-wrap: wrap; }
.toolbar > * { min-width: 160px; }
.muted { color: var(--muted); }
.ok { color: var(--ok); }
.danger-text { color: var(--danger); }
.hidden { display: none !important; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid var(--line); padding: 9px 8px; text-align: left; vertical-align: top; }
th { color: var(--muted); font-weight: 600; font-size: 12px; }
tr[data-id] { cursor: pointer; }
pre {
  white-space: pre-wrap;
  word-break: break-word;
  background: #f9fafb;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 12px;
  max-height: 360px;
  overflow: auto;
}
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 2px 8px;
  color: var(--muted);
  background: #fff;
}
.code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 18px;
  letter-spacing: 0;
  color: var(--accent);
}
@media (max-width: 820px) {
  header { padding: 14px 16px; align-items: flex-start; flex-direction: column; }
  main { width: min(100vw - 20px, 1180px); margin-top: 12px; }
  .grid { display: block; }
  .toolbar > * { min-width: 100%; }
  th:nth-child(4), td:nth-child(4) { display: none; }
}`;

function styles(): string {
  return BASE_STYLES;
}
