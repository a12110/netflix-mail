import { page } from "./layout";

export function setupPage(): string {
  return page(
    "初始化管理员",
    `<header><h1>初始化管理员</h1><a href="/admin">管理员后台</a></header>
<main>
  <section>
    <h2>创建第一个管理员</h2>
    <form id="setup-form">
      <label>Setup Token</label>
      <input name="setupToken" type="password" autocomplete="off" required>
      <label>用户名</label>
      <input name="username" autocomplete="username" required>
      <label>密码</label>
      <input name="password" type="password" autocomplete="new-password" minlength="10" required>
      <div class="toolbar" style="margin-top:12px">
        <button type="submit">创建</button>
        <span id="message" class="muted"></span>
      </div>
    </form>
  </section>
</main>`,
    setupScript()
  );
}

function setupScript(): string {
  return `
const form = document.querySelector("#setup-form");
const message = document.querySelector("#message");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
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
