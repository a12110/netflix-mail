import { COMMON_MAIL_CLIENT_SCRIPT } from "./mail-shared";
import type { AdminSection } from "./admin";

export function adminScript(section: AdminSection): string {
  return COMMON_MAIL_CLIENT_SCRIPT + ADMIN_SCRIPT.replace("__ADMIN_SECTION__", section);
}

const ADMIN_SCRIPT = String.raw`
const state = { rules: [], links: [], emails: [], selectedEmailId: null, currentQuery: "" };
const currentPage = "__ADMIN_SECTION__";
const authLoading = document.querySelector("#auth-loading");
const loginSection = document.querySelector("#login-section");
const appSection = document.querySelector("#app-section");
const loginMessage = document.querySelector("#login-message");
const adminName = document.querySelector("#admin-name");
const logoutButton = document.querySelector("#logout");

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { "content-type": "application/json", ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "请求失败");
  return data;
}
function showApp(admin) {
  authLoading.classList.add("hidden");
  loginSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  logoutButton.classList.remove("hidden");
  adminName.textContent = admin.username;
}
function showLogin() {
  authLoading.classList.add("hidden");
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
on("#open-rule-form", "click", () => openRuleForm());
on("#open-link-form", "click", () => openLinkForm());
on("#upgrade-database", "click", () => upgradeDatabase());
on("#rule-form", "submit", submitRuleForm);
on("#link-form", "submit", submitLinkForm);
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => closeDialog(button.dataset.closeDialog));
});

async function loadCurrentPage() {
  if (currentPage === "rules") await loadRules();
  if (currentPage === "share") await Promise.all([loadRules(), loadLinks()]);
  if (currentPage === "database") await loadDatabaseStatus();
  if (currentPage === "mail") await loadEmails();
}

async function submitRuleForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const id = String(data.get("id") || "");
  const body = {
    name: data.get("name"),
    keyword: data.get("keyword"),
    fields: data.getAll("fields"),
    matchMode: data.get("matchMode"),
    caseSensitive: data.has("caseSensitive"),
    enabled: data.has("enabled")
  };
  try {
    const path = id ? "/api/admin/rules/" + encodeURIComponent(id) : "/api/admin/rules";
    await api(path, { method: id ? "PATCH" : "POST", body: JSON.stringify(body) });
    optional("#rule-message").textContent = id ? "已更新" : "已保存";
    closeDialog("rule-dialog");
    resetRuleForm();
    await loadRules();
  } catch (error) {
    optional("#rule-message").textContent = error.message;
  }
}
async function submitLinkForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const id = String(data.get("id") || "");
  const expiresRaw = data.get("expiresAt");
  const body = {
    name: data.get("name"),
    expiresAt: expiresRaw ? new Date(expiresRaw).toISOString() : null,
    ruleIds: data.getAll("ruleIds").map(Number),
    status: data.get("status")
  };
  try {
    if (id) {
      await api("/api/admin/share-links/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify(body) });
      optional("#link-message").textContent = "已更新";
    } else {
      const result = await api("/api/admin/share-links", { method: "POST", body: JSON.stringify(body) });
      renderGeneratedLink(result.url);
      optional("#link-message").textContent = "已生成";
    }
    closeDialog("link-dialog");
    resetLinkForm();
    await loadLinks();
  } catch (error) {
    optional("#link-message").textContent = error.message;
  }
}

function updateMetrics(emails) {
  const total = optional("#metric-total");
  if (!total) return;
  total.textContent = String(emails.length);
  optional("#metric-codes").textContent = String(emails.filter((email) => normalizeCodes(email.codes).length > 0).length);
  optional("#metric-recent").textContent = emails[0] ? formatTime(emails[0].received_at) : "--";
}
async function loadEmails(q = state.currentQuery) {
  state.currentQuery = String(q || "");
  const data = await api("/api/admin/emails?q=" + encodeURIComponent(state.currentQuery));
  state.emails = data.emails;
  updateMetrics(state.emails);
  renderAdminEmailList();
  const nextId = resolveAdminSelectedEmailId();
  if (nextId) await loadEmailDetail(nextId);
  else renderAdminEmptyDetail("暂无邮件");
}
function resolveAdminSelectedEmailId() {
  if (state.emails.length === 0) return null;
  const selected = state.emails.find((email) => String(email.id) === String(state.selectedEmailId));
  return selected ? selected.id : state.emails[0].id;
}
function renderAdminEmailList() {
  const list = optional("#emails-table");
  if (!list) return;
  list.innerHTML = state.emails.map(renderAdminEmailListItem).join("") || '<div class="empty-state">暂无邮件</div>';
  list.querySelectorAll("[data-id]").forEach((item) => item.addEventListener("click", () => loadEmailDetail(item.dataset.id)));
}
function renderAdminEmailListItem(email) {
  const selected = String(email.id) === String(state.selectedEmailId) ? " selected" : "";
  const sender = email.from_address || email.envelope_from || "--";
  return '<button type="button" class="mail-list-item' + selected + '" data-id="' + email.id + '">' +
    '<strong>' + escapeText(email.subject || "(无主题)") + '</strong>' +
    '<div class="mail-list-tags">' + renderMetaPill("ID", email.id) + renderMetaPill("时间", formatDate(email.received_at)) + '</div>' +
    '<div class="mail-list-tags">' + renderMetaPill("FROM", sender) + '</div>' +
    '<div class="mail-list-tags">' + renderMetaPill("TO", email.envelope_to) + '</div>' +
  '</button>';
}
async function loadEmailDetail(id) {
  const data = await api("/api/admin/emails/" + encodeURIComponent(id));
  const email = data.email;
  const body = cleanEmailBody(email.content.text || htmlToText(email.content.html) || "");
  state.selectedEmailId = String(email.id);
  renderAdminEmailList();
  optional("#email-detail").classList.remove("hidden");
  optional("#email-detail-content").innerHTML = renderAdminEmailDetail(email, body);
  bindAdminDetailActions();
}
function renderAdminEmailDetail(email, body) {
  const codes = renderCodeChips(email.codes) || '<span class="badge muted-badge">无验证码</span>';
  const trusted = hasTrustedAuthentication(email.content.headers || "");
  const attachmentCount = Number(email.attachment_count || email.attachments?.length || 0);
  const attachmentTag = attachmentCount > 0 ? '<span class="badge muted-badge">附件 ' + attachmentCount + '</span>' : "";
  const index = state.emails.findIndex((item) => String(item.id) === String(email.id));
  const prevDisabled = index <= 0 ? " disabled" : "";
  const nextDisabled = index < 0 || index >= state.emails.length - 1 ? " disabled" : "";
  return '<div class="mail-detail-view"><div class="mail-detail-nav">' +
    '<button type="button" class="secondary" data-mail-prev' + prevDisabled + '>‹ 上一封</button>' +
    '<button type="button" class="secondary" data-mail-next' + nextDisabled + '>下一封 ›</button></div>' +
    '<div class="mail-detail-header"><h2>' + escapeText(email.subject || "(无主题)") + '</h2>' +
    '<div class="mail-meta-row">' + renderMetaPill("ID", email.id) + renderMetaPill("时间", formatDate(email.received_at)) +
    renderMetaPill("FROM", email.from_address || email.envelope_from) + renderMetaPill("TO", email.envelope_to) + '</div>' +
    '<div class="mail-action-row">' + attachmentTag + '<button type="button" class="secondary" data-toggle-plain>显示纯文本邮件</button>' +
    '<button type="button" class="secondary" data-mail-fullscreen>全屏</button></div></div>' +
    '<div class="chips">' + codes + '</div><div class="mail-preview-stage">' +
    renderMailBodyFromContent(email.content.html || "", body, trusted) + '</div>' +
    '<pre class="mail-plain-panel hidden">' + escapeText(body || "暂无正文") + '</pre>' +
    '<details class="advanced-info"><summary>高级信息</summary><h3>HTML 原文</h3><pre>' + escapeText(email.content.html || "") +
    '</pre><h3>Headers</h3><pre>' + escapeText(email.content.headers || "") + '</pre><h3>Attachments</h3><pre>' +
    escapeText(JSON.stringify(email.attachments, null, 2)) + '</pre></details></div>';
}
function renderAdminEmptyDetail(message) {
  optional("#email-detail").classList.remove("hidden");
  optional("#email-detail-content").innerHTML = '<div class="mail-empty-detail empty-state">' + escapeText(message) + '</div>';
}
function bindAdminDetailActions() {
  on("[data-mail-prev]", "click", () => navigateAdminEmail(-1));
  on("[data-mail-next]", "click", () => navigateAdminEmail(1));
  on("[data-mail-fullscreen]", "click", () => requestMailFullscreen(".mail-preview-stage"));
  on("[data-toggle-plain]", "click", (event) => togglePlainPanel(".mail-plain-panel", event.currentTarget));
  bindRemoteMailButtons("#email-detail");
}
function navigateAdminEmail(delta) {
  const index = state.emails.findIndex((email) => String(email.id) === String(state.selectedEmailId));
  const target = state.emails[index + delta];
  if (target) loadEmailDetail(target.id);
}

async function loadRules() {
  const data = await api("/api/admin/rules");
  state.rules = data.rules;
  renderRulesTable();
  populateShareRules();
}
function renderRulesTable() {
  const list = optional("#rules-table");
  if (!list) return;
  list.innerHTML = state.rules.map(renderRuleItem).join("") || '<div class="empty-state">暂无规则</div>';
  list.querySelectorAll("[data-edit-rule]").forEach((button) => button.addEventListener("click", () => editRule(Number(button.dataset.editRule))));
  list.querySelectorAll("[data-delete-rule]").forEach((button) => button.addEventListener("click", () => deleteRuleItem(Number(button.dataset.deleteRule))));
}
function renderRuleItem(rule) {
  const status = rule.enabled ? '<span class="badge success">启用</span>' : '<span class="badge muted-badge">停用</span>';
  const mode = rule.matchMode === "exact" ? "完全相等" : "包含";
  return '<article class="list-item-card">' +
    '<div class="item-main"><div class="item-title-row"><strong>' + escapeText(rule.name) + '</strong><span class="badge muted-badge">#' + rule.id + '</span>' + status + '</div>' +
    '<div class="item-meta">' + renderMetaPill("关键词", rule.keyword) + renderMetaPill("字段", rule.fields.join(", ")) + renderMetaPill("方式", mode) +
    renderMetaPill("大小写", rule.caseSensitive ? "区分" : "不区分") + '</div></div>' +
    '<div class="item-actions"><button type="button" class="secondary" data-edit-rule="' + rule.id + '">编辑</button>' +
    '<button type="button" class="danger" data-delete-rule="' + rule.id + '">删除</button></div></article>';
}
function openRuleForm() {
  resetRuleForm();
  showDialog("rule-dialog");
}
function resetRuleForm() {
  const form = optional("#rule-form");
  if (!form) return;
  form.reset();
  form.elements.id.value = "";
  form.elements.enabled.checked = true;
  form.querySelectorAll('input[name="fields"]').forEach((input) => { input.checked = ["subject", "text", "code"].includes(input.value); });
  optional("#rule-form-title").textContent = "添加规则";
  optional("#rule-submit").textContent = "保存规则";
  optional("#rule-message").textContent = "";
}
function editRule(id) {
  const rule = state.rules.find((item) => Number(item.id) === id);
  const form = optional("#rule-form");
  if (!rule || !form) return;
  resetRuleForm();
  form.elements.id.value = rule.id;
  form.elements.name.value = rule.name || "";
  form.elements.keyword.value = rule.keyword || "";
  form.elements.matchMode.value = rule.matchMode || "contains";
  form.elements.caseSensitive.checked = Boolean(rule.caseSensitive);
  form.elements.enabled.checked = Boolean(rule.enabled);
  form.querySelectorAll('input[name="fields"]').forEach((input) => { input.checked = rule.fields.includes(input.value); });
  optional("#rule-form-title").textContent = "编辑规则";
  optional("#rule-submit").textContent = "保存修改";
  showDialog("rule-dialog");
}
async function deleteRuleItem(id) {
  const rule = state.rules.find((item) => Number(item.id) === id);
  if (!rule || !confirm("确认删除规则“" + rule.name + "”？关联分享链接会同步失去该规则。")) return;
  await api("/api/admin/rules/" + encodeURIComponent(id), { method: "DELETE" });
  await Promise.all([loadRules(), currentPage === "share" ? loadLinks() : Promise.resolve()]);
}
async function loadLinks() {
  const data = await api("/api/admin/share-links");
  state.links = data.links;
  renderLinksTable();
}
function renderLinksTable() {
  const list = optional("#links-table");
  if (!list) return;
  list.innerHTML = state.links.map(renderLinkItem).join("") || '<div class="empty-state">暂无链接</div>';
  list.querySelectorAll("[data-edit-link]").forEach((button) => button.addEventListener("click", () => editLink(Number(button.dataset.editLink))));
  list.querySelectorAll("[data-copy-link]").forEach((button) => button.addEventListener("click", () => copyShareLink(Number(button.dataset.copyLink))));
  list.querySelectorAll("[data-delete-link]").forEach((button) => button.addEventListener("click", () => deleteLinkItem(Number(button.dataset.deleteLink))));
}
function renderLinkItem(link) {
  const status = link.status === "active" ? '<span class="badge success">active</span>' : '<span class="badge muted-badge">disabled</span>';
  const copyHint = link.url ? "复制链接" : "旧链接缺少可恢复 token，无法重新获取";
  return '<article class="list-item-card">' +
    '<div class="item-main"><div class="item-title-row"><strong>' + escapeText(link.name || "未命名") + '</strong><span class="badge muted-badge">#' + link.id + '</span>' + status + '</div>' +
    '<div class="item-meta">' + renderMetaPill("规则", link.ruleIds.join(", ") || "无") + renderMetaPill("过期", formatDate(link.expires_at)) +
    renderMetaPill("窗口", String(link.window_minutes || 30) + " 分钟") + renderMetaPill("最近访问", formatDate(link.last_accessed_at)) + '</div></div>' +
    '<div class="item-actions"><button type="button" class="secondary" data-edit-link="' + link.id + '">编辑</button>' +
    '<button type="button" class="secondary" title="' + escapeAttribute(copyHint) + '" data-copy-link="' + link.id + '">复制</button>' +
    '<button type="button" class="danger" data-delete-link="' + link.id + '">删除</button></div></article>';
}
function openLinkForm() {
  resetLinkForm();
  populateShareRules();
  showDialog("link-dialog");
}
function resetLinkForm() {
  const form = optional("#link-form");
  if (!form) return;
  form.reset();
  form.elements.id.value = "";
  form.elements.status.value = "active";
  populateShareRules();
  optional("#link-form-title").textContent = "添加分享链接";
  optional("#link-submit").textContent = "生成链接";
  optional("#link-message").textContent = "";
}
function editLink(id) {
  const link = state.links.find((item) => Number(item.id) === id);
  const form = optional("#link-form");
  if (!link || !form) return;
  resetLinkForm();
  form.elements.id.value = link.id;
  form.elements.name.value = link.name || "";
  form.elements.expiresAt.value = toDatetimeLocal(link.expires_at);
  form.elements.status.value = link.status || "active";
  populateShareRules(link.ruleIds);
  optional("#link-form-title").textContent = "编辑分享链接";
  optional("#link-submit").textContent = "保存修改";
  showDialog("link-dialog");
}
async function copyShareLink(id) {
  const link = state.links.find((item) => Number(item.id) === id);
  if (!link) return;
  if (!link.url) {
    optional("#link-message").textContent = "旧链接缺少可恢复 token，无法重新获取。请重新生成链接。";
    return;
  }
  await copyText(link.url);
  optional("#link-message").textContent = "已复制链接";
}
async function deleteLinkItem(id) {
  const link = state.links.find((item) => Number(item.id) === id);
  if (!link || !confirm("确认删除分享链接“" + (link.name || "未命名") + "”？")) return;
  await api("/api/admin/share-links/" + encodeURIComponent(id), { method: "DELETE" });
  await loadLinks();
}
function populateShareRules(selectedIds = []) {
  const select = optional("#share-rules");
  if (!select) return;
  const selected = new Set(selectedIds.map(String));
  const rules = state.rules.filter((rule) => rule.enabled || selected.has(String(rule.id)));
  select.innerHTML = rules.map((rule) => '<option value="' + rule.id + '"' + (selected.has(String(rule.id)) ? " selected" : "") + '>' +
    escapeText(rule.name + (rule.enabled ? "" : "（停用）")) + '</option>').join("");
}
async function loadDatabaseStatus() {
  const data = await api("/api/admin/database/status");
  renderDatabaseStatus(data);
}
async function upgradeDatabase() {
  const message = optional("#database-message");
  if (message) message.textContent = "正在升级数据库...";
  const data = await api("/api/admin/database/upgrade", { method: "POST", body: "{}" });
  renderDatabaseStatus(data);
  if (message) message.textContent = data.appliedMigrations.length ? "已升级：" + data.appliedMigrations.join(", ") : "数据库已是最新";
}
function renderDatabaseStatus(data) {
  const target = optional("#database-status");
  if (!target) return;
  const rows = data.migrations.map((item) => '<tr><td><strong>' + escapeText(item.id) + '</strong><div class="muted">' +
    escapeText(item.description) + '</div></td><td><span class="badge ' + (item.applied ? 'success' : 'muted-badge') + '">' +
    (item.applied ? "已应用" : "待升级") + '</span></td><td>' + escapeText(formatDate(item.appliedAt)) + '</td></tr>').join("");
  target.innerHTML = '<div class="table-wrap"><table><thead><tr><th>迁移</th><th>状态</th><th>应用时间</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}
function showDialog(id) {
  const dialog = optional("#" + id);
  if (!dialog) return;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.classList.remove("hidden");
}
function closeDialog(id) {
  const dialog = optional("#" + id);
  if (!dialog) return;
  if (typeof dialog.close === "function") dialog.close();
  else dialog.classList.add("hidden");
}
function toDatetimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function renderGeneratedLink(url) {
  const output = optional("#new-link");
  if (!output) return;
  output.classList.remove("hidden");
  output.innerHTML = '<span><strong>新链接：</strong>' + escapeText(url) + '</span><button type="button" class="secondary" data-copy-new-link>复制</button>';
  on("[data-copy-new-link]", "click", async () => {
    await copyText(url);
    optional("#link-message").textContent = "已复制链接";
  });
}
async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
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
