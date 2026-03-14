---
name: content-writing
description: Use when reading, editing, or saving content sections (proposal, manuscript, outline), understanding module keys (SQ/OL/M/CH), or creating version snapshots.
---

# 写作内容系统

## 适用关键词
"正文"、"大纲"、"申请书"、"章节"、"模块"、"快照"

## 四张内容表

| typeGroup | contentType | Parse 类 | 用途 |
|-----------|-------------|---------|------|
| nsf | `scientific` | `work_nsf_sq` | 科学问题（结构化） |
| nsf | `proposal` | `work_nsf_proposal` | 申请书（写作） |
| thesis | `outline` | `work_thesis_outline` | 论文大纲（结构化） |
| thesis | `manuscript` | `work_thesis_manuscript` | 论文正文（写作） |

## 数据模型：WorkContentSection

```
objectId, projectId, module, contentType, contentHtml, version, isLatest, wordCount
createdAt, updatedAt
```

## contentService API

```
getAll(projectId, contentType, typeGroup) → WorkContentSection[]
get(projectId, module, typeGroup) → WorkContentSection | null
save(data, typeGroup) → { objectId }
getHistory(projectId, module, typeGroup) → WorkContentSection[]
```

## 读写操作示例

```ts
// 查询
const sections = await contentService.getAll(projectId, contentType, typeGroup)
const section = await contentService.get(projectId, 'M1', 'nsf')
const history = await contentService.getHistory(projectId, 'M1', 'nsf')

// 保存
await contentService.save({
  objectId: existingSection?.objectId,   // 有则更新，无则创建
  projectId,
  module: 'M1',
  contentType: 'proposal',
  contentHtml: '<h2>立项依据</h2><p>内容...</p>',
  version: (existingSection?.version || 0) + 1,
  isLatest: true,
  wordCount: computedWordCount,
}, 'nsf')
```

## 全部模块 Key

### NSF 科学问题（结构化，contentType = `scientific`）
| Key | 名称 |
|-----|------|
| `SQ0` | 拟解决的关键科学问题 |
| `SQH` | 核心假说 |
| `SQ1`~`SQ3` | 科学问题 1~3 |
| `SQS` | 科学意义 |

### NSF 申请书（写作，contentType = `proposal`）
| Key | 名称 |
|-----|------|
| `M1` | (一) 立项依据 |
| `M2` | (二) 研究内容 |
| `M3` | (三) 研究基础 |
| `M4` | (四) 其他说明 |

M2 支持三种框架：Free（自由）、FrameA（精简版）、FrameB（完整版推荐）

### 论文大纲（结构化，contentType = `outline`）
| Key | 名称 |
|-----|------|
| `OL_TITLE` | 题目 |
| `OL_ABSTRACT` | 框架 |
| `OL_CH1`~`OL_CH5` | 第一章~第五章大纲 |
| `OL_CONCLUSION` | 结论框架 |
| `OL_REFS` | 参考文献规划 |

### 论文正文（写作，contentType = `manuscript`）
| Key | 名称 |
|-----|------|
| `ABSTRACT_CN` | 中文摘要 |
| `ABSTRACT_EN` | 英文摘要 |
| `CH1`~`CH5` | 第一章~第五章 |
| `CONCLUSION` | 结论与展望 |
| `REFS` | 参考文献 |
| `ACKNOWLEDGEMENT` | 致谢 |

## 日志要求

所有写操作（contentService.save、createSectionVersion 等）必须按 `dacheng:operation-log` 规范记录日志。

## 段落解析

内容 HTML 被解析为段落数组用于审阅：
```
匹配元素: <p>, <h1>-<h4>, <li>
每个段落: { index, html, text, tag, fingerprint }
fingerprint = text.substring(0, 30)
paragraphIndex: 0-based 顺序编号
```

详见 `dacheng:review-feedback`。

## 版本快照

```ts
await reviewService.createSectionVersion({
  projectId,
  module: moduleKey,
  version: snapshotVersion,
  contentHtml: section.contentHtml,
  feedbacksJson: JSON.stringify(feedbacks),
  revisionsJson: JSON.stringify(revisions),
  wordCount: section.wordCount,
  createdBy: authorName,
}, typeGroup, contentType)
```

**快照类型映射（snapshotType → Parse 类）：**
| typeGroup | contentType | snapshotType |
|-----------|-------------|--------------|
| thesis | outline | `thesis_outline` |
| thesis | manuscript | `thesis_manuscript` |
| nsf | scientific | `nsf_sq` |
| nsf | proposal | `nsf_proposal` |

### 快照相关 API

```
getSectionVersions(projectId, typeGroup, contentType) → WorkSnapshot[]
createSectionVersion(data, typeGroup, contentType) → { objectId }
restoreFeedbacksAndRevisions(sectionId, projectId, feedbacksJson, revisionsJson) → void
```
