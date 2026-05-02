import { MAIL_STYLES } from "./mail-styles";

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
  --bg: #f3f8ff;
  --bg-soft: #eef6ff;
  --surface: rgba(255, 255, 255, 0.92);
  --surface-solid: #ffffff;
  --surface-muted: #f8fbff;
  --text: #0f172a;
  --muted: #64748b;
  --muted-strong: #475569;
  --line: #dbe7f6;
  --line-strong: #c6d8ef;
  --primary: #0b74de;
  --primary-dark: #075fb8;
  --primary-soft: #e8f2ff;
  --success: #16a34a;
  --success-soft: #dcfce7;
  --warning: #f59e0b;
  --warning-soft: #fff7ed;
  --danger: #dc2626;
  --danger-soft: #fef2f2;
  --shadow-sm: 0 8px 24px rgba(15, 23, 42, 0.06);
  --shadow-md: 0 18px 50px rgba(15, 23, 42, 0.10);
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --sidebar: 260px;
}
* { box-sizing: border-box; }
html { min-height: 100%; }
body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at 8% 18%, rgba(59, 130, 246, 0.13), transparent 28%),
    radial-gradient(circle at 88% 10%, rgba(14, 165, 233, 0.10), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, var(--bg) 100%);
  color: var(--text);
  font: 14px/1.55 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
