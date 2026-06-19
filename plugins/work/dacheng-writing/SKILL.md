---
name: dacheng-writing
description: 当用户提到学术写作内容相关任务时使用。包括：查看/编辑章节内容（立项依据、研究内容、研究基础、科学问题、大纲、正文、摘要、致谢）、生成初稿（写初稿、帮我写）、学术润色（润色、改写、优化表达）、假说推导（假说、创新性分析）、内容快照/历史版本、查看写作进度/字数。只要提到论文章节、申请书模块、大纲、正文或写作任务就触发。
---

# 写作内容

内容存储在 `work_content` 表：一个 `(projectId, writingType)` 唯一一行。

## 第一步：确定上下文

1. **哪个项目** — `parse_query('work_project', { where: { ... } })` 拿到 `projectId` 和 `typeGroup`
2. **哪个写作类型** — 从 `work_project_type` 的 `writingTypes` 确定 `writingType` key（不要硬编码）
3. **读还是写**

## 写作类型速查（从 `work_project_type.writingTypes` 动态获取，当前配置）

NSF / 省级 / 其他（typeGroup = nsf / provincial / other）：
| writingType | 含义 |
|--|--|
| `sq` | 科学问题凝练（SQ0/SQH/SQ1-3/SQS） |
| `proposal` | 申请书正文（M1-M4） |

论文（typeGroup = thesis）：
| writingType | 含义 |
|--|--|
| `outline` | 论文大纲（OL_TITLE/OL_CH1-5 等） |
| `manuscript` | 论文正文（CH1-5/ABSTRACT 等） |

## 读写

- 读：`content_get(projectId, writingType)`
- 存：`content_save(projectId, writingType, contentHtml/contentJson, [objectId], summary)`
- 快照：`content_snapshot_create / content_snapshot_list`（list 参数是 `contentId` = work_content 的 objectId）
- 批注：用通用 `parse_*` 操作 `work_content_comment`，详见 `dacheng-review`

**生成（写初稿/润色/假说推导）是你自己的活**：在对话里产出内容，再用 `content_save` 写回。内容形如 TipTap 文档（`contentHtml` + `contentJson`）。

## 工作流

### 生成初稿
1. `content_get(projectId, 'outline')` 读大纲作上下文
2. 可选 `parse_query('work_literature', { where: { profileId } })` 取文献
3. 生成后 `content_save(projectId, 'manuscript', contentHtml, contentJson, undefined, '生成正文初稿')`

### 润色
1. `content_get(projectId, writingType)` 读当前内容
2. 润色后 `content_save(projectId, writingType, polishedHtml, polishedJson, objectId, '润色')`

### AI 审阅
见 `dacheng-review`：用户批注 → 提交审阅 → AI 回 revisionData → 用户在批注内接受/拒绝。
