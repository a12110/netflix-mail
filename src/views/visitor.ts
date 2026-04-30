import { page } from "./layout";

export function visitorPage(token: string): string {
  return page("访问代码", VISITOR_BODY, visitorScript(token));
}

const MAIL_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke-width="2"/><path d="m4 7 8 6 8-6" stroke-width="2"/></svg>`;
const SHIELD_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6v5c0 4.5 2.9 8.4 7 10 4.1-1.6 7-5.5 7-10V6z" stroke-width="2"/><path d="m9 12 2 2 4-5" stroke-width="2"/></svg>`;
const CLOCK_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke-width="2"/><path d="M12 7v5l3 2" stroke-width="2" stroke-linecap="round"/></svg>`;

const VISITOR_BODY = String.raw`
<div class="visitor-shell">
  <header class="visitor-header">
    <div>
      <div class="brand"><span class="brand-icon">${MAIL_ICON}</span><span>访问代码</span></div>
      <p class="muted" style="margin-top:8px">展示最近 30 分钟内的匹配邮件</p>
    </div>
    <div class="toolbar">
      <span class="inline-status"><span class="status-dot"></span><span id="status">同步中</span></span>
      <button id="refresh" type="button" class="secondary">刷新</button>
    </div>
  </header>
  <section class="visitor-hero">
    <span class="soft-icon" style="width:72px;height:72px">${MAIL_ICON}</span>
    <div>
      <h1>当前共 <span id="email-count" class="visitor-count">0</span> 封匹配邮件</h1>
      <p class="muted">最近同步 <span id="last-sync">--</span>，页面会自动刷新。</p>
    </div>
    <span class="soft-icon success" style="width:86px;height:86px">${SHIELD_ICON}</span>
  </section>
  <main style="width:100%;margin:0">
    <section>
      <div class="card-header">
        <div class="card-title"><p class="page-kicker">Matched Messages</p><h2>邮件列表</h2></div>
        <span class="badge muted-badge">30 分钟窗口</span>
      </div>
      <div id="emails"></div>
    </section>
    <p class="muted" style="text-align:center;margin:18px 0">数据仅保留最近 30 分钟，自动刷新，保障访问隐私安全。</p>
  </main>
</div>`;

function safeScriptString(value: string): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function visitorScript(token: string): string {
  return `
const token = ${safeScriptString(token)};
const emails = document.querySelector("#emails");
const statusEl = document.querySelector("#status");
const countEl = document.querySelector("#email-count");
const lastSyncEl = document.querySelector("#last-sync");
document.querySelector("#refresh").addEventListener("click", loadEmails);

function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

async function loadEmails() {
  statusEl.textContent = "同步中";
  const response = await fetch("/api/visitor/" + encodeURIComponent(token) + "/emails");
  const data = await response.json();
  if (!response.ok) {
    statusEl.textContent = data.error || "链接不可用";
    countEl.textContent = "0";
    emails.innerHTML = '<div class="empty-state">链接不可用或已过期</div>';
    return;
  }
  const syncTime = new Date().toLocaleTimeString();
  statusEl.textContent = "已同步";
  lastSyncEl.textContent = syncTime;
  countEl.textContent = String(data.emails.length);
  if (data.emails.length === 0) {
    emails.innerHTML = '<div class="empty-state">暂无匹配邮件</div>';
    return;
  }
  emails.innerHTML = data.emails.map((email) => renderEmail(email)).join("");
}

function renderEmail(email) {
  const codes = email.codes.map((code) => '<span class="chip code">验证码 ' + escapeText(code) + '</span>').join("");
  return '<article class="card email-card">' +
    '<span class="soft-icon">${SHIELD_ICON}</span>' +
    '<div><h3>' + escapeText(email.subject || "(无主题)") + '</h3>' +
    '<p class="muted">发件人：' + escapeText(email.fromAddress || email.envelopeFrom) + '</p></div>' +
    '<div><div class="chips">' + (codes || '<span class="badge muted-badge">无验证码</span>') + '</div>' +
    '<p class="email-body-preview">' + escapeText(email.body) + '</p></div>' +
    '<div class="inline-status"><span class="soft-icon" style="width:34px;height:34px">${CLOCK_ICON}</span><span>接收时间<br>' +
    escapeText(new Date(email.receivedAt).toLocaleTimeString()) + '</span></div>' +
  '</article>';
}

loadEmails();
setInterval(loadEmails, 15000);`;
}
