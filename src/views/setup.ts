import { page } from "./layout";

export function setupPage(): string {
  return page("初始化管理员", SETUP_BODY, setupScript());
}

const LOCK_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M7 11V8a5 5 0 0 1 10 0v3" stroke-width="2"/><rect x="5" y="11" width="14" height="10" rx="2" stroke-width="2"/><path d="M12 15v2" stroke-width="2" stroke-linecap="round"/></svg>`;
const MAIL_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke-width="2"/><path d="m4 7 8 6 8-6" stroke-width="2"/></svg>`;

const SETUP_BODY = String.raw`
<div class="setup-shell">
  <div class="setup-topbar">
    <a class="brand" href="/admin"><span class="brand-icon">${MAIL_ICON}</span><span>Netflix Mail</span></a>
    <a class="button-link secondary" href="/admin">返回管理员后台</a>
  </div>
  <main>
    <div class="progress-line"><span class="badge">1 / 1</span><span>初始化完成前不可访问后台</span></div>
    <section class="setup-card">
      <span class="soft-icon success" style="width:80px;height:80px;margin:0 auto 22px">${LOCK_ICON}</span>
      <h1>创建第一个管理员</h1>
      <p class="muted" style="margin-top:12px">本步骤用于初始化系统管理员账号，请妥善保管相关信息。</p>
      <form id="setup-form">
        <label>Setup Token</label>
        <input name="setupToken" type="password" autocomplete="off" placeholder="请输入 Setup Token" required>
        <label>用户名</label>
        <input name="username" autocomplete="username" placeholder="请输入用户名" required>
        <label>密码</label>
        <input name="password" type="password" autocomplete="new-password" minlength="10" placeholder="请输入至少 10 位密码" required>
        <div class="form-actions">
          <button type="submit">创建管理员</button>
          <span id="message" class="muted"></span>
        </div>
      </form>
    </section>
    <div class="notice" style="width:min(760px,100%);margin:22px auto 0">
      <span class="soft-icon">${LOCK_ICON}</span>
      <div><strong>安全提示</strong><div>请确保在安全环境中操作。初始化完成后该 Token 将失效且无法恢复。</div></div>
    </div>
  </main>
</div>`;

function setupScript(): string {
  return `
const form = document.querySelector("#setup-form");
const message = document.querySelector("#message");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  message.className = "muted";
  const body = Object.fromEntries(new FormData(form).entries());
  const response = await fetch("/api/setup/admin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    message.textContent = data.error || "创建失败";
    message.className = "danger-text";
    return;
  }
  message.textContent = "已创建";
  message.className = "ok";
  location.href = "/admin";
});`;
}
