import { page } from "./layout";

export type AdminSection = "mail" | "rules" | "share";

export function adminPage(section: AdminSection = "mail"): string {
  return page("管理员后台", adminBody(section), adminScript(section));
}

const MAIL_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke-width="2"/><path d="m4 7 8 6 8-6" stroke-width="2"/></svg>`;
const SHIELD_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6v5c0 4.5 2.9 8.4 7 10 4.1-1.6 7-5.5 7-10V6z" stroke-width="2"/><path d="m9 12 2 2 4-5" stroke-width="2"/></svg>`;
const LINK_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" stroke-width="2"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" stroke-width="2"/></svg>`;
const RULE_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M4 5h16M7 12h10M10 19h4" stroke-width="2" stroke-linecap="round"/></svg>`;

const TITLES: Record<AdminSection, string> = {
  mail: "邮件中心",
  rules: "规则管理",
  share: "分享链接"
};

function adminBody(section: AdminSection): string {
  return String.raw`
${loginSection()}
<div id="app-section" class="app-shell hidden">
  <aside class="sidebar">
    <div class="brand"><span class="brand-icon">${MAIL_ICON}</span><span>邮件管家</span></div>
    <nav class="sidebar-nav" aria-label="后台导航">
      ${navItem("mail", section, "/admin", MAIL_ICON, "邮件中心")}
      ${navItem("rules", section, "/admin/rules", RULE_ICON, "规则管理")}
      ${navItem("share", section, "/admin/share-links", LINK_ICON, "分享链接")}
    </nav>
    <div class="sidebar-footer">
      <div class="inline-status"><span class="status-dot"></span><span>系统运行正常</span></div>
    </div>
  </aside>
  <div class="content-shell">
    <header class="topbar">
      <div><p class="page-kicker">Netflix Mail Console</p><h2>${TITLES[section]}</h2></div>
      <div class="toolbar">
        <span id="admin-name" class="badge muted-badge"></span>
        <button id="logout" class="secondary hidden" type="button">退出登录</button>
      </div>
    </header>
    <main class="dashboard-main">${moduleContent(section)}</main>
  </div>
</div>`;
}

function loginSection(): string {
  return String.raw`<section id="login-section" class="hero-auth">
  <div class="hero-copy compact-hero">
    <div class="brand"><span class="brand-icon">${MAIL_ICON}</span><span>Netflix Mail</span></div>
    <div><h1>管理员后台</h1><p style="margin-top:12px">临时邮件访问与分享管理。</p></div>
  </div>
  <div class="auth-card">
    <div class="card-title"><p class="page-kicker">Admin Portal</p><h1>管理员登录</h1><p class="muted">仅授权管理员可访问邮件中心。</p></div>
    <form id="login-form">
      <label>用户名</label><input name="username" autocomplete="username" placeholder="请输入用户名" required>
      <label>密码</label><input name="password" type="password" autocomplete="current-password" placeholder="请输入密码" required>
      <div class="form-actions"><button type="submit">登录后台</button><span id="login-message" class="muted"></span></div>
    </form>
  </div>
</section>`;
}

function navItem(section: AdminSection, current: AdminSection, href: string, icon: string, label: string): string {
  const activeClass = section === current ? " active" : "";
  return `<a class="nav-item${activeClass}" href="${href}">${icon}<span>${label}</span></a>`;
}

function moduleContent(section: AdminSection): string {
  if (section === "rules") return rulesSection();
  if (section === "share") return shareSection();
  return mailSection();
}

function mailSection(): string {
  return String.raw`<section id="mail-center">
  <div class="page-title-row"><div><p class="page-kicker">Mail Center</p><h1>邮件中心</h1><p class="muted">搜索、查看验证码候选与原始邮件内容。</p></div></div>
  <div class="metric-grid" aria-label="邮件统计">
    <div class="metric-card"><span class="soft-icon">${MAIL_ICON}</span><div><span class="muted">当前列表</span><span id="metric-total" class="metric-value">0</span></div></div>
    <div class="metric-card"><span class="soft-icon success">${SHIELD_ICON}</span><div><span class="muted">验证码候选</span><span id="metric-codes" class="metric-value">0</span></div></div>
    <div class="metric-card"><span class="soft-icon warning">${RULE_ICON}</span><div><span class="muted">最近收件</span><span id="metric-recent" class="metric-value">--</span></div></div>
  </div>
  <form id="search-form" class="search-panel">
    <div><label>搜索</label><input name="q" placeholder="主题、发件人、收件人"></div>
    <button type="submit">查询</button><button id="reload-emails" type="button" class="secondary">刷新</button>
  </form>
  <div id="emails-table" style="margin-top:18px"></div>
</section>
<section id="email-detail" class="hidden">
  <div class="card-header"><div class="card-title"><p class="page-kicker">Message Detail</p><h2>邮件详情</h2></div></div>
  <div id="email-detail-content"></div>
</section>`;
}

