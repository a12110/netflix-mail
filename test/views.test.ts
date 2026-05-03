import { describe, expect, it } from "vitest";
import { adminPage } from "../src/views/admin";
import { setupPage } from "../src/views/setup";
import { visitorPage } from "../src/views/visitor";

describe("view templates", () => {
  it("renders mail center as the default admin module", () => {
    const html = adminPage("mail");

    [
      'id="login-form"',
      'id="login-section"',
      'id="app-section"',
      'id="auth-loading"',
      'id="search-form"',
      'id="emails-table"',
      'id="email-detail"',
      'id="admin-auto-refresh-toggle"',
      'id="admin-auto-refresh-label"',
      'id="email-page-prev"',
      'id="email-page-next"',
      'id="email-page-numbers"',
      'id="email-page-size"',
      'href="/admin/rules"',
      'href="/admin/share-links"',
      'href="/admin/database"',
      'class="mail-frame"',
      '高级信息'
    ].forEach((fragment) => expect(html).toContain(fragment));
    expect(html).toContain('id="login-section" class="hero-auth hidden"');
    expect(html).not.toContain('href="/setup"');
    expect(html).not.toContain('id="rule-form"');
    expect(html).not.toContain('id="link-form"');
  });

  it("renders rules and share modules on separate admin pages", () => {
    const rulesHtml = adminPage("rules");
    const shareHtml = adminPage("share");
    const databaseHtml = adminPage("database");

    expect(rulesHtml).toContain('id="rule-form"');
    expect(rulesHtml).toContain('name="action"');
    expect(rulesHtml).toContain('aria-labelledby="rule-form-title"');
    expect(rulesHtml).toContain('role="group" aria-labelledby="rule-builder-title" aria-describedby="rule-builder-help"');
    expect(rulesHtml).toContain('id="rule-builder-root"');
    expect(rulesHtml).toContain('id="rule-builder-summary" class="rule-builder-summary" role="status" aria-live="polite"');
    expect(rulesHtml).toContain('id="rule-builder-add-condition"');
    expect(rulesHtml).toContain('id="rule-builder-add-group"');
    expect(rulesHtml).toContain('id="rule-builder-reset"');
    expect(rulesHtml).toContain("＋ 添加规则组");
    expect(rulesHtml).toContain("满足任一条件");
    expect(rulesHtml).toContain("rule-add-drop-zone");
    expect(rulesHtml).toContain("rule-field-icon");
    expect(rulesHtml).toContain("rule-field-label");
    expect(rulesHtml).toContain("transform: translateY(-50%)");
    expect(rulesHtml).toContain("@media (max-width: 1240px)");
    expect(rulesHtml).toContain(".rule-condition-actions {");
    expect(rulesHtml).toContain("grid-column: 2");
    expect(rulesHtml).toContain(".rule-builder-topline { align-items: flex-start; flex-wrap: wrap; }");
    expect(rulesHtml).toContain('id="rule-builder-quick-apply"');
    expect(rulesHtml).toContain('id="rule-builder-import"');
    expect(rulesHtml).toContain('name="keywordLogic"');
    expect(rulesHtml).toContain('name="fieldLogic"');
    expect(rulesHtml).toContain('name="expressionJson"');
    expect(rulesHtml).toContain('高级表达式 JSON');
    expect(rulesHtml).toContain('拖拽排序或移动到其他分组');
    expect(rulesHtml).toContain("data-builder-drag-id");
    expect(rulesHtml).toContain("data-builder-duplicate");
    expect(rulesHtml).toContain("data-builder-drag-handle");
    expect(rulesHtml).toContain("data-builder-drop-parent");
    expect(rulesHtml).toContain("pointerdown");
    expect(rulesHtml).toContain("pointermove");
    expect(rulesHtml).toContain("pointerup");
    expect(rulesHtml).toContain("pointercancel");
    expect(rulesHtml).toContain("lostpointercapture");
    expect(rulesHtml).toContain("setPointerCapture");
    expect(rulesHtml).toContain("elementsFromPoint");
    expect(rulesHtml).toContain("resolveRuleBuilderNodeDropZone");
    expect(rulesHtml).toContain("findRuleBuilderDropZone");
    expect(rulesHtml).toContain("rule-drag-ghost");
    expect(rulesHtml).toContain("rule-drag-ghost-card");
    expect(rulesHtml).toContain("rule-drag-placeholder");
    expect(rulesHtml).toContain("ensureRuleBuilderGhostHost");
    expect(rulesHtml).toContain("getRuleBuilderGhostHost");
    expect(rulesHtml).toContain('sourceElement?.closest?.("#rule-dialog")');
    expect(rulesHtml).toContain("sourceElement?.closest?.(\"dialog\")");
    expect(rulesHtml).not.toContain("document.body.appendChild(ruleBuilderGhostEl)");
    expect(rulesHtml).toContain("ruleBuilderDropTargetKey");
    expect(rulesHtml).toContain("renderRuleBuilderGhostCard");
    expect(rulesHtml).toContain("getRuleBuilderPlaceholderSize");
    expect(rulesHtml).not.toContain("liveMoveRuleBuilderNode");
    expect(rulesHtml).not.toContain("ruleBuilderLiveRendering");
    expect(rulesHtml).not.toContain("dragstart");
    expect(rulesHtml).not.toContain("dragover");
    expect(rulesHtml).not.toContain("dataTransfer");
    expect(rulesHtml).toContain('role="status" aria-live="polite"');
    expect(rulesHtml).toContain('id="rules-table"');
    expect(rulesHtml).not.toContain('id="link-form"');
    expect(rulesHtml).not.toContain('id="search-form"');

    expect(shareHtml).toContain('id="link-form"');
    expect(shareHtml).toContain('id="links-table"');
    expect(shareHtml).toContain('id="share-rules"');
    expect(shareHtml).toContain('name="allowRuleLogic"');
    expect(shareHtml).toContain('name="blockRuleLogic"');
    expect(shareHtml).toContain("任一允许规则命中即可显示");
    expect(shareHtml).toContain("全部排除规则都命中才隐藏");
    expect(shareHtml).toContain("data-reset-link");
    expect(shareHtml).toContain("showUiMessage");
    expect(shareHtml).toContain("允许显示动作（至少选择一个）");
    expect(shareHtml).toContain("隐藏 / 排除动作（命中后隐藏）");
    expect(shareHtml).not.toContain('id="rule-form"');
    expect(shareHtml).not.toContain('id="search-form"');

    expect(databaseHtml).toContain('id="database-status"');
    expect(databaseHtml).toContain('id="upgrade-database"');
    expect(databaseHtml).toContain("当前数据库版本");
    expect(databaseHtml).not.toContain('id="rule-form"');
    expect(databaseHtml).not.toContain('id="link-form"');
    expect(databaseHtml).not.toContain('id="search-form"');
  });

  it("keeps setup form hook and admin navigation", () => {
    const html = setupPage();

    expect(html).toContain('id="setup-form"');
    expect(html).toContain("创建第一个管理员");
    expect(html).toContain('href="/admin"');
  });

  it("keeps visitor hooks and safely embeds token", () => {
    const html = visitorPage('abc</script><b>');

    expect(html).toContain('id="emails"');
    expect(html).toContain('id="refresh"');
    expect(html).toContain('id="visitor-auto-refresh-toggle"');
    expect(html).toContain('id="visitor-auto-refresh-label"');
    expect(html).toContain('id="visitor-page-prev"');
    expect(html).toContain('id="visitor-page-next"');
    expect(html).toContain('id="visitor-page-numbers"');
    expect(html).toContain('id="visitor-page-size"');
    expect(html).toContain('id="status"');
    expect(html).toContain('class="mail-frame"');
    expect(html).toContain("createMailRefreshController");
    expect(html).toContain("data-load-remote-mail");
    expect(html).toContain("trustedAuthentication");
    expect(html).toContain("code-label");
    expect(html).not.toContain("高级信息");
    expect(html).not.toContain('renderMetaPill("ID"');
    expect(html).not.toContain('renderMetaPill("FROM"');
    expect(html).not.toContain('renderMetaPill("TO"');
    expect(html).not.toContain("fromAddress");
    expect(html).not.toContain("envelopeFrom");
    expect(html).not.toContain("envelopeTo");
    expect(html).toContain("\\u003c/script>");
  });
});
