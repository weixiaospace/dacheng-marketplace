---
name: dacheng-overview
description: 操作 keyan 科研写作工作台（dacheng）web 端数据时的总入口与操作模型。当用户要在该工作台查看/编辑写作内容、文献、人员档案、审阅修改等任何数据任务时，用本技能确立操作方式，再配合 dacheng-writing / dacheng-literature / dacheng-profile / dacheng-review 域技能。覆盖 keyan/工作台/科研项目/申请书/论文/档案/文献/审阅等场景。
---

# dacheng 科研工作台 · 操作总览

你在操作 keyan 科研写作工作台的后端数据（Parse Server，表以 `work_` 前缀）。本技能确立**怎么操作**；具体领域判断见 4 个域技能。

## 操作模型：数据走 MCP 工具，生成靠你自己

- **数据读写一律走 MCP 工具**（`@keyan/web-mcp` 已注册）：
  - 通用：`parse_query / parse_get / parse_create / parse_update / parse_remove / parse_batch`
  - 表结构：`parse_schema(className?)` —— 操作任意表前用它确认字段；**没有静态表文档、不要凭记忆**
  - 域助手：`content_* / literature_* / profile_*`
  - 工具的参数与说明连上 MCP 即可见，**本套件不再编目工具**。
- **AI 生成是你自己的活**：写初稿、润色、假说推导、文献推荐、诊断打分等都由你在对话里完成，产物用写工具落回；不要把生成"委派"给别处。

## 公共铁律

- **审计自动**：所有写工具自动落 `work_ai_log` + 本地日志。**不要手动写日志**。
- **破坏性需 confirm**：`parse_remove` 与含 DELETE 的 `parse_batch` 必须显式传 `confirm: true`。
- **不硬编码项目类型**：写作类型/阶段等从 `work_project_type` 读，别写死。
- **UUID 不截断**：写关联字段（parentId / changeId / commentId 等）用完整 UUID。

## 何时用哪个域技能

| 域技能 | 何时 |
|--|--|
| `dacheng-writing` | 章节/正文/大纲/科学问题/摘要等内容的查看、生成初稿、润色、快照 |
| `dacheng-literature` | 文献检索/导入/核验/分类/项目引用 |
| `dacheng-profile` | 某人的档案/发表/基金/专利/完整度诊断/简历导入 |
| `dacheng-review` | 审阅、录入修改意见、按意见改、批注、track changes、版本快照 |

> 格式排版 / 图表出图 / 数据规划暂无专用技能：用通用 `parse_*` + `parse_schema` 处理。