function rulesSection(): string {
  return String.raw`<section id="rule-center">
  <div class="card-header"><div class="card-title"><p class="page-kicker">Rules</p><h1>规则管理</h1><p class="muted">独立维护访客可见邮件的匹配规则。</p></div></div>
  <div class="grid">
    <div class="span-4">${ruleForm()}</div>
    <div class="span-8"><div id="rules-table"></div></div>
  </div>
</section>`;
}

function shareSection(): string {
  return String.raw`<section id="share-center">
  <div class="card-header"><div class="card-title"><p class="page-kicker">Share Links</p><h1>分享链接</h1><p class="muted">为访客生成临时访问链接，只返回最近 30 分钟命中邮件。</p></div></div>
  <div class="grid">
    <div class="span-4">${shareForm()}</div>
    <div class="span-8"><pre id="new-link" class="hidden"></pre><div id="links-table"></div></div>
  </div>
</section>`;
}

function ruleForm(): string {
  return String.raw`<form id="rule-form" class="card" style="padding:18px">
  <label>规则名称</label><input name="name" placeholder="例如：登录验证码" required>
  <label>关键词</label><input name="keyword" placeholder="请输入关键词" required>
  <label>匹配字段</label>
  <div class="chips">
    <label class="checkbox-pill"><input type="checkbox" name="fields" value="from"> From</label>
    <label class="checkbox-pill"><input type="checkbox" name="fields" value="to"> To</label>
    <label class="checkbox-pill"><input type="checkbox" name="fields" value="subject" checked> Subject</label>
    <label class="checkbox-pill"><input type="checkbox" name="fields" value="text" checked> Text</label>
    <label class="checkbox-pill"><input type="checkbox" name="fields" value="html"> HTML</label>
    <label class="checkbox-pill"><input type="checkbox" name="fields" value="code" checked> Code</label>
  </div>
  <label>匹配方式</label><select name="matchMode"><option value="contains">包含</option><option value="exact">完全相等</option></select>
  <label class="checkbox-pill" style="margin-top:14px"><input type="checkbox" name="caseSensitive"> 区分大小写</label>
  <div class="form-actions"><button type="submit">保存规则</button><span id="rule-message" class="muted"></span></div>
</form>`;
}

function shareForm(): string {
  return String.raw`<form id="link-form" class="card" style="padding:18px">
  <label>链接名称</label><input name="name" placeholder="例如：临时访客">
  <label>过期时间</label><input name="expiresAt" type="datetime-local">
  <label>绑定规则</label><select id="share-rules" name="ruleIds" multiple size="7" required></select>
  <div class="form-actions"><button type="submit">生成链接</button><span id="link-message" class="muted"></span></div>
</form>`;
}

function adminScript(section: AdminSection): string {
  return ADMIN_SCRIPT.replace("__ADMIN_SECTION__", section);
}