a { color: var(--primary); text-decoration: none; }
a:hover { color: var(--primary-dark); }
h1, h2, h3, p { margin: 0; }
h1 { font-size: clamp(28px, 3vw, 40px); line-height: 1.15; letter-spacing: -0.04em; }
h2 { font-size: 18px; line-height: 1.25; letter-spacing: -0.02em; }
h3 { font-size: 15px; line-height: 1.35; }
main { width: min(1280px, calc(100vw - 32px)); margin: 28px auto; }
section, .card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
section { padding: 22px; margin-bottom: 18px; }
label { display: block; color: var(--muted-strong); font-weight: 650; font-size: 13px; margin: 14px 0 7px; }
input, select, textarea {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.86);
  color: var(--text);
  font: inherit;
  outline: none;
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}
input::placeholder, textarea::placeholder { color: #94a3b8; }
input:focus, select:focus, textarea:focus {
  border-color: rgba(11, 116, 222, 0.72);
  box-shadow: 0 0 0 4px rgba(11, 116, 222, 0.12);
  background: #fff;
}
input[type="checkbox"], input[type="radio"] {
  width: 16px;
  min-height: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--primary);
}
textarea { min-height: 96px; resize: vertical; }
button, .button-link {
  min-height: 44px;
  border: 1px solid var(--primary);
  background: linear-gradient(135deg, var(--primary), #0869c9);
  color: #fff;
  border-radius: var(--radius-sm);
  padding: 10px 16px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease, border-color 180ms ease;
}
button:hover, .button-link:hover { box-shadow: 0 12px 26px rgba(11, 116, 222, 0.22); color: #fff; }
button:active, .button-link:active { transform: translateY(1px); }
button.secondary, .button-link.secondary { background: #fff; color: var(--primary); border-color: var(--line-strong); }
button.secondary:hover, .button-link.secondary:hover { border-color: var(--primary); color: var(--primary-dark); box-shadow: var(--shadow-sm); }
button.danger { background: #fff; color: var(--danger); border-color: #fecaca; }
button.danger:hover { border-color: var(--danger); box-shadow: 0 10px 22px rgba(220, 38, 38, 0.12); color: var(--danger); }
button:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
  outline: 3px solid rgba(11, 116, 222, 0.25);
  outline-offset: 2px;
}
table { width: 100%; border-collapse: separate; border-spacing: 0; }
th, td { border-bottom: 1px solid var(--line); padding: 14px 12px; text-align: left; vertical-align: middle; }
th { color: var(--muted); font-weight: 750; font-size: 12px; background: var(--surface-muted); }
tbody tr { transition: background 180ms ease; }
tbody tr:hover { background: #f7fbff; }
tr[data-id] { cursor: pointer; }
pre {
  white-space: pre-wrap;
  word-break: break-word;
  background: linear-gradient(180deg, #f8fbff, #f3f7fc);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 14px;
  max-height: 360px;
  overflow: auto;
  color: #334155;
}
.hidden { display: none !important; }
.muted { color: var(--muted); }
.ok { color: var(--success); }
.danger-text { color: var(--danger); }
.grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 18px; }
.span-4 { grid-column: span 4; }
.span-5 { grid-column: span 5; }
.span-7 { grid-column: span 7; }
.span-8 { grid-column: span 8; }
.span-12 { grid-column: span 12; }
.toolbar { display: flex; gap: 12px; align-items: end; flex-wrap: wrap; }
.toolbar > * { min-width: 150px; }
.card-header, .page-title-row, .topbar, .brand, .nav-item, .metric-card, .inline-status {
  display: flex;
  align-items: center;
}
.card-header { justify-content: space-between; gap: 14px; margin-bottom: 18px; }
.card-title { display: grid; gap: 4px; }
.page-title-row { justify-content: space-between; gap: 18px; margin-bottom: 22px; }
.page-kicker { color: var(--primary); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; font-size: 12px; }
.brand { gap: 12px; font-weight: 850; font-size: 18px; letter-spacing: -0.02em; }
.brand-icon, .soft-icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  color: #fff;
  background: linear-gradient(135deg, #1778e8, #075fb8);
  box-shadow: 0 12px 28px rgba(11, 116, 222, 0.20);
}
.brand-icon svg, .soft-icon svg { width: 22px; height: 22px; stroke: currentColor; }
.soft-icon { color: var(--primary); background: var(--primary-soft); box-shadow: none; }
.soft-icon.success { color: var(--success); background: var(--success-soft); }
.soft-icon.warning { color: var(--warning); background: var(--warning-soft); }
.badge, .chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  border-radius: 999px;
  padding: 4px 10px;
  font-weight: 750;
  color: var(--primary);
  background: var(--primary-soft);
  border: 1px solid #cfe3ff;
}
.badge.success, .chip.success { color: #15803d; background: var(--success-soft); border-color: #bbf7d0; }
.badge.muted-badge { color: var(--muted-strong); background: #f1f5f9; border-color: #e2e8f0; }
.code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 18px;
  letter-spacing: 0.02em;
  color: #059669;
  background: var(--success-soft);
  border-color: #bbf7d0;
}
.code-label {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 12px;
  letter-spacing: 0;
}
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.checkbox-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 9px 11px;
  min-height: 40px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--primary);
  cursor: pointer;
}
.inline-status { gap: 8px; color: var(--muted-strong); font-weight: 650; }
.status-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--success); box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.14); }
.table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius-md); }
.table-wrap table { min-width: 720px; }
.modal-card {
  width: min(680px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 0;
  background: var(--surface-solid);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}
#rule-dialog { width: min(1280px, calc(100vw - 16px)); }
.modal-card::backdrop { background: rgba(15, 23, 42, 0.38); backdrop-filter: blur(4px); }
.modal-form { max-height: calc(100vh - 32px); overflow-y: auto; padding: 22px; }
.modal-title-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 12px; }
.list-item-card {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 18px;
  margin-bottom: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface-solid);
  box-shadow: var(--shadow-sm);
}
.item-main { display: grid; gap: 12px; min-width: 0; }
.item-title-row, .item-meta, .item-actions, .generated-link {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.item-title-row strong { font-size: 16px; }
.item-actions { justify-content: flex-end; flex: 0 0 auto; }
.item-actions button { min-height: 36px; padding: 7px 12px; }
.generated-link {
  justify-content: space-between;
  margin-bottom: 14px;
  padding: 13px 14px;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-md);
  background: var(--success-soft);
  color: #166534;
}
.generated-link span { min-width: 0; overflow-wrap: anywhere; }
.database-version-line {
  display: inline-block;
  padding: 12px 14px;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-sm);
  background: rgba(239, 246, 255, 0.86);
  color: #1e40af;
  font-weight: 750;
}
.database-version-line strong { color: var(--primary-dark); }
.database-version-line.warning {
  border-color: #fed7aa;
  background: var(--warning-soft);
  color: #9a3412;
}
.database-version-line.warning strong { color: #9a3412; }
.metric-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 18px; }
.metric-card { gap: 14px; padding: 18px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
.metric-value { display: block; font-size: 28px; line-height: 1; font-weight: 850; letter-spacing: -0.04em; margin-top: 4px; }
.app-shell { min-height: 100vh; display: grid; grid-template-columns: var(--sidebar) minmax(0, 1fr); }
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 24px 18px;
  background: rgba(255,255,255,0.78);
  border-right: 1px solid var(--line);
  backdrop-filter: blur(18px);
}
.sidebar-nav { display: grid; gap: 8px; margin-top: 34px; }
.nav-item {
  gap: 10px;
  min-height: 46px;
  padding: 10px 12px;
  border-radius: 14px;
  color: var(--muted-strong);
  font-weight: 720;
}
.nav-item.active, .nav-item:hover { background: #e9f3ff; color: var(--primary); }
.nav-item svg { width: 19px; height: 19px; stroke: currentColor; }
.sidebar-footer { position: absolute; left: 18px; right: 18px; bottom: 24px; padding-top: 18px; border-top: 1px solid var(--line); }
.content-shell { min-width: 0; }
.topbar {
  min-height: 76px;
  justify-content: space-between;
  padding: 18px 28px;
  background: rgba(255,255,255,0.66);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(18px);
}
.dashboard-main { width: min(1480px, calc(100vw - var(--sidebar) - 56px)); margin: 28px auto; }
.search-panel { display: grid; grid-template-columns: minmax(260px, 1fr) auto auto; gap: 14px; align-items: end; }
.detail-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
.detail-row { display: grid; grid-template-columns: 110px 1fr; gap: 14px; padding: 8px 0; color: var(--muted-strong); }
.hero-auth { min-height: 100vh; display: grid; grid-template-columns: minmax(280px, 420px) 520px; gap: 54px; align-items: center; width: min(1320px, calc(100vw - 48px)); margin: 0 auto; padding: 48px 0; background: transparent; border: 0; box-shadow: none; }
.hero-copy { display: grid; gap: 28px; }
.auth-loading { min-height: 100vh; display: grid; place-content: center; gap: 18px; text-align: center; }
.compact-hero { align-content: center; gap: 22px; }
.hero-copy p { font-size: 17px; color: var(--muted-strong); }
.hero-features { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.feature-card { padding: 16px; display: flex; gap: 12px; align-items: center; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
.auth-card { padding: 42px; border-radius: 28px; background: rgba(255,255,255,0.86); border: 1px solid var(--line); box-shadow: var(--shadow-md); }
.auth-card form { margin-top: 26px; }
.form-actions { display: grid; gap: 12px; margin-top: 20px; }
.setup-shell { min-height: 100vh; padding: 28px; }
.setup-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 44px; }
.setup-card { width: min(760px, 100%); margin: 0 auto; padding: 42px; text-align: center; }
.setup-card form { text-align: left; margin-top: 26px; }
.progress-line { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 26px; color: var(--primary); font-weight: 800; }
.progress-line::before, .progress-line::after { content: ""; width: min(180px, 24vw); height: 6px; border-radius: 999px; background: linear-gradient(90deg, var(--primary), #60a5fa); }
.notice { display: flex; gap: 12px; align-items: flex-start; padding: 16px; border-radius: var(--radius-md); border: 1px solid #bfdbfe; background: rgba(239, 246, 255, 0.86); color: #1e40af; }
.rule-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.rule-page-shell {
  padding: 24px;
  background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,251,255,0.94));
}
.rule-page-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.rule-page-header { margin-bottom: 18px; }
.rule-list-shell {
  display: grid;
  gap: 12px;
}
.rule-list-shell .list-item-card {
  margin-bottom: 0;
  padding: 18px 20px;
  border-color: rgba(198, 216, 239, 0.96);
  background: rgba(255, 255, 255, 0.94);
}
.rule-list-shell .list-item-card:hover {
  border-color: rgba(11, 116, 222, 0.3);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.08);
}
.rule-dialog-form { padding: 0; }
.rule-dialog-shell {
  display: grid;
  gap: 14px;
  padding: 18px;
}
.rule-dialog-title-row {
  margin-bottom: 0;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
  align-items: center;
}
.rule-dialog-title-row h2 {
  font-size: 18px;
  line-height: 1.3;
}
.rule-dialog-close {
  min-height: 36px;
  width: 36px;
  padding: 0;
  font-size: 22px;
  line-height: 1;
  color: var(--muted-strong);
}
.rule-dialog-close:hover { color: var(--text); }
.rule-form-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.rule-form-field { margin: 0; }
.rule-form-field > span {
  display: block;
  margin-bottom: 8px;
  color: var(--muted-strong);
  font-weight: 700;
}
.rule-canvas {
  padding: 14px;
  border: 2px solid rgba(59, 130, 246, 0.72);
  border-radius: 20px;
  background:
    linear-gradient(rgba(59, 130, 246, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.045) 1px, transparent 1px),
    radial-gradient(circle at 12% 0%, rgba(37, 99, 235, 0.12), transparent 30%),
    linear-gradient(180deg, #ffffff, #f8fbff);
  background-size: 22px 22px, 22px 22px, auto, auto;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.92), 0 18px 42px rgba(37, 99, 235, 0.08);
}
.rule-builder-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 8px;
}
.rule-builder-topline > div:first-child {
  display: grid;
  gap: 4px;
}
.rule-builder-summary {
  flex: 0 0 min(420px, 42%);
  margin: 0;
  padding: 8px 10px;
  border: 1px solid #dbeafe;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #1e3a8a;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.45;
}
.rule-builder-summary.invalid {
  border-color: #fdba74;
  background: #fff7ed;
  color: #c2410c;
}
.rule-builder-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  align-items: center;
}
.rule-builder-toolbar {
  margin: 0 0 12px;
  padding-top: 2px;
}
.rule-builder-fallback-toolbar { display: none; }
.rule-builder-actions button,
.rule-group-header-actions button,
.rule-condition-actions button {
  min-height: 36px;
  padding: 0 13px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}
