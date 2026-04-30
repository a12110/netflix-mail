import { page } from "./layout";
import { COMMON_MAIL_CLIENT_SCRIPT } from "./mail-shared";

export function visitorPage(token: string): string {
  return page("访问代码", VISITOR_BODY, visitorScript(token));
}

const MAIL_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke-width="2"/><path d="m4 7 8 6 8-6" stroke-width="2"/></svg>`;
const SHIELD_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6v5c0 4.5 2.9 8.4 7 10 4.1-1.6 7-5.5 7-10V6z" stroke-width="2"/><path d="m9 12 2 2 4-5" stroke-width="2"/></svg>`;

const VISITOR_BODY = String.raw`
<div class="visitor-shell mail-reader-page">
  <header class="visitor-header mail-reader-header">
    <div>
      <div class="brand"><span class="brand-icon">${MAIL_ICON}</span><span>访问代码</span></div>
      <p class="muted" style="margin-top:8px">展示最近 30 分钟内的匹配邮件，页面会自动刷新。</p>
    </div>
    <div class="toolbar">
      <span class="inline-status"><span class="status-dot"></span><span id="status">同步中</span></span>
      <button id="refresh" type="button" class="secondary">刷新</button>
    </div>
  </header>
  <main style="width:100%;margin:0">
    <section class="mail-viewer-shell visitor-mail-viewer">
      <div class="mail-viewer-topbar">
        <input id="visitor-filter" aria-label="过滤邮件" placeholder="过滤当前页">
        <button id="visitor-clear-filter" type="button" class="secondary">清空</button>
      </div>
      <div class="mail-viewer-controls">
        <span class="mail-control-chip">匹配邮件 <strong id="email-count" class="visitor-count">0</strong></span>
        <span class="mail-control-chip">最近同步 <strong id="last-sync">--</strong></span>
        <span class="mail-control-chip">30 分钟窗口</span>
      </div>
      <div class="mail-viewer-grid">
        <aside class="mail-list-panel" aria-label="匹配邮件列表">
          <div class="mail-list-title"><strong>邮件列表</strong><span>点击左侧邮件查看正文</span></div>
          <div id="emails" class="mail-list"></div>
        </aside>
        <article id="visitor-email-detail" class="mail-detail-panel" aria-live="polite">
          <div id="visitor-email-detail-content"></div>
        </article>
      </div>
    </section>
    <p class="muted" style="text-align:center;margin:18px 0">数据仅保留最近 30 分钟，自动刷新，保障访问隐私安全。</p>
  </main>
</div>`;

