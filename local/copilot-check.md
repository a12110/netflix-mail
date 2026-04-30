# Copilot Check：可视化规则条件组编辑器

## 评审结论
通过。规则管理已从高级 JSON 输入升级为可视化条件组编辑器，支持条件/分组/NOT、拖拽移动、按钮兜底、JSON 预览导入，并保持后端表达式协议不变。

## 检查项
- UI/UX：采用卡片式规则树，组节点与条件节点视觉层级清晰；所有点击控件均为原生 button/select/input，保留可见 focus 样式。
- 拖拽交互：使用原生 HTML5 drag/drop，拖动 handle 独立于输入控件；drop zone 明确表示插入位置。
- 无障碍兜底：除拖拽外提供上移/下移、添加条件、添加分组、删除、NOT 切换按钮，避免仅依赖鼠标拖拽。
- 数据正确性：builder 内部 UI-only id 在保存前通过 `stripRuleBuilderMetadata()` 剥离；保存仍使用既有 RuleExpression JSON。
- 兼容性：批量生成条件与 JSON 导入保留；编辑旧规则时会 hydrate 到可视化树并同步 JSON 预览。
- 脚本风险：已用 `node --check` 抽取并检查内嵌 `ADMIN_SCRIPT` 语法。

## 验证
- `yarn test test/views.test.ts`：通过。
- `yarn run check`：通过，12 个测试文件 / 35 个测试。
- `yarn build:gui`：退出码 0，已刷新 `dist-gui`；wrangler 在沙箱内写用户偏好日志触发 EPERM 警告，不影响 dry-run 产物。

## 已知风险
- 子线程 UI 复核两次超时无可验证输出，主线程已按失效机制关闭并继续本地静态/自动化验证。
- 目前拖拽为 HTML5 drag/drop，移动端浏览器支持有限；已提供按钮兜底，后续如需移动端强拖拽可再做 pointer events 版本。