.rule-builder-tree {
  position: relative;
  display: grid;
  gap: 12px;
}
.rule-workspace {
  min-height: 240px;
  padding: 8px;
  border: 1px solid rgba(147, 197, 253, 0.42);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.66);
}
.rule-builder-tree.is-pointer-dragging { cursor: grabbing; }
.rule-node {
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
  overflow: hidden;
  transition: transform 140ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease, opacity 160ms ease;
}
.rule-node:hover,
.rule-node:focus-within {
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}
.rule-node.is-dragging-source {
  opacity: 1;
  border-color: rgba(37, 99, 235, 0.64);
  border-style: dashed;
  background: rgba(219, 234, 254, 0.48);
  box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.14);
}
.rule-builder-tree.is-pointer-dragging .rule-node.is-dragging-source > * {
  visibility: hidden;
}
.rule-node-group.root {
  border-color: rgba(59, 130, 246, 0.62);
  border-radius: 18px;
  box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.22), 0 18px 44px rgba(37, 99, 235, 0.08);
}
.rule-node-group.nested {
  border-color: rgba(96, 165, 250, 0.48);
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,251,255,0.96));
}
.rule-node-group.rule-node-not {
  border-style: dashed;
  border-color: #c4b5fd;
  background: #fcfaff;
}
.rule-group-shell { display: grid; }
.rule-group-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(219, 234, 254, 0.9);
  background: linear-gradient(180deg, rgba(239,246,255,0.98), rgba(255,255,255,0.96));
}
.rule-node-not .rule-group-header {
  background: linear-gradient(180deg, rgba(248,245,255,0.98), rgba(255,255,255,0.94));
}
.rule-group-header-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1 1 auto;
}
.rule-group-header-actions,
.rule-condition-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  margin-left: auto;
}
.rule-group-header-actions { flex-wrap: wrap; justify-content: flex-end; }
.rule-condition-actions {
  align-items: flex-end;
  gap: 6px;
  padding-bottom: 3px;
  flex-wrap: nowrap;
}
.rule-condition-actions button {
  min-height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1;
}
.rule-group-header-actions .rule-action-primary {
  color: #2563eb;
  border-color: #bfdbfe;
  background: #fff;
}
.rule-group-header-actions .danger,
.rule-condition-actions .danger {
  color: #ef4444;
  border-color: #fecaca;
  background: #fff7f7;
}
.rule-more-button {
  min-width: 40px;
  padding: 0 10px !important;
  font-size: 18px !important;
  letter-spacing: 0.08em;
}
.rule-title-grip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 34px;
  color: #64748b;
}
.rule-node-caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 16px;
}
.rule-node-kind {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  min-height: 38px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.02em;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.22);
}
.rule-node-kind.rule-node-kind-or { background: linear-gradient(135deg, #a78bfa, #7c3aed); box-shadow: 0 8px 18px rgba(124, 58, 237, 0.2); }
.rule-node-kind.rule-node-kind-not { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.rule-node-kind.rule-node-kind-condition {
  color: var(--primary-dark);
  background: rgba(219, 234, 254, 0.92);
  border: 1px solid rgba(147, 197, 253, 0.88);
}
.rule-node-pill-select {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.rule-inline-select {
  position: absolute;
  inset: 0;
  width: 100%;
  min-width: 100%;
  max-width: none;
  min-height: 100%;
  padding: 0;
  border: 0;
  opacity: 0;
  pointer-events: auto;
  cursor: pointer;
}
.rule-group-title {
  color: #1f2937;
  font-size: 15px;
  font-weight: 900;
  white-space: nowrap;
}
.rule-title-edit {
  color: #64748b;
  font-size: 15px;
}
.rule-node-hint {
  color: var(--muted-strong);
  font-weight: 700;
}
.rule-node-children {
  display: grid;
  gap: 10px;
  padding: 12px 16px 16px;
  position: relative;
}
.rule-node-group:not(.root) .rule-node-children {
  margin-left: 32px;
  border-left: 2px solid rgba(147, 197, 253, 0.38);
}
.rule-node-condition-card {
  background: transparent;
  border: 0;
  box-shadow: none;
}
.rule-condition-card {
  border: 0;
  border-radius: 0;
  background: #fff;
  padding: 0;
  box-shadow: none;
}
.rule-condition-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: end;
  min-height: 62px;
}
.rule-condition-leading {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 3px;
}
.rule-drag-handle {
  cursor: grab;
  min-height: 34px;
  width: 28px;
  padding: 0;
  user-select: none;
  touch-action: none;
  color: #64748b;
  border-color: transparent;
  background: transparent;
}
.rule-drag-handle:hover,
.rule-drag-handle:focus-visible {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #2563eb;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.12);
}
.rule-drag-handle:disabled { cursor: not-allowed; }
.rule-drag-handle:active,
.rule-builder-tree.is-pointer-dragging .rule-drag-handle { cursor: grabbing; }
.rule-builder-tree.is-pointer-dragging .rule-node:not(.is-dragging-source) {
  will-change: transform;
}
.rule-grip {
  width: 14px;
  height: 14px;
  display: inline-block;
  background-image: radial-gradient(currentColor 1.3px, transparent 1.3px);
  background-size: 6px 6px;
  background-position: 0 0;
  opacity: 0.72;
}
.rule-condition-fields {
  display: grid;
  grid-template-columns: minmax(150px, 1.05fr) minmax(118px, 0.78fr) minmax(190px, 1fr) max-content;
  gap: 10px;
  align-items: end;
}
.rule-field-cell {
  display: grid;
  gap: 5px;
  margin: 0;
}
.rule-field-cell span {
  display: block;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.2;
}
.rule-select-shell {
  position: relative;
  display: flex;
  align-items: center;
}
.rule-field-select-shell select { padding-left: 42px !important; }
.rule-field-icon {
  position: absolute;
  left: 10px;
  z-index: 1;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  color: #2563eb !important;
  background: #eff6ff;
  font-size: 12px !important;
  font-weight: 900 !important;
  letter-spacing: 0 !important;
  pointer-events: none;
}
.rule-field-icon-code { font-size: 18px !important; }
.rule-field-cell select,
.rule-field-cell input {
  width: 100%;
  min-height: 34px;
  padding: 6px 10px;
  border-color: #dbe7f6;
  border-radius: 8px;
  background-color: #fff;
  color: #1f2937;
  font-weight: 800;
  font-size: 13px;
}
.rule-field-checkbox { min-width: 104px; }
.rule-case-toggle {
  min-height: 34px;
  width: 100%;
  justify-content: flex-start;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted-strong);
  box-shadow: none;
  white-space: nowrap;
}
.rule-case-toggle input {
  width: 16px !important;
  height: 16px;
  min-height: 16px !important;
  margin: 0;
  padding: 0;
  accent-color: #2563eb;
  flex: 0 0 auto;
}
.rule-drop-zone { display: none; }
.rule-builder-tree.is-pointer-dragging .rule-drop-zone {
  position: relative;
  display: grid;
  min-height: 10px;
  margin: -5px 0;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: #2563eb;
  font-size: 0;
  font-weight: 800;
  place-items: center;
  transition: min-height 160ms cubic-bezier(0.2, 0, 0, 1), background 160ms ease, box-shadow 160ms ease;
}
.rule-builder-tree.is-pointer-dragging .rule-drop-zone.active::before,
.rule-builder-tree.is-pointer-dragging .rule-drop-zone.active::after {
  content: "";
  position: absolute;
  width: 12px;
  height: 12px;
  border: 3px solid #2563eb;
  border-radius: 999px;
  background: #fff;
}
.rule-builder-tree.is-pointer-dragging .rule-drop-zone::before { left: -5px; }
.rule-builder-tree.is-pointer-dragging .rule-drop-zone::after { right: -5px; }
.rule-add-drop-zone {
  display: grid;
  gap: 10px;
  min-height: 68px;
  padding: 12px;
  border: 1.5px dashed #93c5fd;
  border-radius: 14px;
  background: rgba(239, 246, 255, 0.62);
  color: #2563eb;
  font-weight: 900;
  place-items: center;
}
.rule-add-drop-zone-title {
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
}
.rule-add-drop-zone-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
.rule-add-drop-zone-actions button {
  min-height: 34px;
  border-color: #bfdbfe;
  background: #fff;
  color: #2563eb;
  font-weight: 900;
}
.rule-add-drop-zone.active {
  border-color: #2563eb;
  background: rgba(219, 234, 254, 0.9);
  box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.16);
}
.rule-drop-zone.active {
  min-height: var(--rule-placeholder-height, 64px) !important;
  border: 1.5px dashed #2563eb !important;
  background: rgba(219, 234, 254, 0.66) !important;
  box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.12), 0 12px 28px rgba(37, 99, 235, 0.1) !important;
}
.rule-drag-ghost {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  width: min(560px, calc(100vw - 32px));
  padding: 14px 16px;
  border: 1px solid rgba(96, 165, 250, 0.78);
  border-radius: 14px;
  background: rgba(255,255,255,0.98);
  box-shadow: 0 24px 54px rgba(15, 23, 42, 0.2);
  opacity: 0.96;
  pointer-events: none;
  transform-origin: top left;
  will-change: transform;
}
.rule-drag-ghost-card {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: 0 26px 60px rgba(15, 23, 42, 0.22);
}
.rule-drag-ghost-card .rule-node {
  margin: 0;
  border-color: rgba(37, 99, 235, 0.72);
  box-shadow: 0 22px 54px rgba(15, 23, 42, 0.2);
}
.rule-drag-ghost-card button,
.rule-drag-ghost-card input,
.rule-drag-ghost-card select,
.rule-drag-ghost-card textarea {
  pointer-events: none;
}
.rule-drag-ghost .rule-drag-ghost-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  color: var(--text);
  font-weight: 800;
}
.rule-drag-ghost .rule-drag-ghost-body {
  color: var(--muted-strong);
  font-size: 13px;
  line-height: 1.45;
}
.rule-dialog-panels {
  display: grid;
  gap: 10px;
}
.rule-quick,
.rule-advanced {
  margin-top: 0;
  padding: 10px 12px;
  border: 1px solid #eef2f7;
  border-radius: var(--radius-sm);
  background: #fbfdff;
}
.rule-quick summary,
.rule-advanced summary {
  cursor: pointer;
  color: var(--muted-strong);
  font-weight: 800;
}
.rule-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}
.rule-enabled-chip {
  margin: 0;
  color: var(--muted-strong);
  white-space: nowrap;
}
.rule-dialog-submit {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex: 1 1 auto;
}
.rule-dialog-submit #rule-message {
  margin-right: auto;
  text-align: left;
}
.rule-quick summary:focus-visible, .rule-advanced summary:focus-visible { outline: 3px solid rgba(11, 116, 222, 0.22); outline-offset: 4px; border-radius: var(--radius-sm); }
.danger-badge { color: var(--danger); background: var(--danger-soft); border-color: #fecaca; }
.ui-message-container { position: fixed; top: 18px; left: 50%; z-index: 9999; display: grid; gap: 10px; width: min(420px, calc(100vw - 32px)); transform: translateX(-50%); pointer-events: none; }
.ui-message { padding: 11px 14px; border: 1px solid #bfdbfe; border-radius: var(--radius-sm); background: #fff; color: var(--primary-dark); font-weight: 800; text-align: center; box-shadow: var(--shadow-md); opacity: 0; transform: translateY(-8px); transition: opacity 180ms ease, transform 180ms ease; }
.ui-message.visible { opacity: 1; transform: translateY(0); }
.ui-message.success { color: #15803d; background: var(--success-soft); border-color: #bbf7d0; }
.ui-message.error { color: var(--danger); background: var(--danger-soft); border-color: #fecaca; }
.visitor-shell { min-height: 100vh; width: min(1320px, calc(100vw - 40px)); margin: 0 auto; padding: 34px 0; }
.visitor-header { display: flex; justify-content: space-between; align-items: center; gap: 18px; margin-bottom: 28px; }
.visitor-hero { display: grid; grid-template-columns: auto 1fr auto; gap: 22px; align-items: center; padding: 28px; margin-bottom: 22px; }
.visitor-count { font-size: 28px; font-weight: 850; color: var(--primary); }
.mail-reader-page { width: min(1600px, calc(100vw - 32px)); }
${MAIL_STYLES}
@media (max-width: 1100px) {
  .app-shell { grid-template-columns: 1fr; }
  .sidebar { position: relative; height: auto; padding: 18px; }
  .sidebar-nav { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 18px; }
  .sidebar-footer { position: static; margin-top: 18px; }
  .dashboard-main { width: min(100vw - 32px, 1180px); }
  .hero-auth { grid-template-columns: 1fr; }
  .metric-grid, .hero-features, .rule-dialog-panels { grid-template-columns: 1fr; }
  .email-card { grid-template-columns: 54px 1fr; }
  .mail-viewer-grid { grid-template-columns: 1fr; }
  .mail-list-panel { border-right: 0; border-bottom: 1px solid var(--line); }
  .rule-form-meta-grid,
  .rule-condition-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .rule-dialog-footer { display: grid; }
  .rule-builder-topline { align-items: flex-start; }
  .rule-builder-summary { flex-basis: 100%; width: 100%; }
}
@media (max-width: 760px) {
  main, .dashboard-main, .visitor-shell { width: min(100vw - 24px, 100%); margin-top: 16px; }
  section { padding: 16px; }
  .grid, .search-panel, .visitor-hero, .mail-viewer-topbar { display: block; }
  .toolbar > *, .search-panel > * { min-width: 100%; }
  .page-title-row, .topbar, .visitor-header, .visitor-email-head, .card-header, .rule-page-toolbar { align-items: flex-start; flex-direction: column; }
  .sidebar-nav { grid-template-columns: 1fr; }
  .hero-auth { width: min(100vw - 24px, 100%); padding: 24px 0; gap: 22px; }
  .auth-card, .setup-card { padding: 24px; }
  .setup-shell { padding: 18px 12px; }
  .email-card { grid-template-columns: 1fr; }
  .detail-row { grid-template-columns: 1fr; gap: 4px; }
  .mail-viewer-topbar input, .mail-viewer-topbar button { width: 100%; margin-bottom: 8px; }
  .mail-detail-view { padding: 14px; }
  .list-item-card { display: grid; }
  .item-actions { justify-content: flex-start; }
  .rule-builder-topline, .rule-form-meta-grid, .rule-dialog-submit, .rule-page-toolbar { display: grid; }
  .rule-condition-fields, .rule-grid { grid-template-columns: 1fr; }
  .rule-condition-row { grid-template-columns: 1fr; }
  .rule-condition-leading { justify-content: flex-start; }
  .rule-node-children { padding-left: 12px; }
  .rule-group-header,
  .rule-group-header-main,
  .rule-group-header-actions,
  .rule-condition-actions,
  .rule-builder-actions,
  .rule-dialog-submit { width: 100%; }
  .rule-group-header,
  .rule-group-header-main { flex-wrap: wrap; }
  .rule-group-header-actions,
  .rule-condition-actions,
  .rule-builder-actions,
  .rule-dialog-submit { flex-wrap: wrap; }
  .rule-group-header-actions button,
  .rule-condition-actions button,
  .rule-builder-actions button,
  .rule-dialog-submit button { flex: 1 1 auto; min-height: 44px; }
  .rule-dialog-shell { padding: 16px; }
  .rule-dialog-submit #rule-message { margin-right: 0; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
}`;

function styles(): string {
  return BASE_STYLES;
}
