import { page } from "./layout";
import { adminScript } from "./admin-client";

export type AdminSection = "mail" | "rules" | "share" | "database";

export function adminPage(section: AdminSection = "mail"): string {
  return page("管理员后台", adminBody(section), adminScript(section));
}

const MAIL_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke-width="2"/><path d="m4 7 8 6 8-6" stroke-width="2"/></svg>`;
const SHIELD_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6v5c0 4.5 2.9 8.4 7 10 4.1-1.6 7-5.5 7-10V6z" stroke-width="2"/><path d="m9 12 2 2 4-5" stroke-width="2"/></svg>`;
const LINK_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" stroke-width="2"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" stroke-width="2"/></svg>`;
const RULE_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M4 5h16M7 12h10M10 19h4" stroke-width="2" stroke-linecap="round"/></svg>`;
const DB_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="5" rx="7" ry="3" stroke-width="2"/><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" stroke-width="2"/><path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" stroke-width="2"/></svg>`;

const TITLES: Record<AdminSection, string> = {
  mail: "邮件中心",
  rules: "规则管理",
  share: "分享链接",
  database: "数据库管理"
};

function adminBody(section: AdminSection): string {
  return String.raw`
${authLoading()}
${loginSection()}
<div id="app-section" class="app-shell hidden">
  <aside class="sidebar">
    <div class="brand"><span class="brand-icon">${MAIL_ICON}</span><span>邮件管家</span></div>
    <nav class="sidebar-nav" aria-label="后台导航">
      ${navItem("mail", section, "/admin", MAIL_ICON, "邮件中心")}
      ${navItem("rules", section, "/admin/rules", RULE_ICON, "规则管理")}
      ${navItem("share", section, "/admin/share-links", LINK_ICON, "分享链接")}
      ${navItem("database", section, "/admin/database", DB_ICON, "数据库管理")}
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

function authLoading(): string {
  return String.raw`<div id="auth-loading" class="auth-loading">
  <div class="brand"><span class="brand-icon">${MAIL_ICON}</span><span>Netflix Mail</span></div>
  <div class="inline-status"><span class="status-dot"></span><span>正在确认登录状态...</span></div>
</div>`;
}

