---
description: 任务初始化工作流：把新需求拆解成有序、可执行、可验证的 feature_list.json 队列，作为后续 auto_dev 的输入。
---

# 任务初始化工作流

## 这份文档是做什么的

这份文档说明如何把一段需求说明转成 `feature_list.json` 中的任务队列。

它服务的是“规划代理”而不是“编码代理”。

规划代理负责把需求拆成任务，`auto_dev` 再消费这些任务逐个实现。

## 什么时候使用

在以下情况优先使用任务初始化流：

1. 这是一个全新需求，当前 `feature_list.json` 还没有对应任务。
2. 当前 `feature_list.json` 还是占位内容，不能直接驱动开发。
3. 用户的目标已经变化，现有待办任务和新需求不一致。
4. 需要为下一阶段目标追加一批新任务。

## 规划代理职责

1. 先读取 `AGENTS.md`。
2. 读取用户提供的需求说明。
3. 读取当前 `feature_list.json` 和 `codex-progress.md`。
4. 只按需读取相关的 `project_DS/specification/` 文档。
5. 判断本次是：
   * 新建任务队列，
   * 重写未完成项，
   * 还是在现有队列后追加阶段任务。
6. 先思考这段需求在当前仓库里大概率会如何实现：
   * 用户最终要看到什么结果，
   * 可能会涉及哪些模块、页面、接口或文档，
   * 依赖顺序是什么，
   * 验证路径是什么，
   * 哪些部分可以独立完成。
7. 再把“实现路径”拆成有序的、可执行的任务列表。
8. 写回 `feature_list.json`。

## 输出要求

每个任务都必须满足：

* 有单一明确目标。
* 可以被后续 worker 独立完成。
* 有可观察、可验证的 `steps`。
* 任务边界来自“实现路径切片”，不只是需求表面分句。
* `description` 更偏业务结果，不要只写技术动作。
* 前端或端到端任务要包含浏览器可验证步骤。
* 后端任务要包含 API 请求可验证步骤。
* 涉及写入或结算结果的任务，在需要时要包含数据最终状态验证步骤。
* 所有新生成任务默认 `passes: false`。

推荐格式：

```json
[
  {
    "task_type": "frontend",
    "description": "Show base room information in the room list page.",
    "steps": [
      "Open the room management page.",
      "Check that the list shows room name, status, and owner columns.",
      "Check that the page renders without visible errors."
    ],
    "budget_minutes": 10,
    "passes": false
  }
]
```

## 拆解原则

* 优先按业务流程拆，不要按前端、后端、数据库机械分层。
* 先想清楚“要怎么实现”，再按实现顺序拆任务，不要直接按 PRD 段落机械切块。
* 基础能力排前面，依赖其上的能力排后面。
* 一个任务不要混进多个不相关目标。
* 任务默认最好控制在 10 分钟内；如果预计超过 10 分钟，继续拆。
* 如果一个任务同时包含“调查 + 实现”“实现 + 文档”“happy path + fallback”，优先拆开。
* 如果需求很大，只拆第一阶段高置信度任务，不要为了凑数量制造低质量任务。
* 除非人类明确要求，否则不要覆盖已完成项。

## 中断条件

遇到以下情况不要硬拆，直接中断并请求人工补充：

* 缺少关键前置依赖。
* 需求本身不清楚或互相冲突。
* 队列重写会影响已完成历史，但人类没有明确授权。

## 中断时必须输出

* blocker category
* 当前缺失或冲突的信息
* 为什么这会阻止安全拆解
* 建议补充的最小信息

## 推荐使用方式

1. 用 `$task-init` 生成或更新 `feature_list.json`。
2. 人类快速检查任务顺序和粒度。
3. 用 `$auto_dev 完成 1 个任务` 开始执行。

示例：

```text
$task-init 根据“主播考勤导入和周结算”需求拆成 12 个任务并写入 feature_list.json
```

```text
$task-init 根据最新 PRD 重写 feature_list.json 中未完成项，保留已完成项
```
