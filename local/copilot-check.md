# Copilot Check

## 2026-04-30 用户侧邮件显示同步评审

### 结论
- 通过。访客页已同步后台邮件正文显示逻辑：优先 HTML iframe 正文预览，纯文本邮件回退到清洗后的 `pre.mail-body`。
- 访客页不展示后台高级信息（Headers、Attachments、HTML 原文等）。

### 关键检查
- 逻辑正确性：`/api/visitor/:token/emails` 返回 `bodyText`、`bodyHtml`、`trustedAuthentication`，前端根据认证状态决定是否自动加载远程图片/链接。
- 安全性：iframe 继续禁用 script、form、object、embed、frame、connect；默认 `referrerpolicy="no-referrer"`；未可信认证时拦截外部 `src/srcset/href`，需要用户点击确认后才加载。
- 兼容性：保留原 `body`、`codes`、`contentTruncated` 字段，保留 `#emails`、`#refresh`、`#status` DOM hooks。
- UI：访客邮件卡片改为纵向详情结构，避免正文挤压；复用 `.mail-frame`、`.mail-risk`、`.mail-body`。

### 验证
- `yarn run check`：通过，10 个测试文件 / 26 个测试。
- in-app browser：已打开 `http://localhost:8787/v/test`，确认访客页 shell 正常加载，过期 token 显示“链接不可用或已过期”。

### 风险/建议
- 可信认证判断基于邮件头中的 `Authentication-Results`/`ARC-Authentication-Results` 字符串；如果上游解析器未保存这些头，则会按不可信处理并提示用户手动加载。
- 访客页现在会从 API 返回邮件正文 HTML，但仍在浏览器端 iframe 中清洗/沙箱展示，不返回高级元信息。
