# Copilot Check：可视化规则条件组编辑器

## 评审结论
通过。规则管理已升级为更完整的可视化条件组编辑器，支持条件/分组/NOT、拖拽移动、复制节点、重置、按钮兜底、JSON 预览导入，并保持后端 RuleExpression 协议不变。

## 检查项
- UI/UX：采用 data-dense dashboard 规则树，新增表达式摘要条，组节点与条件节点层级清晰；无 emoji 图标，使用文本按钮和原生控件。
- 拖拽交互：使用原生 HTML5 drag/drop，拖动 handle 独立于输入控件；drop zone 具有 hover/active 反馈，拖拽中会高亮可放置区域并提示状态。
- 无障碍兜底：除拖拽外提供复制、上移/下移、添加条件、添加分组、删除、NOT 切换、重置按钮，避免仅依赖鼠标拖拽。
- 数据正确性：新增/编辑规则都会将当前表达式 hydrate 到可视化树；builder 内部 UI-only id 在保存前通过 `stripRuleBuilderMetadata()` 剥离；手动修改 JSON 后保存会自动导入并校验。
- 稳定性：拖拽移动先验证目标父节点再 detach，避免异常 drop 导致节点丢失；同组拖到末尾会按原始 index 修正。
- 响应式与可访问性：移动端将条件网格与按钮区降为单列，避免横向滚动；复杂规则弹窗加宽并使用内部滚动；补充 `role=group`、`role=status`、summary focus-visible，保留 `prefers-reduced-motion` 规则。

## 验证
- `yarn test test/views.test.ts`：通过。
- `yarn run check`：通过，12 个测试文件 / 35 个测试。
- `yarn build:gui`：退出码 0，已刷新 `dist-gui`；wrangler 在沙箱内写用户偏好日志触发 EPERM 警告，不影响 dry-run 产物。

## 已知风险
- HTML5 drag/drop 在移动端浏览器支持有限；当前已提供复制、上移/下移等按钮兜底。如未来要求移动端原生拖拽手感，可再升级为 pointer events 拖拽。
