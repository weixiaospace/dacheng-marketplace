---
name: figure-workflow
description: Use when working with the figure management system - creating figures, iterating versions, uploading images, adding comments, generating AI figure descriptions, or optimizing figures based on review feedback.
---

# 图表管理系统

## 适用关键词
"图表"、"绘图"、"图形"、"版本"、"出图"、"流程图"、"图表说明"、"图表描述"

## 覆盖能力
- **7.2 图表描述生成**（L1）— 基于图片生成学术规范的图表说明文字

## 生命周期

```
Figure (drafting)
  → Version 1 (pending → uploaded → approved)
  → Version 2 (pending → uploaded → approved)  ← 根据评论迭代
  → Figure (confirmed)
```

## 数据模型

### WorkFigure（Parse 类：`work_figure`）
| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `projectId` | string | FK → work_project |
| `name` | string | 图表名称 |
| `description` | string | 图表描述 |
| `status` | string | `'drafting'` / `'iterating'` / `'confirmed'` |
| `currentImageUrl` | string | 最新版本图片 URL |
| `versionCount` | number | 版本数量 |

### WorkFigureVersion（Parse 类：`work_figure_version`）
| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `figureId` | string | FK → work_figure |
| `version` | number | 版本号 |
| `requirement` | string | 出图需求描述 |
| `prompt` | string | AI 绘图提示词（中文） |
| `promptEn` | string | AI 绘图提示词（英文） |
| `imageUrl` | string | 图片 URL |
| `status` | string | `'pending'` / `'uploaded'` / `'approved'` |

### WorkFigureComment（Parse 类：`work_figure_comment`）
| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `figureId` | string | FK → work_figure |
| `versionId` | string | FK → work_figure_version |
| `content` | string | 评论内容 |
| `author` | string | 评论作者 |

### WorkFigureQuestionnaire（Parse 类：`work_figure_questionnaire`）
20 个问题字段（Q1-Q20），覆盖目的、类型、风格、参考文献等。

## figureService API

```
// 图表
getAll(projectId) → WorkFigure[]
create(data) → { objectId }
update(objectId, data) → void
remove(objectId) → void

// 版本
getVersions(figureId) → WorkFigureVersion[]
createVersion(data) → { objectId }
updateVersion(objectId, data) → void

// 评论
getComments(versionId) → WorkFigureComment[]
getAllComments(figureId) → WorkFigureComment[]
addComment(data) → { objectId }
deleteComment(objectId) → void
```

---

## AI 操作场景

### 场景 1：AI 图表描述生成（7.2）

读取图表最新版本的图片，生成学术规范的图表说明文字。

```
步骤：
1. 查询图表 → figureService.getAll(projectId) 或指定 figureId
2. 获取最新版本 → figureService.getVersions(figureId)
3. 读取版本图片（imageUrl）— Claude 可直接视觉分析
4. 结合图表名称、需求描述、评论反馈，生成学术规范的图表说明
5. 更新 work_figure.description
```

```ts
// 获取图表及最新版本
const figure = await parseClient.get('work_figure', figureId)
const versions = await figureService.getVersions(figureId)
const latestVersion = versions.sort((a, b) => b.version - a.version)[0]

// AI 分析图片（通过 imageUrl）→ 生成描述
const description = 'AI 生成的学术规范图表说明...'

// 更新图表描述
await figureService.update(figureId, { description })
// → 记录操作日志
```

**生成描述的要素：**
- 图表类型和结构（流程图 / 机制图 / 数据图等）
- 主要内容和信息传达
- 关键标注和图例说明
- 学术规范的语言表述
- 结合 requirement 和 comments 中的上下文

---

## 手动操作场景

### 场景 2：创建图表

```ts
const { objectId } = await figureService.create({
  projectId: currentProject.objectId,
  name: '实验流程图',
  description: '展示数据采集到分析的完整流程',
  status: 'drafting',
})
```

### 场景 3：新增版本（迭代）

```ts
const versions = await figureService.getVersions(figureId)
const nextVersion = versions.length + 1

await figureService.createVersion({
  figureId,
  version: nextVersion,
  requirement: '根据评审意见：箭头改为双向，增加反馈循环标注',
  status: 'pending',
})

await figureService.update(figureId, { status: 'iterating', versionCount: nextVersion })
```

### 场景 4：上传图片

```ts
const { url } = await parseClient.uploadFile(safeFileName, fileBlob)

await figureService.updateVersion(versionId, { imageUrl: url, status: 'uploaded' })
await figureService.update(figureId, { currentImageUrl: url })
```

### 场景 5：添加评论

```ts
await figureService.addComment({
  figureId, versionId,
  content: '颜色方案建议改为蓝绿色系',
  author: authorName,
})
```

### 场景 6：根据意见完整迭代

```ts
const comments = await figureService.getComments(latestVersionId)
const synthesized = comments.map(c => `- ${c.author}：${c.content}`).join('\n')

await figureService.createVersion({
  figureId,
  version: currentVersionCount + 1,
  requirement: `根据以下评审意见优化：\n${synthesized}`,
  status: 'pending',
})

await figureService.update(figureId, { status: 'iterating', versionCount: nextVersion })
// 上传后：
await figureService.updateVersion(versionId, { status: 'approved' })
await figureService.update(figureId, { status: 'confirmed' })
```

---

## 状态参考

**Figure 状态：**
| 值 | 含义 |
|----|------|
| `drafting` | 初始，尚无版本 |
| `iterating` | 有版本，持续优化 |
| `confirmed` | 最终版本通过 |

**Version 状态：**
| 值 | 含义 |
|----|------|
| `pending` | 等待图片上传 |
| `uploaded` | 图片已就绪，待审阅 |
| `approved` | 该版本定稿 |

## 日志要求

所有写操作（create、update、createVersion、updateVersion、addComment 等）必须按 `dacheng:operation-log` 规范记录日志。
