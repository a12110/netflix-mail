# Netflix Mail

Cloudflare Workers + Email Routing + D1 的临时访问代码邮件系统。Worker 接收被 Cloudflare Email Routing 路由进来的邮件，解析后存入 D1，管理员可以查看全部邮件、维护匹配规则并生成访客链接。访客链接每次访问只返回最近 30 分钟窗口内的匹配邮件。

## 功能

- Email Workers 接收邮件，使用 PostalMime 解析 subject、headers、text、html 和附件元数据。
- D1 保存管理员、邮件元数据、正文 chunk、验证码候选、规则、分享链接和审计日志。
- 超大正文会按 `MAX_EMAIL_CONTENT_BYTES` 尽量保存，后续内容截断并标记；headers 使用单独的 `MAX_EMAIL_HEADERS_BYTES` 上限。
- 附件二进制内容不保存；只保存附件文件名、类型、大小等元数据。
- 管理员账号保存在 D1，密码使用 PBKDF2-SHA256 哈希。
- 分享链接只保存 token hash，明文 token 仅创建时返回。
- 同一个 Worker 提供管理员后台和访客页面。

## 本地准备

```bash
yarn install
yarn types
```

创建 D1 数据库：

```bash
npx wrangler d1 create netflix_mail
```

把输出的 `database_id` 写入 `wrangler.jsonc`，然后执行迁移：

```bash
yarn db:migrate:local
```

本地开发需要 `.dev.vars`，可参考 `.dev.vars.example`：

```bash
SESSION_SECRET="replace-with-a-long-random-string"
ADMIN_SETUP_TOKEN="replace-with-a-setup-token"
MAX_EMAIL_CONTENT_BYTES="24000000"
MAX_EMAIL_HEADERS_BYTES="200000"
```

启动：

```bash
yarn dev
```

打开 `/setup` 创建第一个管理员，然后进入 `/admin`。

## 部署

推荐方式：

- **网页 GUI 部署**：参考 [Cloudflare Workers 网页 GUI 部署教程](docs/cloudflare-workers-gui-deploy.md)。该教程覆盖“上传打包后的 `dist-gui/index.js`”和“Workers Builds 导入 Git 仓库”两种方式，并包含 D1、Variables/Secrets、D1 Console 初始化表、Email Routing 绑定 Worker。
- **CLI 部署**：适合本地已登录 Wrangler 的场景，步骤如下。

设置生产 secrets：

```bash
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ADMIN_SETUP_TOKEN
```

执行远程迁移并部署：

```bash
yarn db:migrate:remote
yarn deploy
```

部署后在 Cloudflare Dashboard 的 Email Routing 中启用路由，并把目标地址绑定到这个 Worker。项目不会自动修改 Cloudflare Email Routing 设置。

## 规则与访客链接

规则支持字段：

- `from`
- `to`
- `subject`
- `text`
- `html`
- `code`

分享链接创建时选择一个或多个规则。访客 API 每次请求都会计算 `now - 30 minutes` 到当前时刻的窗口，所以页面轮询时能看到新收到的匹配邮件，但不会继续展示超过 30 分钟的旧邮件。

## 验证

```bash
yarn run check
```

常用命令：

```bash
yarn test
yarn tsc --noEmit
yarn dev
```

生成网页 GUI 手动上传用的单文件 Worker：

```bash
yarn build:gui
```
