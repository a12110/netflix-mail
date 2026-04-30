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
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 0;
  background: var(--surface-solid);
  box-shadow: var(--shadow-md);
}
.modal-card::backdrop { background: rgba(15, 23, 42, 0.38); backdrop-filter: blur(4px); }
.modal-form { padding: 22px; }
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
  .metric-grid, .hero-features { grid-template-columns: 1fr; }
  .email-card { grid-template-columns: 54px 1fr; }
  .mail-viewer-grid { grid-template-columns: 1fr; }
  .mail-list-panel { border-right: 0; border-bottom: 1px solid var(--line); }
}
@media (max-width: 760px) {
  main, .dashboard-main, .visitor-shell { width: min(100vw - 24px, 100%); margin-top: 16px; }
  section { padding: 16px; }
  .grid, .search-panel, .visitor-hero, .mail-viewer-topbar { display: block; }
  .toolbar > *, .search-panel > * { min-width: 100%; }
  .page-title-row, .topbar, .visitor-header, .visitor-email-head, .card-header { align-items: flex-start; flex-direction: column; }
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
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
}`;

function styles(): string {
  return BASE_STYLES;
}
