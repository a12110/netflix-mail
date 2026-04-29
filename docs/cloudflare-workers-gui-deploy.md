# Cloudflare Workers 网页 GUI 部署教程

本项目是一个 Cloudflare Workers + Email Routing + D1 应用。这里提供两种网页 GUI 部署方式：

- **方案 A：连接 Git 仓库部署**：适合开发者持续维护，推送代码后自动构建部署。
- **方案 B：上传打包后的代码部署**：适合只想在网页里部署，不想上传完整源码、`node_modules` 或执行本地构建的用户。代码部分只需要复制 `dist-gui/index.js`。

> 推荐给最终使用者的最省事路径是 **方案 B**。D1、变量、Secret、Email Routing 都在 Cloudflare Dashboard 里配置；Worker 代码复制我们打包好的单文件即可。

## 0. 前置条件

- Cloudflare 账号，并且目标域名已经接入 Cloudflare DNS。
- 已拿到本项目的部署材料：
  - `dist-gui/index.js`：打包后的 Worker 代码，用于网页 GUI 粘贴上传。
  - `migrations/0001_initial.sql`：D1 初始化 SQL。
  - 本教程或项目 README。
- 如果使用方案 A，还需要代码已推送到 GitHub 或 GitLab 仓库。

Cloudflare 官方参考：

- [Workers Dashboard 部署入门](https://developers.cloudflare.com/workers/get-started/dashboard/)
- [Workers Versions & Deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/)
- [Workers Builds / Git 集成](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Workers Builds 配置项](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [D1 Dashboard 创建与绑定](https://developers.cloudflare.com/d1/get-started/)
- [Email Routing 规则与 Worker](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/)

## 1. 先创建 D1 数据库

1. 登录 Cloudflare Dashboard。
2. 进入 **Workers & Pages** 或侧边栏的 **Storage & Databases > D1 SQL Database**。
3. 点击 **Create Database**。
4. 数据库名建议填写：`netflix_mail`。
5. 创建完成后，进入数据库详情页，复制数据库的 **Database ID**。

如果你使用方案 A，需要把 `wrangler.jsonc` 里的占位值替换成真实 ID 后提交：

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "netflix_mail",
      "database_id": "粘贴 Cloudflare D1 Database ID",
      "migrations_dir": "migrations"
    }
  ]
}
```

如果你使用方案 B，不需要改 `wrangler.jsonc`；后面直接在 Dashboard 的 **Bindings** 里手动绑定 D1 即可。无论哪种方式，binding 名称都必须是 `DB`，因为代码通过 `env.DB` 访问数据库。

## 2. 方案 B：上传打包后的代码（推荐给非开发者）

这一方案不依赖 Git 仓库，不需要把 TypeScript 源码上传到 Cloudflare，也不需要在 Cloudflare 上安装依赖。我们已经把项目打包成一个 ES Module Worker 文件：`dist-gui/index.js`。

### 2.1 准备上传包

给最终部署者提供下面这些文件即可：

```text
dist-gui/index.js
migrations/0001_initial.sql
docs/cloudflare-workers-gui-deploy.md
```

说明：

- `dist-gui/index.js` 是唯一需要放进 Worker 代码编辑器的文件。
- `dist-gui/index.js.map` 是 Source Map，手动网页部署时可以不上传。
- 如果 Dashboard 编辑器提示最后一行 `//# sourceMappingURL=index.js.map` 找不到 source map，可以忽略；也可以删除这一行后再部署。

维护者如需重新生成打包文件，可在项目根目录执行：

```bash
yarn build:gui
```

### 2.2 在 Dashboard 创建一个空 Worker

1. 打开 Cloudflare Dashboard。
2. 进入 **Workers & Pages**。
3. 点击 **Create application**。
4. 选择一个最简单的 Worker 模板，例如 **Hello World** / **Worker only**。
5. Worker 名称建议填写：`netflix-mail`。
6. 点击 **Create and deploy** 或 **Deploy**，先创建一个可编辑的 Worker。
7. 创建完成后，进入该 Worker 的详情页。

这一步只是为了在 Dashboard 里创建 Worker 容器，模板代码后面会被我们的打包代码全部替换。

### 2.3 粘贴并部署打包代码

1. 在 Worker 详情页点击 **Edit Code**。
2. 打开编辑器里的主代码文件，常见名称可能是 `worker.js`、`index.js` 或 `src/index.js`。
3. 删除模板自带的全部代码。
4. 打开本项目的 `dist-gui/index.js`，复制全部内容。
5. 粘贴到 Cloudflare 编辑器中。
6. 确认文件末尾包含类似下面的 ES Module 导出：

