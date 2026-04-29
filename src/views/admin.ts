import { page } from "./layout";

export function adminPage(): string {
  return page("管理员后台", ADMIN_BODY, adminScript());
}

const ADMIN_BODY = String.raw`<header>
  <h1>Netflix Mail</h1>
  <div class="toolbar">
    <span id="admin-name" class="muted"></span>
    <button id="logout" class="secondary hidden" type="button">退出</button>
  </div>
</header>
<main>
  <section id="login-section">
    <h2>管理员登录</h2>
    <form id="login-form">
      <label>用户名</label>
      <input name="username" autocomplete="username" required>
      <label>密码</label>
      <input name="password" type="password" autocomplete="current-password" required>
      <div class="toolbar" style="margin-top:12px">
        <button type="submit">登录</button>
        <a href="/setup">初始化管理员</a>
        <span id="login-message" class="muted"></span>
      </div>
    </form>
  </section>

  <div id="app-section" class="hidden">
    <section>
      <h2>邮件</h2>
      <form id="search-form" class="toolbar">
        <div>
          <label>搜索</label>
          <input name="q" placeholder="主题、发件人、收件人">
        </div>
        <button type="submit">查询</button>
        <button id="reload-emails" type="button" class="secondary">刷新</button>
      </form>
      <div id="emails-table"></div>
    </section>

    <section id="email-detail" class="hidden">
      <h2>邮件详情</h2>
      <div id="email-detail-content"></div>
    </section>

    <div class="grid">
      <section class="span-5">
        <h2>规则</h2>
        <form id="rule-form">
          <label>名称</label>
          <input name="name" required>
          <label>关键词</label>
          <input name="keyword" required>
          <label>字段</label>
          <div class="chips">
            <label><input type="checkbox" name="fields" value="from"> From</label>
            <label><input type="checkbox" name="fields" value="to"> To</label>
            <label><input type="checkbox" name="fields" value="subject" checked> Subject</label>
            <label><input type="checkbox" name="fields" value="text" checked> Text</label>
            <label><input type="checkbox" name="fields" value="html"> HTML</label>
            <label><input type="checkbox" name="fields" value="code" checked> Code</label>
          </div>
          <label>匹配方式</label>
          <select name="matchMode">
            <option value="contains">包含</option>
            <option value="exact">完全相等</option>
          </select>
          <label><input type="checkbox" name="caseSensitive"> 区分大小写</label>
          <div class="toolbar" style="margin-top:12px">
            <button type="submit">保存规则</button>
            <span id="rule-message" class="muted"></span>
          </div>
        </form>
        <div id="rules-table"></div>
      </section>

      <section class="span-7">
        <h2>分享链接</h2>
        <form id="link-form">
          <label>名称</label>
          <input name="name" placeholder="例如：临时访客">
          <label>过期时间</label>
          <input name="expiresAt" type="datetime-local">
          <label>规则</label>
          <select id="share-rules" name="ruleIds" multiple size="5" required></select>
          <div class="toolbar" style="margin-top:12px">
            <button type="submit">生成链接</button>
            <span id="link-message" class="muted"></span>
          </div>
        </form>
        <pre id="new-link" class="hidden"></pre>
        <div id="links-table"></div>
      </section>
    </div>
  </div>
</main>`;

