import { escapeHtml, page } from "./layout";

export function visitorPage(token: string): string {
  return page(
    "访问代码",
    `<header>
  <h1>访问代码</h1>
  <span id="status" class="muted">同步中</span>
</header>
<main>
  <section>
    <div class="toolbar">
      <button id="refresh" type="button">刷新</button>
      <span class="muted">窗口：最近 30 分钟</span>
    </div>
  </section>
  <section>
    <h2>邮件</h2>
    <div id="emails" class="grid"></div>
  </section>
</main>`,
    visitorScript(escapeHtml(token))
  );
}

function visitorScript(token: string): string {
  return `
const token = "${token}";
const emails = document.querySelector("#emails");
const statusEl = document.querySelector("#status");
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
    emails.innerHTML = "";
    return;
  }
  statusEl.textContent = new Date().toLocaleTimeString();
  if (data.emails.length === 0) {
    emails.innerHTML = '<div class="span-12 muted">暂无匹配邮件</div>';
    return;
  }
  emails.innerHTML = data.emails.map((email) => {
    const codes = email.codes.map((code) => '<span class="chip code">' + escapeText(code) + '</span>').join("");
    return '<section class="span-12">' +
      '<h3>' + escapeText(email.subject || "(无主题)") + '</h3>' +
      '<div class="chips">' + codes + '</div>' +
      '<p class="muted">' + escapeText(email.fromAddress || email.envelopeFrom) + ' · ' +
        escapeText(new Date(email.receivedAt).toLocaleString()) + '</p>' +
      '<pre>' + escapeText(email.body) + '</pre>' +
    '</section>';
  }).join("");
}

loadEmails();
setInterval(loadEmails, 15000);`;
}
