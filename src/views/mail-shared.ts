export const COMMON_MAIL_CLIENT_SCRIPT = String.raw`
function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}
function escapeAttribute(value) {
  return escapeText(value).replace(new RegExp(String.fromCharCode(96), "g"), "&#096;");
}
function formatDate(value) { return value ? new Date(value).toLocaleString() : "--"; }
function formatTime(value) { return value ? new Date(value).toLocaleTimeString() : "--"; }
function optional(selector) { return document.querySelector(selector); }
function on(selector, eventName, handler) {
  const element = optional(selector);
  if (element) element.addEventListener(eventName, handler);
}
function normalizeCodes(codes) {
  if (Array.isArray(codes)) return codes.map((code) => typeof code === "string" ? code : code?.code).filter(Boolean);
  if (typeof codes === "string") return codes.split(",").map((code) => code.trim()).filter(Boolean);
  return [];
}
function renderCodeChips(codes) {
  const items = normalizeCodes(codes);
  return items.map((code) => '<span class="chip code"><span class="code-label">验证码</span>' + escapeText(code) + '</span>').join("");
}
function renderMetaPill(label, value) {
  return '<span class="mail-meta-pill"><strong>' + escapeText(label) + ':</strong> ' + escapeText(value || "--") + '</span>';
}
function renderMailBodyFromContent(html, text, trusted) {
  if (!html) return '<pre class="mail-body">' + escapeText(text || "暂无正文") + '</pre>';
  const warning = trusted ? "" : '<div class="mail-risk"><strong>外部资源已拦截</strong><span>未检测到可信邮件签名/认证结果。为避免追踪或钓鱼风险，默认不加载外部图片和链接。</span><button type="button" class="secondary" data-load-remote-mail>仍然加载图片和链接</button></div>';
  return warning + mailFrameHtml(html, trusted);
}
function mailFrameHtml(html, allowRemote) {
  const sandbox = allowRemote ? ' sandbox="allow-popups allow-popups-to-escape-sandbox"' : ' sandbox=""';
  return '<iframe class="mail-frame"' + sandbox + ' referrerpolicy="no-referrer" data-mail-html="' + escapeAttribute(html) + '" srcdoc="' + escapeAttribute(buildMailFrameDoc(html, allowRemote)) + '"></iframe>';
}
function buildMailFrameDoc(html, allowRemote) {
  const imgSrc = allowRemote ? "data: blob: cid: https:" : "data: blob: cid:";
  return "<!doctype html><html><head><meta charset=\"utf-8\">" +
    "<meta name=\"referrer\" content=\"no-referrer\">" +
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; img-src " + imgSrc + "; style-src 'unsafe-inline'; font-src data:; script-src 'none'; connect-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none';\">" +
    "<base target=\"_blank\"><style>html,body{margin:0;padding:0;background:#fff;color:#111827;font-family:Arial,Helvetica,sans-serif;}body{padding:20px;}table{max-width:100%;}img{max-width:100%;height:auto;}</style>" +
    "</head><body>" + sanitizeEmailHtml(html, allowRemote) + "</body></html>";
}
function sanitizeEmailHtml(html, allowRemote) {
  let output = String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  if (!allowRemote) {
    output = output
      .replace(/\s(src|srcset)\s*=\s*("https?:[^\"]*"|'https?:[^']*'|https?:[^\s>]+)/gi, "")
      .replace(/\shref\s*=\s*("https?:[^\"]*"|'https?:[^']*'|https?:[^\s>]+)/gi, ' href="#"');
  }
  return output;
}
function bindRemoteMailButtons(rootSelector) {
  const root = rootSelector ? optional(rootSelector) : document;
  if (!root) return;
  root.querySelectorAll("[data-load-remote-mail]").forEach((button) => {
    if (button.dataset.boundRemote === "1") return;
    button.dataset.boundRemote = "1";
    button.addEventListener("click", () => {
      const scope = button.closest(".mail-detail-panel") || root;
      const frame = scope.querySelector(".mail-frame[data-mail-html]");
      if (!frame) return;
      const html = frame.getAttribute("data-mail-html") || "";
      frame.setAttribute("sandbox", "allow-popups allow-popups-to-escape-sandbox");
      frame.setAttribute("srcdoc", buildMailFrameDoc(html, true));
      button.closest(".mail-risk")?.remove();
    });
  });
}
function requestMailFullscreen(selector) {
  const element = optional(selector);
  if (element?.requestFullscreen) element.requestFullscreen().catch(() => null);
}
function togglePlainPanel(panelSelector, button) {
  const panel = optional(panelSelector);
  if (!panel) return;
  const hidden = panel.classList.toggle("hidden");
  if (button) button.textContent = hidden ? "显示纯文本邮件" : "隐藏纯文本邮件";
}
function hasTrustedAuthentication(headersText) {
  const text = authenticationHeaderText(headersText).toLowerCase();
  return /\bdkim\s*=\s*pass\b/.test(text) || /\bdmarc\s*=\s*pass\b/.test(text) || /\barc\s*=\s*pass\b/.test(text);
}
function authenticationHeaderText(headersText) {
  try {
    const headers = JSON.parse(headersText || "[]");
    if (!Array.isArray(headers)) return "";
    return headers
      .filter((header) => /^(authentication-results|arc-authentication-results)$/i.test(header.key || header.originalKey || ""))
      .map((header) => String(header.value || ""))
      .join("\n");
  } catch {
    return headersText || "";
  }
}
function htmlToText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>|<\/div\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'");
}
function cleanEmailBody(value) {
  const lines = String(value || "")
    .replace(/[\u00ad\u034f\u061c\u200b-\u200f\u202a-\u202e\u2060-\u206f]/g, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""));
  const output = [];
  let skippingForwardHeader = false;
  for (const line of lines) {
    if (/^-+\s*Forwarded message\s*-+$/i.test(line.trim())) { skippingForwardHeader = true; continue; }
    if (skippingForwardHeader && line.trim() === "") { skippingForwardHeader = false; continue; }
    if (skippingForwardHeader && /^(发件人|寄件者|收件人|主题|日期|from|to|subject|date)[:：]/i.test(line.trim())) continue;
    skippingForwardHeader = false;
    if (line.trim() === "" && output.at(-1)?.trim() === "") continue;
    output.push(line);
  }
  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
`;