```js
export {
  index_default as default
};
```

7. 点击 **Deploy** 直接发布。
8. 如果你想先保存版本但不立即切流量，可以点击 **Deploy** 旁边的下拉按钮，选择 **Save**；之后在 **Deployments** 里手动发布该版本。

部署成功后，Cloudflare 会分配一个 `*.workers.dev` 地址。此时 Worker 代码已经上传完成，但还不能完整工作，因为还缺少 D1 binding 和 Secrets。

### 2.4 设置兼容性日期

进入 **Settings**，找到 **Compatibility date**，建议设置为项目配置中的日期：

```text
2026-04-28
```

如果 Dashboard 已自动设置为更新日期，通常也可以运行；为了和本项目打包测试环境一致，建议使用上面的日期。

## 3. 方案 A：连接 Git 仓库部署

如果你希望 Cloudflare 每次推送代码后自动部署，可以使用 Workers Builds 导入 GitHub/GitLab 仓库：

1. 打开 Cloudflare Dashboard，进入 **Workers & Pages**。
2. 点击 **Create application**。
3. 选择 **Import a repository**，连接 GitHub/GitLab。
4. 选择本项目仓库。
5. 配置构建：
   - **Project/Worker name**：`netflix-mail`（建议与 `wrangler.jsonc` 的 `name` 一致）。
   - **Production branch**：你的主分支，例如 `main`。
   - **Root directory**：如果项目在仓库根目录，留空；如果在 monorepo 子目录，填该子目录。
   - **Build command**：留空。
   - **Deploy command**：使用默认 `npx wrangler deploy`，或填写 `yarn deploy`。
6. 点击 **Save and Deploy**。
7. 等待构建完成，成功后会得到一个 `*.workers.dev` 访问地址。

注意：Cloudflare Workers Builds 会根据仓库里的 `wrangler.jsonc` 部署 Worker；如果 Dashboard 里的 Worker 名称和 `wrangler.jsonc` 的 `name` 不一致，Git 集成构建可能失败。

## 4. 配置运行时变量与 Secrets

无论使用方案 A 还是方案 B，都需要配置这些运行时值：

1. 打开 **Workers & Pages > netflix-mail**。
2. 进入 **Settings > Variables & Secrets**。
3. 添加以下配置：

| 名称 | 类型 | 示例 | 说明 |
| --- | --- | --- | --- |
| `SESSION_SECRET` | Secret | 随机 32 字节以上字符串 | 必填，用于管理员会话签名 |
| `ADMIN_SETUP_TOKEN` | Secret | 随机一次性 setup token | 必填，用于首次创建管理员 |
| `APP_NAME` | Variable | `Netflix Mail` | 可选，页面展示名 |
| `MAX_EMAIL_CONTENT_BYTES` | Variable | `24000000` | 可选，正文保存上限 |
| `MAX_EMAIL_HEADERS_BYTES` | Variable | `200000` | 可选，headers 保存上限 |

建议：

- `SESSION_SECRET` 使用随机长字符串，不要使用示例值。
- `ADMIN_SETUP_TOKEN` 只用于首次创建管理员；创建完成后建议更换或删除。
- 保存后如 Dashboard 提示需要重新部署或创建新版本，请按提示发布到当前 Worker。

## 5. 绑定 D1 数据库

1. 进入 **Workers & Pages > netflix-mail**。
2. 打开 **Settings > Bindings**。
3. 点击 **Add binding**。
4. 选择 **D1 database**。
5. 填写：
   - **Variable name**：`DB`
   - **D1 database**：`netflix_mail`
6. 保存。
7. 如果 Dashboard 提示需要部署新版本，请发布到当前 Worker。

`DB` 名称必须完全一致，不能写成 `DATABASE`、`D1` 或其他名称。

## 6. 用 D1 Console 初始化数据库表

本项目需要先执行 `migrations/0001_initial.sql` 创建表和索引。

1. 在部署材料中打开 `migrations/0001_initial.sql`，复制完整 SQL。
2. 回到 Cloudflare Dashboard，进入 **D1 SQL Database > netflix_mail**。
3. 打开 **Console**。
4. 粘贴 SQL 并执行。
5. 执行成功后，可用下面 SQL 快速检查核心表是否存在：

```sql
SELECT name FROM sqlite_master
WHERE type = 'table'
ORDER BY name;
```