function loginSection(): string {
  return String.raw`<section id="login-section" class="hero-auth hidden">
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
  if (section === "database") return databaseSection();
  return mailSection();
}

function mailSection(): string {
  return String.raw`<section id="mail-center" class="mail-viewer-shell admin-mail-viewer">
  <form id="search-form" class="mail-viewer-topbar">
    <input name="q" aria-label="搜索邮件" placeholder="留空查询所有地址；或输入主题、发件人、收件人">
    <button type="submit">查询</button>
  </form>
  <div class="mail-viewer-controls">
    <div class="mail-refresh-actions" aria-label="邮件刷新控制">
      <label class="mail-auto-refresh-control" for="admin-auto-refresh-toggle">
        <span id="admin-auto-refresh-label">60秒后刷新</span>
        <input id="admin-auto-refresh-toggle" type="checkbox" checked aria-label="自动刷新邮件">
        <span class="mail-auto-refresh-switch" aria-hidden="true"></span>
      </label>
      <button id="reload-emails" type="button" class="secondary">刷新</button>
    </div>
    <span class="mail-control-chip">本页 <strong id="metric-page-count">0</strong></span>
    <span class="mail-control-chip">总结果 <strong id="metric-total">0</strong></span>
    <span class="mail-control-chip">命中邮件 <strong id="metric-codes">0</strong></span>
    <div class="mail-pagination-controls" aria-label="邮件分页">
      <button id="email-page-prev" type="button" class="secondary">上一页</button>
      <span class="mail-page-indicator">第 <strong id="metric-current-page">0</strong> / <strong id="metric-total-pages">0</strong> 页</span>
      <div id="email-page-numbers" class="mail-page-numbers" aria-label="邮件页码"></div>
      <label>每页
        <select id="email-page-size" aria-label="每页邮件数量">
          <option value="20">20</option>
          <option value="50" selected>50</option>
          <option value="100">100</option>
        </select>
      </label>
      <button id="email-page-next" type="button" class="secondary">下一页</button>
    </div>
  </div>
  <div class="mail-viewer-grid">
    <aside class="mail-list-panel" aria-label="邮件列表">
      <div class="mail-list-title"><strong>邮件列表</strong><span>点击左侧邮件查看正文</span></div>
      <div id="emails-table" class="mail-list"></div>
    </aside>
    <article id="email-detail" class="mail-detail-panel hidden" aria-live="polite">
      <div id="email-detail-content"></div>
    </article>
  </div>
</section>`;
}

function rulesSection(): string {
  return String.raw`<section id="rule-center" class="rule-page-shell">
  <div class="rule-page-toolbar rule-page-header">
    <div class="card-title"><p class="page-kicker">Rules</p><h1>规则管理</h1><p class="muted">按命中后动作维护访客可见邮件，支持允许显示与隐藏排除。</p></div>
    <button id="open-rule-form" type="button">添加规则</button>
  </div>
  ${ruleForm()}
  <div id="rules-table" class="rule-list-shell"></div>
</section>`;
}

function shareSection(): string {
  return String.raw`<section id="share-center">
  <div class="card-header">
    <div class="card-title"><p class="page-kicker">Share Links</p><h1>分享链接</h1><p class="muted">为访客生成临时访问链接，只返回最近 30 分钟命中邮件。</p></div>
    <button id="open-link-form" type="button">添加分享链接</button>
  </div>
  ${shareForm()}
  <div id="new-link" class="generated-link hidden"></div>
  <div id="links-table"></div>
</section>`;
}

function databaseSection(): string {
  return String.raw`<section id="database-center">
  <div class="card-header">
    <div class="card-title"><p class="page-kicker">Database</p><h1>数据库管理</h1><p class="muted">更新 Worker JS 后，可在这里检查并升级数据库版本。</p></div>
    <button id="upgrade-database" class="hidden" type="button">升级数据库</button>
  </div>
  <div id="database-message" class="muted" style="margin-bottom:12px"></div>
  <div id="database-status"></div>
</section>`;
}

function ruleForm(): string {
  return String.raw`<dialog id="rule-dialog" class="modal-card" aria-labelledby="rule-form-title">
<form id="rule-form" class="modal-form rule-dialog-form">
  <input type="hidden" name="id">
  <div class="rule-dialog-shell">
    <div class="modal-title-row rule-dialog-title-row"><div><h2 id="rule-form-title">添加规则</h2></div><button type="button" class="secondary rule-dialog-close" data-close-dialog="rule-dialog" aria-label="关闭">×</button></div>
    <div class="rule-form-meta-grid">
      <label class="rule-form-field"><span>规则名称</span><input name="name" placeholder="例如：Netflix 登录验证码" required></label>
      <label class="rule-form-field"><span>命中后动作</span><select name="action"><option value="allow">允许显示：命中后可在访客链接中显示</option><option value="block">隐藏 / 排除：命中后从访客链接中隐藏</option></select></label>
    </div>
    <div class="rule-canvas" role="group" aria-labelledby="rule-builder-title" aria-describedby="rule-builder-help">
      <div class="rule-builder-topline">
        <div><strong id="rule-builder-title">可视化条件组</strong><p id="rule-builder-help" class="muted">用条件卡片组合 AND / OR 关系，拖拽排序或移动到其他分组。</p></div>
        <div id="rule-builder-summary" class="rule-builder-summary" role="status" aria-live="polite">当前表达式：未配置</div>
      </div>
      <div class="rule-builder-actions rule-builder-toolbar rule-builder-fallback-toolbar"><button type="button" class="secondary" id="rule-builder-add-condition">＋ 添加条件</button><button type="button" class="secondary" id="rule-builder-add-group">＋ 添加规则组</button><button type="button" class="secondary" id="rule-builder-reset">重置</button></div>
      <div id="rule-builder-root" class="rule-builder-tree rule-workspace" aria-label="规则条件树"></div>
    </div>
    <div class="rule-dialog-panels">
      <details class="rule-quick"><summary>批量生成条件</summary>
        <label>关键词（支持多行或逗号分隔）</label><textarea name="keyword" rows="4" placeholder="netflix&#10;verification code&#10;account access"></textarea>
        <div class="rule-grid">
          <div><label>关键词关系</label><select name="keywordLogic"><option value="any">任一关键词命中</option><option value="all">所有关键词都命中</option></select></div>
          <div><label>字段关系</label><select name="fieldLogic"><option value="any">任一字段命中</option><option value="all">每个选中字段都命中</option></select></div>
        </div>
        <label>匹配字段</label>
        <div class="chips">
          <label class="checkbox-pill"><input type="checkbox" name="fields" value="from"> From</label>
          <label class="checkbox-pill"><input type="checkbox" name="fields" value="to"> To</label>
          <label class="checkbox-pill"><input type="checkbox" name="fields" value="subject" checked> Subject</label>
          <label class="checkbox-pill"><input type="checkbox" name="fields" value="text" checked> Text</label>
          <label class="checkbox-pill"><input type="checkbox" name="fields" value="html"> HTML</label>
          <label class="checkbox-pill"><input type="checkbox" name="fields" value="code" checked> Code</label>
        </div>
        <div class="rule-grid">
          <div><label>匹配方式</label><select name="matchMode"><option value="contains">包含</option><option value="exact">完全相等</option><option value="startsWith">开头匹配</option><option value="endsWith">结尾匹配</option><option value="regex">正则表达式</option></select></div>
          <label class="checkbox-pill rule-enabled-chip"><input type="checkbox" name="caseSensitive"> 区分大小写</label>
        </div>
        <button type="button" class="secondary" id="rule-builder-quick-apply">应用到可视化编辑器</button>
      </details>
      <details class="rule-advanced"><summary>高级表达式 JSON 预览 / 导入</summary><textarea id="rule-expression-json" name="expressionJson" rows="8" spellcheck="false" placeholder='{"op":"and","children":[{"op":"condition","field":"subject","operator":"contains","value":"Netflix"}]}'></textarea><div class="rule-builder-actions"><button type="button" class="secondary" id="rule-builder-import">导入 JSON</button><button type="button" class="secondary" id="rule-builder-copy-json">复制 JSON</button></div><p class="muted">JSON 会随可视化编辑器自动刷新；手动修改后请点击“导入 JSON”。</p></details>
    </div>
    <div class="rule-dialog-footer">
      <label class="checkbox-pill rule-enabled-chip"><input type="checkbox" name="enabled" checked> 启用规则</label>
      <div class="rule-dialog-submit"><span id="rule-message" class="muted" role="status" aria-live="polite"></span><button type="button" class="secondary" data-close-dialog="rule-dialog">取消</button><button id="rule-submit" type="submit">保存规则</button></div>
    </div>
  </div>
</form>
</dialog>`;
}

function shareForm(): string {
  return String.raw`<dialog id="link-dialog" class="modal-card">
<form id="link-form" class="modal-form">
  <input type="hidden" name="id">
  <div class="modal-title-row"><h2 id="link-form-title">添加分享链接</h2><button type="button" class="secondary" data-close-dialog="link-dialog">关闭</button></div>
  <label>链接名称</label><input name="name" placeholder="例如：临时访客">
  <label>过期时间</label><input name="expiresAt" type="datetime-local">
  <label>绑定规则</label><select id="share-rules" name="ruleIds" multiple size="7" required></select>
  <div class="rule-grid">
    <div><label>允许规则关系</label><select name="allowRuleLogic"><option value="or">任一允许规则命中即可显示</option><option value="and">全部允许规则都命中才显示</option></select></div>
    <div><label>排除规则关系</label><select name="blockRuleLogic"><option value="or">任一排除规则命中即隐藏</option><option value="and">全部排除规则都命中才隐藏</option></select></div>
  </div>
  <label>状态</label><select name="status"><option value="active">启用</option><option value="disabled">停用</option></select>
  <div class="form-actions"><button id="link-submit" type="submit">生成链接</button><span id="link-message" class="muted"></span></div>
</form>
</dialog>`;
}
