---
name: content-writing
description: Use when reading, editing, or saving content sections (proposal, manuscript, outline), understanding module keys (SQ/OL/M/CH), creating version snapshots, or performing AI writing tasks like draft generation, polishing, hypothesis derivation, or innovation analysis.
---

# 写作内容系统

## 适用关键词
"正文"、"大纲"、"申请书"、"章节"、"模块"、"快照"、"初稿"、"润色"、"假说"、"创新性"

## 覆盖能力
- **4.1 段落级内容生成** — 基于大纲和文献生成段落
- **4.2 全章初稿生成** — 一次性生成完整模块初稿
- **4.3 学术语言润色** — 语言提升、逻辑衔接、术语一致
- **3.2 核心假说推导**（L1）— 基于科学问题推导假说
- **3.1 科学问题生成**（L2）— 综合档案+文献生成科学问题
- **3.3 论文大纲生成**（L2）— 综合选题+文献生成大纲
- **3.4 选题创新性分析**（L2）— 分析选题创新点和研究缺口
- **4.5 引文自动插入**（L2）— 在写作中插入参考文献引用标记

## 四张内容表

| typeGroup | contentType | Parse 类 | 用途 |
|-----------|-------------|---------|------|
| nsf | `scientific` | `work_nsf_sq` | 科学问题（结构化） |
| nsf | `proposal` | `work_nsf_proposal` | 申请书（写作） |
| thesis | `outline` | `work_thesis_outline` | 论文大纲（结构化） |
| thesis | `manuscript` | `work_thesis_manuscript` | 论文正文（写作） |

## 数据模型：WorkContentSection（四张内容表共同字段）

```
objectId, projectId, module, contentHtml, version, workVersion, isLatest, wordCount
createdAt, updatedAt
```

> `contentType` 不是存储字段，而是由 contentService 根据所属 Parse 类隐式确定。

## contentService API

```
getAll(projectId, contentType, typeGroup) → WorkContentSection[]
get(projectId, module, typeGroup) → WorkContentSection | null
save(data, typeGroup) → { objectId }
getHistory(projectId, module, typeGroup) → WorkContentSection[]
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

---

## AI 操作场景

### 场景 1：段落级内容生成（4.1）

```
步骤：
1. 读取目标模块的大纲/上下文 → contentService.get(projectId, outlineModule, typeGroup)
2. 读取文献库 → parseClient.query('work_literature', { where: { projectId } })
3. 生成段落内容
4. 读取当前正文 → contentService.get(projectId, targetModule, typeGroup)
5. 将生成段落插入正文 contentHtml 的指定位置
6. 保存更新版本
```

```ts
const section = await contentService.get(projectId, 'CH1', 'thesis')
await contentService.save({
  objectId: section?.objectId,
  projectId,
  module: 'CH1',
  contentType: 'manuscript',
  contentHtml: updatedHtml,  // 含新生成段落
  version: (section?.version || 0) + 1,
  isLatest: true,
  wordCount: computedWordCount,
}, 'thesis')
// → 记录操作日志
```

### 场景 2：全章初稿生成（4.2）

```
步骤：
1. 读取大纲 → contentService.get(projectId, 'OL_CH1', 'thesis')
2. 读取文献库 → parseClient.query('work_literature', { where: { projectId } })
3. 生成完整初稿（HTML 格式）
4. 将旧版本标记 isLatest=false（如果存在）
5. 创建新版本
```

```ts
// 旧版本标记
const oldSection = await contentService.get(projectId, 'CH1', 'thesis')
if (oldSection) {
  await contentService.save({
    objectId: oldSection.objectId,
    projectId,
    module: 'CH1',
    contentType: 'manuscript',
    isLatest: false,
  }, 'thesis')
}

// 创建新版本
await contentService.save({
  projectId,
  module: 'CH1',
  contentType: 'manuscript',
  contentHtml: generatedHtml,
  version: (oldSection?.version || 0) + 1,
  isLatest: true,
  wordCount: computedWordCount,
}, 'thesis')
// → 记录操作日志
```

### 场景 3：学术语言润色（4.3）

```
步骤：
1. 读取当前内容 → contentService.get(projectId, module, typeGroup)
2. 润色 contentHtml（学术规范、逻辑衔接、术语一致性）
3. 创建新版本（version+1, isLatest=true）
4. 可选：创建快照（createSectionVersion）保留润色前版本
```

### 场景 4：核心假说推导（3.2，L1）

NSF 专属，基于已有科学问题推导假说。

```
步骤：
1. 读取 SQ0 → contentService.get(projectId, 'SQ0', 'nsf')
2. 读取 SQ1-SQ3 → 分别查询
3. 综合分析，推导可验证的核心假说
4. 写入 SQH
```

```ts
const sq0 = await contentService.get(projectId, 'SQ0', 'nsf')
const sq1 = await contentService.get(projectId, 'SQ1', 'nsf')
const sq2 = await contentService.get(projectId, 'SQ2', 'nsf')
const sq3 = await contentService.get(projectId, 'SQ3', 'nsf')

// AI 推导假说
const hypothesisHtml = '基于 SQ0 + SQ1-3 推导的核心假说...'

await contentService.save({
  projectId,
  module: 'SQH',
  contentType: 'scientific',
  contentHtml: hypothesisHtml,
  version: 1,
  isLatest: true,
}, 'nsf')
// → 记录操作日志
```

### 场景 5：科学问题生成（3.1，L2 — 需跨表综合）

```
步骤：
1. 读取档案 → parseClient.get('work_profile', profileId)
2. 读取文献库 → parseClient.query('work_literature', { where: { projectId } })
3. 综合分析，生成 SQ0 / SQ1-3 / SQH / SQS
4. 逐个写入 work_nsf_sq（每个 module 一条记录）
```

### 场景 6：论文大纲生成（3.3，L2 — 需跨表综合）

```
步骤：
1. 读取题目 → contentService.get(projectId, 'OL_TITLE', 'thesis')
2. 读取文献库 → parseClient.query('work_literature', { where: { projectId } })
3. 综合分析，生成 OL_CH1-5 大纲
4. 逐个写入 work_thesis_outline（每个 module 一条记录）
```

### 场景 7：选题创新性分析（3.4，L2 — 需跨表综合）

```
步骤：
1. 读取选题/题目 → contentService.get(projectId, 'OL_TITLE', typeGroup)
2. 读取文献库 → parseClient.query('work_literature', { where: { projectId } })
3. 分析选题创新点 → 对比已有文献评估研究缺口
4. 输出创新性评估报告（不写入 Parse，直接汇报给操作员）
```

### 场景 8：引文自动插入（4.5，L2 — 需文献匹配）

```
步骤：
1. 读取当前内容 → contentService.get(projectId, module, typeGroup)
2. 读取文献库 → parseClient.query('work_literature', { where: { projectId } })
3. 分析内容，在合适位置插入引用标记
4. 更新 contentHtml（含引用标记）
5. 创建 work_lit_citation 引用记录
```

```ts
// 创建引用关联
await parseClient.create('work_lit_citation', {
  projectId,
  literatureId: matchedLit.objectId,
  contentType: 'manuscript',  // 或 proposal / outline / scientific
  order: citationOrder,
})
// → 记录操作日志
```

---

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

## 日志要求

所有写操作（contentService.save、createSectionVersion 等）必须按 `dacheng:operation-log` 规范记录日志。
