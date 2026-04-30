import { describe, expect, it } from "vitest";
import { cleanEmailBody, stripHtml } from "../src/utils/text";

describe("email text utilities", () => {
  it("removes forwarded metadata and invisible padding from text bodies", () => {
    const body = cleanEmailBody(`---------- Forwarded message ---------
发件人： Netflix <info@account.netflix.com>
Date: 2026年4月27日周一 17:40
Subject: Netflix：您的登录代码
To: <netflix@example.com>

输入此代码登录
\u200b\u200b\u00ad\u00ad
2220


在您的设备上输入以上代码。`);

    expect(body).toBe("输入此代码登录\n\n2220\n\n在您的设备上输入以上代码。");
  });

  it("strips html into readable text", () => {
    expect(stripHtml("<div>输入此代码登录<br><b>2220</b>&nbsp;&amp;</div>")).toBe("输入此代码登录\n 2220 &");
  });
});
