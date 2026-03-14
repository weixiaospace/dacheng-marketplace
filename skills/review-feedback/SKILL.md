---
name: review-feedback
description: Use when working with paragraph-level review system - recording expert feedback, generating AI revisions, applying revisions to content, or managing global requirements.
---

# 审阅与反馈系统

## 适用关键词
"意见"、"修改"、"反馈"、"审阅"、"段落"、"修改稿"

## 系统架构

```
WorkContentSection (contentHtml = 完整 HTML)
  ├── WorkFeedback[] (按 paragraphIndex 关联段落)
  └── WorkRevision[] (按 paragraphIndex 关联段落)
```

### 段落解析规则
- 匹配元素：`<p>`, `<h1>-<h4>`, `<li>`
- `paragraphIndex`：0-based 顺序编号
- `fingerprint`：段落文本前 30 字符

## 数据模型

### WorkFeedback（Parse 类：`work_feedback`）
| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `sectionId` | string | FK → 内容段 objectId |
| `projectId` | string | FK → work_project |
| `module` | string | 模块 key（如 M1, CH1） |
| `paragraphIndex` | number | 段落序号（0-based） |
| `fingerprint` | string | 段落文本前 30 字符 |
| `feedbackText` | string | 意见正文 |
| `source` | string | `'manual'` / `'ai'` / `'ai_request'` |
| `status` | string | `'pending'` / `'accepted'` / `'rejected'` / `'resolved'` / `'ai_revised'` |
| `author` | string | 反馈作者 |

### WorkRevision（Parse 类：`work_revision`）
| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `sectionId` | string | FK → 内容段 objectId |
| `projectId` | string | FK → work_project |
| `module` | string | 模块 key |
| `paragraphIndex` | number | 段落序号 |
| `fingerprint` | string | 段落文本前 30 字符 |
| `originalHtml` | string | 修改前段落 HTML |
| `revisedHtml` | string | 修改后段落 HTML |
| `rationale` | string | 修改理由 |
| `feedbackId` | string | 关联的 feedback objectId |
| `source` | string | `'ai'` / `'manual'` / `'ai_request'` |
| `status` | string | `'pending'` / `'accepted'` / `'rejected'` / `'requested'` / `'cleared'` |
| `rejectReason` | string | 拒绝原因 |
| `author` | string | 修改作者 |

### WorkGlobalRequirement（Parse 类：`work_global_requirement`）
| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `projectId` | string | FK → work_project |
| `typeGroup` | string | `'thesis'` / `'nsf'` |
| `module` | string | `'writing'` / `'outline'` |
| `content` | string | 需求内容 |
| `author` | string | 作者 |
| `status` | string | `'open'` / `'resolved'` |
| `parentId` | string | 父条目 objectId（回复线程） |

## reviewService API

```
// Feedback
getWorkFeedbacks(sectionId) → WorkFeedback[]
saveWorkFeedback(data) → { objectId }
updateWorkFeedback(objectId, data) → void
deleteWorkFeedback(objectId) → void

// Revisions
getWorkRevisions(sectionId) → WorkRevision[]
saveWorkRevision(data) → { objectId }
updateWorkRevision(objectId, data) → void
deleteWorkRevision(objectId) → void

// Global Requirements
getGlobalRequirements(projectId, typeGroup, module) → WorkGlobalRequirement[]
createGlobalRequirement(data) → { objectId }
updateGlobalRequirement(objectId, data) → void
deleteGlobalRequirement(objectId) → void

// Snapshots
getSectionVersions(projectId, typeGroup, contentType) → WorkSnapshot[]
createSectionVersion(data, typeGroup, contentType) → { objectId }
restoreFeedbacksAndRevisions(sectionId, projectId, feedbacksJson, revisionsJson) → void
```

## 场景 1：录入专家意见

```ts
await reviewService.saveWorkFeedback({
  sectionId: section.objectId,
  projectId,
  module: moduleKey,
  paragraphIndex: targetIndex,
  fingerprint: paragraphText.substring(0, 30),
  feedbackText: '建议将研究背景部分增加近三年的文献支撑',
  source: 'manual',
  status: 'pending',
  author: '张老师',
})
```

**Feedback 状态流：** `pending` → `resolved` / `accepted` / `rejected`

## 场景 2：生成 AI 修改稿

```ts
await reviewService.saveWorkRevision({
  sectionId: section.objectId,
  projectId,
  module: moduleKey,
  paragraphIndex: targetIndex,
  originalHtml: originalParagraphHtml,
  revisedHtml: '<p>修改后的段落内容...</p>',
  rationale: '根据张老师意见，补充了 2023-2025 年的三篇核心文献',
  source: 'ai',
  status: 'pending',
  feedbackId: targetFeedback.objectId,
  fingerprint: originalText.substring(0, 30),
  author: 'AI',
})
```

**Revision 状态流：** `pending` → `accepted`（应用到正文） / `rejected`

## 场景 3：应用修改到正文

```ts
const paragraphs = parseContentIntoParagraphs(section.contentHtml)
paragraphs[paragraphIndex].html = revisedHtml

await contentService.save({
  objectId: section.objectId,
  projectId,
  module: moduleKey,
  contentType,
  contentHtml: paragraphs.map(p => p.html).join('\n'),
  version: section.version + 1,
  isLatest: true,
}, typeGroup)

await reviewService.updateWorkRevision(revisionId, { status: 'accepted' })
await reviewService.updateWorkFeedback(feedbackId, { status: 'resolved' })
```

## 场景 4：全局需求

```ts
await reviewService.createGlobalRequirement({
  projectId,
  typeGroup,
  module: 'writing',  // 或 'outline'
  content: '整体需要加强创新点的论述',
  author: authorName,
  status: 'open',
})
```

支持回复（`parentId` 指向父条目）。状态：`open` / `resolved`。

## 内容类型速查

| typeGroup | 结构化 contentType | 写作 contentType | Parse 类 |
|-----------|-------------------|-----------------|---------|
| nsf | `scientific` | `proposal` | `work_nsf_sq` / `work_nsf_proposal` |
| thesis | `outline` | `manuscript` | `work_thesis_outline` / `work_thesis_manuscript` |
