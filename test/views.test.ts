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
    expect(rulesHtml).toContain('id="rule-builder-root"');
    expect(rulesHtml).toContain('id="rule-builder-add-condition"');
    expect(rulesHtml).toContain('id="rule-builder-add-group"');
    expect(rulesHtml).toContain('id="rule-builder-quick-apply"');
    expect(rulesHtml).toContain('id="rule-builder-import"');
    expect(rulesHtml).toContain('name="keywordLogic"');
    expect(rulesHtml).toContain('name="fieldLogic"');
    expect(rulesHtml).toContain('name="expressionJson"');
    expect(rulesHtml).toContain('高级表达式 JSON');
    expect(rulesHtml).toContain('拖拽排序或移动到其他分组');
    expect(rulesHtml).toContain("data-builder-drag-id");
    expect(rulesHtml).toContain('id="rules-table"');
    expect(rulesHtml).not.toContain('id="link-form"');
    expect(rulesHtml).not.toContain('id="search-form"');

    expect(shareHtml).toContain('id="link-form"');
    expect(shareHtml).toContain('id="links-table"');
    expect(shareHtml).toContain('id="share-rules"');
    expect(shareHtml).toContain("data-reset-link");
    expect(shareHtml).toContain("showUiMessage");
    expect(shareHtml).toContain("允许规则（至少选择一个）");
    expect(shareHtml).toContain("屏蔽规则（命中后隐藏）");
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
