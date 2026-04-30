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
    expect(rulesHtml).toContain('id="rules-table"');
    expect(rulesHtml).not.toContain('id="link-form"');
    expect(rulesHtml).not.toContain('id="search-form"');

    expect(shareHtml).toContain('id="link-form"');
    expect(shareHtml).toContain('id="links-table"');
    expect(shareHtml).toContain('id="share-rules"');
    expect(shareHtml).not.toContain('id="rule-form"');
    expect(shareHtml).not.toContain('id="search-form"');

    expect(databaseHtml).toContain('id="database-status"');
    expect(databaseHtml).toContain('id="upgrade-database"');
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
    expect(html).toContain('id="status"');
    expect(html).toContain('class="mail-frame"');
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