const ADMIN_SCRIPT = String.raw`
const state = { rules: [] };
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

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "请求失败");
  }
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

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());
  try {
    const data = await api("/api/admin/login", { method: "POST", body: JSON.stringify(body) });
    showApp(data.admin);
    await loadAll();
  } catch (error) {
    loginMessage.textContent = error.message;
    loginMessage.className = "danger-text";
  }
});

logoutButton.addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST", body: "{}" }).catch(() => null);
  showLogin();
});

document.querySelector("#search-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await loadEmails(new FormData(event.currentTarget).get("q"));
});
document.querySelector("#reload-emails").addEventListener("click", () => loadEmails());

document.querySelector("#rule-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const body = {
    name: data.get("name"),
    keyword: data.get("keyword"),
    fields: data.getAll("fields"),
    matchMode: data.get("matchMode"),
    caseSensitive: data.has("caseSensitive")
  };
  try {
    await api("/api/admin/rules", { method: "POST", body: JSON.stringify(body) });
    form.reset();
    form.querySelectorAll('input[name="fields"]').forEach((input) => {
      input.checked = ["subject", "text", "code"].includes(input.value);
    });
    document.querySelector("#rule-message").textContent = "已保存";
    await loadRules();
  } catch (error) {
    document.querySelector("#rule-message").textContent = error.message;
  }
});

document.querySelector("#link-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const expiresRaw = data.get("expiresAt");
  const body = {
    name: data.get("name"),
    expiresAt: expiresRaw ? new Date(expiresRaw).toISOString() : null,
    ruleIds: data.getAll("ruleIds").map(Number)
  };
  try {
    const result = await api("/api/admin/share-links", { method: "POST", body: JSON.stringify(body) });
    const output = document.querySelector("#new-link");
    output.classList.remove("hidden");
    output.textContent = result.url;
    document.querySelector("#link-message").textContent = "已生成";
    await loadLinks();
  } catch (error) {
    document.querySelector("#link-message").textContent = error.message;
  }
});

async function loadAll() {
  await Promise.all([loadEmails(), loadRules(), loadLinks()]);
}

async function loadEmails(q = "") {
  const data = await api("/api/admin/emails?q=" + encodeURIComponent(q || ""));
  const rows = data.emails.map((email) => '<tr data-id="' + email.id + '">' +
    '<td>' + email.id + '</td>' +
    '<td>' + escapeText(email.subject || "(无主题)") + '<div class="muted">' + escapeText(email.codes || "") + '</div></td>' +
    '<td>' + escapeText(email.from_address || email.envelope_from) + '</td>' +
    '<td>' + escapeText(email.envelope_to) + '</td>' +
    '<td>' + escapeText(new Date(email.received_at).toLocaleString()) + '</td>' +
  '</tr>').join("");
  document.querySelector("#emails-table").innerHTML =
    '<table><thead><tr><th>ID</th><th>主题</th><th>From</th><th>To</th><th>时间</th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="5" class="muted">暂无邮件</td></tr>') + '</tbody></table>';
  document.querySelectorAll("tr[data-id]").forEach((row) => {
    row.addEventListener("click", () => loadEmailDetail(row.dataset.id));
  });
}

async function loadEmailDetail(id) {
  const data = await api("/api/admin/emails/" + encodeURIComponent(id));
  const email = data.email;
  const codes = email.codes.map((code) => '<span class="chip code">' + escapeText(code.code) + '</span>').join("");
  document.querySelector("#email-detail").classList.remove("hidden");
  document.querySelector("#email-detail-content").innerHTML =
    '<div class="chips">' + codes + '</div>' +
    '<p class="muted">' + escapeText(email.from_address || email.envelope_from) + ' → ' + escapeText(email.envelope_to) + '</p>' +
    '<h3>Text</h3><pre>' + escapeText(email.content.text || "") + '</pre>' +
    '<h3>HTML</h3><pre>' + escapeText(email.content.html || "") + '</pre>' +
    '<h3>Headers</h3><pre>' + escapeText(email.content.headers || "") + '</pre>' +
    '<h3>Attachments</h3><pre>' + escapeText(JSON.stringify(email.attachments, null, 2)) + '</pre>';
}

async function loadRules() {
  const data = await api("/api/admin/rules");
  state.rules = data.rules;
  const rows = state.rules.map((rule) => '<tr>' +
    '<td>' + rule.id + '</td>' +
    '<td>' + escapeText(rule.name) + '<div class="muted">' + escapeText(rule.keyword) + '</div></td>' +
    '<td>' + escapeText(rule.fields.join(", ")) + '</td>' +
    '<td>' + (rule.enabled ? "启用" : "停用") + '</td>' +
    '<td><button class="secondary" data-disable-rule="' + rule.id + '">停用</button></td>' +
  '</tr>').join("");
  document.querySelector("#rules-table").innerHTML =
    '<table><thead><tr><th>ID</th><th>规则</th><th>字段</th><th>状态</th><th></th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="5" class="muted">暂无规则</td></tr>') + '</tbody></table>';
  document.querySelector("#share-rules").innerHTML = state.rules
    .filter((rule) => rule.enabled)
    .map((rule) => '<option value="' + rule.id + '">' + escapeText(rule.name) + '</option>')
    .join("");
  document.querySelectorAll("[data-disable-rule]").forEach((button) => {
    button.addEventListener("click", () => disableRule(Number(button.dataset.disableRule)));
  });
}

async function disableRule(id) {
  const rule = state.rules.find((item) => item.id === id);
  if (!rule) return;
  await api("/api/admin/rules/" + id, {
    method: "PATCH",
    body: JSON.stringify({ ...rule, enabled: false })
  });
  await loadRules();
}

async function loadLinks() {
  const data = await api("/api/admin/share-links");
  const rows = data.links.map((link) => '<tr>' +
    '<td>' + link.id + '</td>' +
    '<td>' + escapeText(link.name || "") + '<div class="muted">规则：' + escapeText(link.ruleIds.join(", ")) + '</div></td>' +
    '<td>' + escapeText(link.status) + '</td>' +
    '<td>' + escapeText(link.expires_at || "长期") + '</td>' +
    '<td><button class="danger" data-disable-link="' + link.id + '">停用</button></td>' +
  '</tr>').join("");
  document.querySelector("#links-table").innerHTML =
    '<table><thead><tr><th>ID</th><th>名称</th><th>状态</th><th>过期</th><th></th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="5" class="muted">暂无链接</td></tr>') + '</tbody></table>';
  document.querySelectorAll("[data-disable-link]").forEach((button) => {
    button.addEventListener("click", async () => {
      await api("/api/admin/share-links/" + button.dataset.disableLink, {
        method: "PATCH",
        body: JSON.stringify({ status: "disabled" })
      });
      await loadLinks();
    });
  });
}

(async function init() {
  try {
    const data = await api("/api/admin/me");
    showApp(data.admin);
    await loadAll();
  } catch {
    showLogin();
  }
})();`;

function adminScript(): string {
  return ADMIN_SCRIPT;
}