const ADMIN_SCRIPT = String.raw`
const state = { rules: [] };
const currentPage = "__ADMIN_SECTION__";
const loginSection = document.querySelector("#login-section");
const appSection = document.querySelector("#app-section");
const loginMessage = document.querySelector("#login-message");
const adminName = document.querySelector("#admin-name");
const logoutButton = document.querySelector("#logout");

function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}
function formatDate(value) { return value ? new Date(value).toLocaleString() : "--"; }
function optional(selector) { return document.querySelector(selector); }
function on(selector, eventName, handler) {
  const element = optional(selector);
  if (element) element.addEventListener(eventName, handler);
}

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { "content-type": "application/json", ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "请求失败");
  return data;
}
function showApp(admin) {
  loginSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  logoutButton.classList.remove("hidden");
  adminName.textContent = admin.username;
}
function showLogin() {
  loginSection.classList.remove("hidden");
  appSection.classList.add("hidden");
  logoutButton.classList.add("hidden");
  adminName.textContent = "";
}

on("#login-form", "submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";
  loginMessage.className = "muted";
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());
  try {
    const data = await api("/api/admin/login", { method: "POST", body: JSON.stringify(body) });
    showApp(data.admin);
    await loadCurrentPage();
  } catch (error) {
    loginMessage.textContent = error.message;
    loginMessage.className = "danger-text";
  }
});
on("#logout", "click", async () => {
  await api("/api/admin/logout", { method: "POST", body: "{}" }).catch(() => null);
  showLogin();
});
on("#search-form", "submit", async (event) => {
  event.preventDefault();
  await loadEmails(new FormData(event.currentTarget).get("q"));
});
on("#reload-emails", "click", () => loadEmails());
on("#rule-form", "submit", submitRuleForm);
on("#link-form", "submit", submitLinkForm);

async function loadCurrentPage() {
  if (currentPage === "rules") await loadRules();
  if (currentPage === "share") await Promise.all([loadRules(), loadLinks()]);
  if (currentPage === "mail") await loadEmails();
}

async function submitRuleForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const body = { name: data.get("name"), keyword: data.get("keyword"), fields: data.getAll("fields"), matchMode: data.get("matchMode"), caseSensitive: data.has("caseSensitive") };
  try {
    await api("/api/admin/rules", { method: "POST", body: JSON.stringify(body) });
    form.reset();
    form.querySelectorAll('input[name="fields"]').forEach((input) => { input.checked = ["subject", "text", "code"].includes(input.value); });
    optional("#rule-message").textContent = "已保存";
    await loadRules();
  } catch (error) {
    optional("#rule-message").textContent = error.message;
  }
}
async function submitLinkForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const expiresRaw = data.get("expiresAt");
  const body = { name: data.get("name"), expiresAt: expiresRaw ? new Date(expiresRaw).toISOString() : null, ruleIds: data.getAll("ruleIds").map(Number) };
  try {
    const result = await api("/api/admin/share-links", { method: "POST", body: JSON.stringify(body) });
    const output = optional("#new-link");
    output.classList.remove("hidden");
    output.textContent = result.url;
    optional("#link-message").textContent = "已生成";
    await loadLinks();
  } catch (error) {
    optional("#link-message").textContent = error.message;
  }
}

function updateMetrics(emails) {
  const total = optional("#metric-total");
  if (!total) return;
  const codeCount = emails.reduce((sum, email) => sum + String(email.codes || "").split(/[\s,]+/).filter(Boolean).length, 0);
  total.textContent = String(emails.length);
  optional("#metric-codes").textContent = String(codeCount);
  optional("#metric-recent").textContent = emails[0] ? new Date(emails[0].received_at).toLocaleTimeString() : "--";
}
async function loadEmails(q = "") {
  const data = await api("/api/admin/emails?q=" + encodeURIComponent(q || ""));
  updateMetrics(data.emails);
  const rows = data.emails.map((email) => '<tr data-id="' + email.id + '">' +
    '<td><span class="badge muted-badge">#' + email.id + '</span></td>' +
    '<td><strong>' + escapeText(email.subject || "(无主题)") + '</strong><div class="muted">' + escapeText(email.codes || "") + '</div></td>' +
    '<td>' + escapeText(email.from_address || email.envelope_from) + '</td>' +
    '<td>' + escapeText(email.envelope_to) + '</td>' +
    '<td>' + escapeText(formatDate(email.received_at)) + '</td></tr>').join("");
  optional("#emails-table").innerHTML = '<div class="table-wrap"><table><thead><tr><th>ID</th><th>主题</th><th>From</th><th>To</th><th>时间</th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="5"><div class="empty-state">暂无邮件</div></td></tr>') + '</tbody></table></div>';
  document.querySelectorAll("tr[data-id]").forEach((row) => row.addEventListener("click", () => loadEmailDetail(row.dataset.id)));
}
async function loadEmailDetail(id) {
  const data = await api("/api/admin/emails/" + encodeURIComponent(id));
  const email = data.email;
  const codes = email.codes.map((code) => '<span class="chip code">' + escapeText(code.code) + '</span>').join("");
  optional("#email-detail").classList.remove("hidden");
  optional("#email-detail-content").innerHTML = '<div class="detail-grid"><div class="chips">' + (codes || '<span class="badge muted-badge">无验证码</span>') + '</div>' +
    '<div class="detail-row"><strong>发件地址</strong><span>' + escapeText(email.from_address || email.envelope_from) + '</span></div>' +
    '<div class="detail-row"><strong>收件地址</strong><span>' + escapeText(email.envelope_to) + '</span></div>' +
    '<h3>Text</h3><pre>' + escapeText(email.content.text || "") + '</pre><h3>HTML</h3><pre>' + escapeText(email.content.html || "") +
    '</pre><h3>Headers</h3><pre>' + escapeText(email.content.headers || "") + '</pre><h3>Attachments</h3><pre>' + escapeText(JSON.stringify(email.attachments, null, 2)) + '</pre></div>';
}

async function loadRules() {
  const data = await api("/api/admin/rules");
  state.rules = data.rules;
  renderRulesTable();
  const shareRules = optional("#share-rules");
  if (shareRules) shareRules.innerHTML = state.rules.filter((rule) => rule.enabled).map((rule) => '<option value="' + rule.id + '">' + escapeText(rule.name) + '</option>').join("");
}
function renderRulesTable() {
  const table = optional("#rules-table");
  if (!table) return;
  const rows = state.rules.map((rule) => '<tr><td><span class="badge muted-badge">#' + rule.id + '</span></td>' +
    '<td><strong>' + escapeText(rule.name) + '</strong><div class="muted">' + escapeText(rule.keyword) + '</div></td>' +
    '<td>' + escapeText(rule.fields.join(", ")) + '</td><td><span class="badge ' + (rule.enabled ? 'success' : 'muted-badge') + '">' + (rule.enabled ? "启用" : "停用") + '</span></td>' +
    '<td><button class="secondary" data-disable-rule="' + rule.id + '">停用</button></td></tr>').join("");
  table.innerHTML = '<div class="table-wrap"><table><thead><tr><th>ID</th><th>规则</th><th>字段</th><th>状态</th><th></th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="5"><div class="empty-state">暂无规则</div></td></tr>') + '</tbody></table></div>';
  document.querySelectorAll("[data-disable-rule]").forEach((button) => button.addEventListener("click", () => disableRule(Number(button.dataset.disableRule))));
}
async function disableRule(id) {
  const rule = state.rules.find((item) => item.id === id);
  if (!rule) return;
  await api("/api/admin/rules/" + id, { method: "PATCH", body: JSON.stringify({ ...rule, enabled: false }) });
  await loadRules();
}
async function loadLinks() {
  const data = await api("/api/admin/share-links");
  const rows = data.links.map((link) => '<tr><td><span class="badge muted-badge">#' + link.id + '</span></td>' +
    '<td><strong>' + escapeText(link.name || "未命名") + '</strong><div class="muted">规则：' + escapeText(link.ruleIds.join(", ")) + '</div></td>' +
    '<td><span class="badge ' + (link.status === "active" ? 'success' : 'muted-badge') + '">' + escapeText(link.status) + '</span></td>' +
    '<td>' + escapeText(link.expires_at || "长期") + '</td><td><button class="danger" data-disable-link="' + link.id + '">停用</button></td></tr>').join("");
  optional("#links-table").innerHTML = '<div class="table-wrap"><table><thead><tr><th>ID</th><th>名称</th><th>状态</th><th>过期</th><th></th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="5"><div class="empty-state">暂无链接</div></td></tr>') + '</tbody></table></div>';
  document.querySelectorAll("[data-disable-link]").forEach((button) => button.addEventListener("click", async () => {
    await api("/api/admin/share-links/" + button.dataset.disableLink, { method: "PATCH", body: JSON.stringify({ status: "disabled" }) });
    await loadLinks();
  }));
}

(async function init() {
  try {
    const data = await api("/api/admin/me");
    showApp(data.admin);
    await loadCurrentPage();
  } catch {
    showLogin();
  }
})();`;
