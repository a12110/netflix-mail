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
      'id="search-form"',
      'id="emails-table"',
      'id="email-detail"',
      'href="/admin/rules"',
      'href="/admin/share-links"'
    ].forEach((fragment) => expect(html).toContain(fragment));
    expect(html).not.toContain('href="/setup"');
    expect(html).not.toContain('id="rule-form"');
    expect(html).not.toContain('id="link-form"');
  });

  it("renders rules and share modules on separate admin pages", () => {
    const rulesHtml = adminPage("rules");
    const shareHtml = adminPage("share");

    expect(rulesHtml).toContain('id="rule-form"');
    expect(rulesHtml).toContain('id="rules-table"');
    expect(rulesHtml).not.toContain('id="link-form"');
    expect(rulesHtml).not.toContain('id="search-form"');

    expect(shareHtml).toContain('id="link-form"');
    expect(shareHtml).toContain('id="links-table"');
    expect(shareHtml).toContain('id="share-rules"');
    expect(shareHtml).not.toContain('id="rule-form"');
    expect(shareHtml).not.toContain('id="search-form"');
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
    expect(html).toContain("\\u003c/script>");
  });
});
