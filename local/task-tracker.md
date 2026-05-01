# Netflix Mail UI 重设计任务追踪

## 目标
参考 `UI/` 下的设计图片，将 `/admin`、`/setup`、`/v/:token` 重设计为浅色企业后台风格，同时保持现有 API、路由和关键 DOM hooks 兼容。

## 子任务清单
- [x] 子任务 1：确认当前 UI 文件边界与实现形态
- [x] 子任务 2：重构共享 CSS 设计系统与响应式基础
- [x] 子任务 3：重做管理员登录页与后台页模板
- [x] 子任务 4：重做初始化管理员页面
- [x] 子任务 5：重做访客访问代码页面
- [x] 子任务 6：补充视图结构测试与项目文档
- [x] 子任务 7：运行自动化校验并修复问题
- [x] 子任务 8：完成代码评审记录与交付总结

## 关键决策记录
- 不引入 React/Tailwind/外部 CDN/新依赖，继续使用 Worker 内嵌 HTML/CSS/vanilla JS。
- 仅重构视觉层与模板结构，不改变后端 API、路由和数据格式。
- 保留计划中列出的所有关键 `id` 与前端事件绑定 hook。

## 阻塞项
- 暂无。

## 验证记录
- `yarn run check` 通过：9 个测试文件、22 个测试。

## 完成摘要
- 已完成共享样式、管理员页、初始化页、访客页、视图测试、README 与代码评审记录。

## 追加调整记录
- 已移除登录页初始化管理员入口，仅保留直接登录按钮。
- 已进一步精简登录页介绍内容，减少营销式项目说明。
- 已将后台模块拆分为独立页面：`/admin`、`/admin/rules`、`/admin/share-links`。
- 已将 `UI/` 参考图片目录加入 `.gitignore`，避免设计参考素材误提交。
## 2026-04-30 用户侧邮件显示同步
- [x] 确认后台邮件正文预览与访客接口当前差异
- [x] 同步访客 API 输出正文 HTML/文本与认证状态
- [x] 同步访客页 iframe 正文预览逻辑，不显示高级信息
- [x] 更新测试并运行 yarn run check（10 个测试文件 / 26 个测试通过）
- [x] 自检与交付说明

关键决策：访客页复用后台“可信认证自动加载 https 图片；不可信先拦截外部资源并提示用户确认”的显示策略，但不暴露 Headers/Attachments/HTML 原文等高级信息。

## 2026-05-01 规则过滤器升级

### 子任务清单
- [x] 子任务 1：上下文审查与子线程分析
- [x] 子任务 2：后端 schema、表达式解析与匹配逻辑
- [x] 子任务 3：管理端 UI/API 与分享链接集成
- [x] 子任务 4：测试、文档、代码评审
- [x] 子任务 5：Git 提交准备完成，待执行 git commit

### 关键决策
- 黑名单按分享链接绑定范围生效，不做全局屏蔽。
- 规则展示条件：命中任一白名单规则且未命中任一黑名单规则。
- 保留旧字段与旧 payload 兼容，新增 `action`、`expression_json`、`schema_version`。
- 管理端支持快速多关键词模式，也支持高级表达式 JSON。

### 验证记录
- `yarn test test/rules.test.ts test/views.test.ts` 通过：2 个测试文件 / 13 个测试。
- `yarn run check` 通过：12 个测试文件 / 35 个测试。
- `yarn build:gui` dry-run 完成并刷新 `dist-gui`；wrangler 写用户偏好日志因沙箱 EPERM 报警，但命令退出码为 0 且产物已生成。

### 阻塞项
- UI 子线程复核两次超时，已关闭并由主线程完成静态/自动化验证。

## 2026-05-01 可视化规则条件组编辑器

### 子任务清单
- [x] 子任务 1：UI 设计系统、上下文审查与子线程分析
- [x] 子任务 2：实现可视化条件组编辑器基础交互
- [x] 子任务 3：实现拖拽排序/移动与表达式回填
- [x] 子任务 4：测试、文档、代码评审
- [x] 子任务 5：构建产物并 Git 提交准备完成，待执行 git commit

### 关键设计方向
- 保持项目现有浅色企业后台风格，不引入 React/Tailwind/外部依赖。
- 使用卡片式规则树：组节点负责 AND/OR/NOT，条件节点负责 field/operator/value/caseSensitive。
- 使用原生 HTML5 drag/drop，提供可点击按钮作为拖拽失败时的备用交互。

### 阻塞项
- 暂无。

## 2026-05-01 可视化规则条件组编辑器

### 子任务清单
- [x] 子任务 1：核验当前实现与差距
- [x] 子任务 2：实现可视化嵌套条件组与拖拽交互
- [x] 子任务 3：完善 UI 设计组件与可访问性
- [x] 子任务 4：补充测试、文档、构建产物与代码评审
- [x] 子任务 5：Git 提交准备完成，待执行 git commit

### 关键决策
- 使用原生 HTML/CSS/Vanilla JS，不引入新依赖。
- 保持 `expression` API 不变，UI 只负责生成/编辑同一 JSON 模型。
- JSON 输入保留为高级导入/预览，不作为主要编辑方式。


### 验证记录
- `yarn test test/views.test.ts` 通过：1 个测试文件 / 4 个测试。
- `yarn run check` 通过：12 个测试文件 / 35 个测试。
- `yarn build:gui` dry-run 完成并刷新 `dist-gui`；wrangler 写用户偏好日志因沙箱 EPERM 报警，但命令退出码为 0。

### 设计系统
- 使用 `ui-ux-pro-max` 生成 Data-Dense Dashboard 设计系统。
- 落地重点：清晰层级、表单 label、可见 focus/hover、按钮兜底、移动端无横向滚动、尊重 reduced motion。

### 阻塞项
- 暂无。

## 2026-05-01 规则页 UI 重写与 Pointer Events 拖拽升级

### 子任务清单
- [x] 子任务 1：建立任务追踪、SPEC、TODO、PROGRESS 基线
- [x] 子任务 2：重写规则管理页列表与弹窗结构
- [x] 子任务 3：重写规则构建器样式与截图风格交互
- [x] 子任务 4：升级为 Pointer Events 拖拽（ghost preview + drop zone）
- [x] 子任务 5：更新测试与 README 文档
- [x] 子任务 6：运行自动化验证
- [x] 子任务 7：代码评审完成，待执行 git add/commit

### 关键决策
- 保留现有规则表达式结构、后端 API 与数据库 schema，不改数据层。
- 不引入第三方 DnD 依赖，沿用原生 DOM + Pointer Events。
- 复用 `moveRuleBuilderNode()` 作为节点移动真逻辑，仅替换拖拽输入层。
- 保留复制、上移、下移、删除作为非拖拽与键盘友好兜底。

### 验证记录
- `./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/vitest run` 通过：12 个测试文件 / 35 个测试。
- `yarn check` 因沙箱网络解析 `registry.yarnpkg.com` 失败，已改用本地 `tsc + vitest` 完成等价验证。

### 阻塞项
- 暂无。