function safeScriptString(value: string): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function visitorScript(token: string): string {
  return COMMON_MAIL_CLIENT_SCRIPT + `
const token = ${safeScriptString(token)};
const visitorState = { emails: [], selectedEmailKey: null, filter: "" };
const emails = document.querySelector("#emails");
const statusEl = document.querySelector("#status");
const countEl = document.querySelector("#email-count");
const lastSyncEl = document.querySelector("#last-sync");
const filterInput = document.querySelector("#visitor-filter");
document.querySelector("#refresh").addEventListener("click", loadEmails);
filterInput.addEventListener("input", () => {
  visitorState.filter = filterInput.value;
  renderVisitorListAndDetail();
});
document.querySelector("#visitor-clear-filter").addEventListener("click", () => {
  filterInput.value = "";
  visitorState.filter = "";
  renderVisitorListAndDetail();
});

async function loadEmails() {
  statusEl.textContent = "同步中";
  const response = await fetch("/api/visitor/" + encodeURIComponent(token) + "/emails");
  const data = await response.json();
  if (!response.ok) {
    statusEl.textContent = data.error || "链接不可用";
    countEl.textContent = "0";
    emails.innerHTML = '<div class="empty-state">链接不可用或已过期</div>';
    renderVisitorEmptyDetail("链接不可用或已过期");
    return;
  }
  const syncTime = new Date().toLocaleTimeString();
  statusEl.textContent = "已同步";
  lastSyncEl.textContent = syncTime;
  visitorState.emails = data.emails.map((email, index) => ({
    ...email,
    viewKey: String(index) + "-" + String(email.receivedAt || "")
  }));
  countEl.textContent = String(data.emails.length);
  renderVisitorListAndDetail();
}
function visitorVisibleEmails() {
  const query = visitorState.filter.trim().toLowerCase();
  if (!query) return visitorState.emails;
  return visitorState.emails.filter((email) => [
    email.subject, email.bodyText, email.body, normalizeCodes(email.codes).join(" ")
  ].some((value) => String(value || "").toLowerCase().includes(query)));
}
function renderVisitorListAndDetail() {
  const visible = visitorVisibleEmails();
  emails.innerHTML = visible.map(renderVisitorListItem).join("") || '<div class="empty-state">暂无匹配邮件</div>';
  emails.querySelectorAll("[data-key]").forEach((item) => item.addEventListener("click", () => selectVisitorEmail(item.dataset.key)));
  const selected = visible.find((email) => email.viewKey === visitorState.selectedEmailKey);
  if (selected) selectVisitorEmail(selected.viewKey);
  else if (visible[0]) selectVisitorEmail(visible[0].viewKey);
  else renderVisitorEmptyDetail("暂无匹配邮件");
}
function renderVisitorListItem(email) {
  const selected = email.viewKey === visitorState.selectedEmailKey ? " selected" : "";
  const truncated = email.contentTruncated ? '<span class="badge muted-badge">截断</span>' : "";
  return '<button type="button" class="mail-list-item' + selected + '" data-key="' + escapeAttribute(email.viewKey) + '">' +
    '<strong>' + escapeText(email.subject || "(无主题)") + '</strong>' +
    '<div class="mail-list-tags">' + renderMetaPill("时间", formatDate(email.receivedAt)) + truncated + '</div>' +
  '</button>';
}
function selectVisitorEmail(key) {
  const visible = visitorVisibleEmails();
  const email = visible.find((item) => item.viewKey === key);
  if (!email) return;
  visitorState.selectedEmailKey = email.viewKey;
  emails.querySelectorAll(".mail-list-item").forEach((item) => item.classList.toggle("selected", item.dataset.key === email.viewKey));
  optional("#visitor-email-detail-content").innerHTML = renderVisitorEmailDetail(email, visible);
  bindVisitorDetailActions();
}
function renderVisitorEmailDetail(email, visible) {
  const body = cleanEmailBody(email.bodyText || email.body || htmlToText(email.bodyHtml) || "");
  const codes = renderCodeChips(email.codes) || '<span class="badge muted-badge">无验证码</span>';
  const truncated = email.contentTruncated ? '<span class="badge muted-badge">内容已截断</span>' : "";
  const index = visible.findIndex((item) => item.viewKey === email.viewKey);
  const prevDisabled = index <= 0 ? " disabled" : "";
  const nextDisabled = index < 0 || index >= visible.length - 1 ? " disabled" : "";
  return '<div class="mail-detail-view"><div class="mail-detail-nav">' +
    '<button type="button" class="secondary" data-visitor-prev' + prevDisabled + '>‹ 上一封</button>' +
    '<button type="button" class="secondary" data-visitor-next' + nextDisabled + '>下一封 ›</button></div>' +
    '<div class="mail-detail-header"><h2>' + escapeText(email.subject || "(无主题)") + '</h2>' +
    '<div class="mail-meta-row">' + renderMetaPill("时间", formatDate(email.receivedAt)) + '</div>' +
    '<div class="mail-action-row">' + truncated + '<button type="button" class="secondary" data-toggle-visitor-plain>显示纯文本邮件</button>' +
    '<button type="button" class="secondary" data-visitor-fullscreen>全屏</button></div></div>' +
    '<div class="chips">' + codes + '</div><div class="mail-preview-stage">' +
    renderMailBodyFromContent(email.bodyHtml || "", body, Boolean(email.trustedAuthentication)) + '</div>' +
    '<pre class="mail-plain-panel hidden">' + escapeText(body || "暂无正文") + '</pre></div>';
}
function renderVisitorEmptyDetail(message) {
  optional("#visitor-email-detail-content").innerHTML = '<div class="mail-empty-detail empty-state">' + escapeText(message) + '</div>';
}
function bindVisitorDetailActions() {
  on("[data-visitor-prev]", "click", () => navigateVisitorEmail(-1));
  on("[data-visitor-next]", "click", () => navigateVisitorEmail(1));
  on("[data-visitor-fullscreen]", "click", () => requestMailFullscreen("#visitor-email-detail .mail-preview-stage"));
  on("[data-toggle-visitor-plain]", "click", (event) => togglePlainPanel("#visitor-email-detail .mail-plain-panel", event.currentTarget));
  bindRemoteMailButtons("#visitor-email-detail");
}
function navigateVisitorEmail(delta) {
  const visible = visitorVisibleEmails();
  const index = visible.findIndex((email) => email.viewKey === visitorState.selectedEmailKey);
  const target = visible[index + delta];
  if (target) selectVisitorEmail(target.viewKey);
}

loadEmails();
setInterval(loadEmails, 15000);`;
}