期望至少看到：`admins`、`emails`、`email_content_chunks`、`email_codes`、`rules`、`share_links`、`share_link_rules`、`access_logs`。

如果重复执行初始化 SQL，因为 migration 里使用了 `CREATE TABLE IF NOT EXISTS` 和 `CREATE INDEX IF NOT EXISTS`，一般不会破坏已有表；但生产数据仍建议先确认自己连接的是正确的 D1 数据库。

## 7. 创建第一个管理员

1. 打开 Worker 的 `workers.dev` 地址。
2. 访问 `/setup`。
3. 输入第 4 步设置的 `ADMIN_SETUP_TOKEN`。
4. 创建第一个管理员账号。
5. 创建完成后访问 `/admin` 登录。

建议首个管理员创建成功后，回到 **Variables & Secrets** 更换或移除 `ADMIN_SETUP_TOKEN`，避免 setup token 长期可用。

## 8. 配置 Email Routing 到 Worker

1. 进入目标域名的 Cloudflare Dashboard。
2. 打开 **Email Routing** 或 **Compute > Email Service > Email Routing**。
3. 按提示完成域名 Email Routing onboarding，并添加 Cloudflare 要求的 DNS 记录。
4. 进入 **Routing Rules**，点击 **Create address**。
5. 在 **Custom address** 填写要接收验证码邮件的地址前缀。
6. 在 **Action/Destination** 选择路由到 Worker，并选择 `netflix-mail`。
7. 保存后，向该地址发送一封测试邮件。

邮件进入 Worker 后，可以在 `/admin` 看到解析后的邮件；如果规则匹配并创建分享链接，访客链接会展示最近 30 分钟窗口内的匹配邮件。

## 9. 部署后验证清单

按顺序检查：

1. Worker 的 `*.workers.dev` 地址能打开。
2. `/setup` 能打开；缺少 `ADMIN_SETUP_TOKEN` 时会报错，这是正常配置保护。
3. D1 Console 中能查询到核心表。
4. `/setup` 能创建管理员。
5. `/admin` 能登录，登录失败时优先检查 `SESSION_SECRET` 是否已配置。
6. Email Routing 规则目标是 `netflix-mail` Worker，而不是普通转发邮箱。
7. 发送测试邮件后，`emails` 表新增记录，管理员后台能看到邮件。

## 10. 后续更新打包代码

如果以后项目代码更新，维护者重新生成 `dist-gui/index.js` 后，最终部署者按下面步骤更新：

1. 打开 **Workers & Pages > netflix-mail**。
2. 点击 **Edit Code**。
3. 删除旧代码，粘贴新版 `dist-gui/index.js` 的全部内容。
4. 点击 **Deploy**。
5. 如果更新后异常，进入 **Deployments**，回滚到上一个可用版本。

数据库 migration 不一定每次都要重新执行。只有当发布说明明确提到新增 migration 时，才需要在 D1 Console 执行新的 SQL。

## 常见问题

### 只上传 `dist-gui/index.js`，不上传源码可以吗？

可以。`dist-gui/index.js` 已经把本项目 TypeScript 源码和 npm 依赖打包成一个 Worker ES Module。Cloudflare Dashboard 编辑器里粘贴这个单文件即可。

### Dashboard 编辑器支持 npm 依赖吗？

本教程的方案 B 不依赖 Dashboard 安装 npm 包，因为依赖已经被打进 `dist-gui/index.js`。不要把 `src/index.ts` 直接粘贴到 Dashboard，否则会缺少依赖和 TypeScript 编译步骤。

### `/setup` 返回 `ADMIN_SETUP_TOKEN is required before setup.`

说明运行时 Secret 没有配置或没有发布到当前部署版本。到 **Settings > Variables & Secrets** 添加 `ADMIN_SETUP_TOKEN` 后重新发布。

### 登录时报 `SESSION_SECRET is required`

说明缺少 `SESSION_SECRET`。添加 Secret 后重新发布 Worker。

### D1 表不存在或后台报数据库错误

还没有执行 `migrations/0001_initial.sql`。请在 D1 Console 复制执行完整 SQL，再刷新页面。

### 后台仍然报 `env.DB` 相关错误

优先检查 D1 binding 名称是否严格等于 `DB`，并确认保存后已经发布新版本。

### 使用方案 A 时 Worker 构建失败：找不到或绑定不了 D1

确认 `wrangler.jsonc` 里的 `database_id` 已替换为真实 D1 ID，并且 `database_name` 与 Dashboard 中的数据库一致。
