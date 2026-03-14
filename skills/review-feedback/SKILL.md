---
name: review-feedback
description: Use when working with paragraph-level review system - recording expert feedback, generating AI revisions, applying revisions to content, managing global requirements, or comparing version snapshots.
---

# 审阅与反馈系统

## 适用关键词
"意见"、"修改"、"反馈"、"审阅"、"段落"、"修改稿"、"版本对比"

## 覆盖能力
- **5.1 AI 自动审阅** — 逐段分析内容，批量生成反馈
- **5.2 AI 自动修订** — 基于反馈生成修改稿
- **5.3 修订请求处理** — 处理用户发起的 AI 修改请求
- **5.4 版本差异总结** — 对比两个快照版本，生成变更摘要

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
| `feedbackHtml` | string | 意见富文本（可选） |
| `source` | string | `'manual'` / `'ai'` |
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
| `authorId` | string | 提交人 userId |
| `status` | string | `'open'` / `'resolved'` |
| `parentId` | string | 父条目 objectId（回复线程） |

### WorkSnapshot（Parse 类：`work_snapshot`）
| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `projectId` | string | FK → work_project |
| `snapshotType` | string | 见下方类型映射 |
| `version` | number | 版本号（递增） |
| `module` | string | 模块 key |
| `contentHtml` | string | 快照 HTML 内容 |
| `feedbacksJson` | string | 序列化的反馈数组 |
| `revisionsJson` | string | 序列化的修改数组 |
| `citationsJson` | string | 序列化的引用列表 |
| `wordCount` | number | 字数 |
| `createdBy` | string | 创建人 |

**snapshotType 映射：**
| typeGroup | contentType | snapshotType |
|-----------|-------------|--------------|
| thesis | outline | `thesis_outline` |
| thesis | manuscript | `thesis_manuscript` |
| nsf | scientific | `nsf_sq` |
| nsf | proposal | `nsf_proposal` |

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

---

## AI 操作场景

### 场景 1：AI 自动审阅（5.1）

操作员指定项目和模块，AI 逐段分析内容并生成反馈。

```
步骤：
1. 查询内容段落 → contentService.get(projectId, module, typeGroup)
2. 解析 contentHtml 为段落数组
3. 逐段分析，生成审阅意见
4. 批量写入 work_feedback：
```

```ts
// 对每个需要反馈的段落
await reviewService.saveWorkFeedback({
  sectionId: section.objectId,   // 内容段落的 objectId
  projectId,
  module: moduleKey,             // 如 'CH1', 'M1'
  paragraphIndex: idx,           // 0-based
  fingerprint: text.substring(0, 30),
  feedbackText: 'AI 分析的具体意见...',
  source: 'ai',
  status: 'pending',
  author: 'AI',
})
// → 记录操作日志（operation-log）
```

### 场景 2：AI 自动修订（5.2）

基于已有的 feedback，AI 生成对应段落的修改稿。

```ts
// 读取待处理的 feedback
const feedbacks = await reviewService.getWorkFeedbacks(sectionId)
const targetFeedback = feedbacks.find(f => f.paragraphIndex === targetIndex)

// 生成修改稿
await reviewService.saveWorkRevision({
  sectionId: section.objectId,
  projectId,
  module: moduleKey,
  paragraphIndex: targetIndex,
  revisedHtml: '<p>修改后的段落内容...</p>',
  rationale: '根据反馈意见，补充了 2023-2025 年的三篇核心文献',
  source: 'ai',
  status: 'pending',
  feedbackId: targetFeedback.objectId,
  fingerprint: originalText.substring(0, 30),
  author: 'AI',
})
// → 记录操作日志
```

### 场景 3：修订请求处理（5.3）

用户在前端点击"请求 AI 修改"，会创建 source='ai_request' 的 revision 记录。AI 需要：

```
步骤：
1. 查询待处理的 AI 请求：
   work_revision WHERE source='ai_request' AND status='requested'
2. 读取关联的 feedback（通过 feedbackId）和原文段落
3. 生成修改建议
4. 创建新的 revision（source='ai', status='pending'）
5. 更新原请求状态为 'cleared'
```

```ts
// 查询待处理请求
const revisions = await reviewService.getWorkRevisions(sectionId)
const requests = revisions.filter(r => r.source === 'ai_request' && r.status === 'requested')

for (const req of requests) {
  // 生成新的修改稿
  await reviewService.saveWorkRevision({
    sectionId: req.sectionId,
    projectId: req.projectId,
    module: req.module,
    paragraphIndex: req.paragraphIndex,
    revisedHtml: 'AI 生成的修改内容...',
    rationale: '基于用户请求生成的修改建议',
    source: 'ai',
    status: 'pending',
    feedbackId: req.feedbackId,
    fingerprint: req.fingerprint,
    author: 'AI',
  })

  // 标记原请求为已处理
  await reviewService.updateWorkRevision(req.objectId, { status: 'cleared' })
}
```

### 场景 4：版本差异总结（5.4）

对比两个快照版本，总结主要变更。

```
步骤：
1. 查询快照列表 → reviewService.getSectionVersions(projectId, typeGroup, contentType)
2. 选择两个版本（如 version 3 和 version 5）
3. 逐模块对比 contentHtml 差异
4. 分析 feedbacksJson / revisionsJson 变化
5. 生成变更摘要报告（不写入 Parse，直接输出给操作员）
```

```ts
const snapshots = await reviewService.getSectionVersions(projectId, typeGroup, contentType)
const snapshotA = snapshots.find(s => s.version === versionA)
const snapshotB = snapshots.find(s => s.version === versionB)

// 对比 contentHtml 差异
// 对比 feedbacksJson / revisionsJson 变化量
// 输出：各模块的变更摘要、新增/删除段落数、字数变化等
```

---

## 手动操作场景

### 场景 5：录入专家意见

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

### 场景 6：应用修改到正文

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

### 场景 7：全局需求

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

---

## 状态流

**Feedback 状态：** `pending` → `resolved` / `accepted` / `rejected` / `ai_revised`

**Revision 状态：** `pending` → `accepted`（应用到正文） / `rejected` / `cleared`（AI 请求已处理）

**Revision source 说明：**
| source | 含义 |
|--------|------|
| `manual` | 人工手动创建的修改 |
| `ai` | AI 自动生成的修改 |
| `ai_request` | 用户请求 AI 修改（status 初始为 `requested`） |

## 内容类型速查

| typeGroup | 结构化 contentType | 写作 contentType | Parse 类 |
|-----------|-------------------|-----------------|---------|
| nsf | `scientific` | `proposal` | `work_nsf_sq` / `work_nsf_proposal` |
| thesis | `outline` | `manuscript` | `work_thesis_outline` / `work_thesis_manuscript` |

## 日志要求

所有写操作（saveWorkFeedback、saveWorkRevision、updateWorkRevision、createGlobalRequirement 等）必须按 `dacheng:operation-log` 规范记录日志。
