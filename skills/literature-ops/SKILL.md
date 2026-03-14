---
name: literature-ops
description: Use when searching, recommending, verifying, or annotating academic literature - AI literature search, recommendation based on existing library, DOI verification, or abstract/keyword extraction.
---

# 文献操作系统

## 适用关键词
"文献"、"检索"、"搜索"、"推荐"、"核验"、"DOI"、"摘要"、"关键词"、"标签"

## 覆盖能力
- **2.1 AI 在线检索**（L2）— 联网搜索学术文献并导入
- **2.2 AI 文献推荐**（L1）— 基于已有文献推荐相关文献
- **2.3 文献信息核验**（L2）— 通过 DOI 比对验证题录信息
- **2.4 文献摘要标注**（L2）— 生成摘要、提取关键词、建议标签

## 数据模型

### WorkLiterature（Parse 类：`work_literature`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `projectId` | string | FK → work_project |
| `libraryId` | string | FK → work_lit_library（文献库） |
| `folderId` | string | FK → work_lit_folder（可选） |
| `title` | string | 中文标题 |
| `enTitle` | string | 英文标题 |
| `authors` | string | 作者列表 |
| `firstAuthor` | string | 第一作者 |
| `journal` | string | 期刊名 |
| `year` | number | 出版年份 |
| `volume` | string | 卷号 |
| `issue` | string | 期号 |
| `pages` | string | 页码 |
| `doi` | string | DOI |
| `impactFactor` | number | 影响因子 |
| `publisher` | string | 出版社 |
| `conferenceName` | string | 会议名称 |
| `university` | string | 授予单位（学位论文） |
| `type` | string | `journal` / `review` / `conference` / `book` / `preprint` / `thesis` / `other` |
| `language` | string | `zh` / `en` |
| `keywords` | string | 关键词 |
| `abstract` | string | 摘要 |
| `tags` | Array | 用户标签 |
| `source` | string | 导入来源（见下方） |
| `verified` | boolean | 是否已核验 |
| `verifyMarks` | Array | 核验标签 |
| `entryStatus` | string | 条目状态 |
| `read` | boolean | 已读 |
| `starred` | boolean | 星标 |
| `priority` | number | 优先级 0-5 |

**source 枚举值：**
| 值 | 含义 |
|----|------|
| `manual` | 手动录入 |
| `import` | 批量导入 |
| `ai_search` | AI 在线检索 |
| `ai_recommend` | AI 智能推荐 |

**verifyMarks 枚举值：**
| 值 | 含义 |
|----|------|
| `v_pass` | 核验通过 |
| `v_incomplete` | 信息不完整 |
| `v_error` | 信息有误 |
| `v_suspected` | 存疑待确认 |
| `v_manual` | 需人工核验 |

**entryStatus 枚举值：**
| 值 | 含义 |
|----|------|
| `verified` | 已核验 |
| `needs_verify` | 待核验 |
| `unverifiable` | 无法核验 |

### WorkLitLibrary（Parse 类：`work_lit_library`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `projectId` | string | FK → work_project |
| `name` | string | 库名称（研究方向名） |
| `order` | number | 排序 |

### WorkLitFolder（Parse 类：`work_lit_folder`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `projectId` | string | FK → work_project |
| `libraryId` | string | FK → work_lit_library |
| `parentId` | string | 父级文件夹 objectId（可选，支持嵌套） |
| `name` | string | 文件夹名称 |
| `order` | number | 排序 |

### WorkLitCitation（Parse 类：`work_lit_citation`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `projectId` | string | FK → work_project |
| `literatureId` | string | FK → work_literature |
| `contentType` | string | `outline` / `manuscript` / `scientific` / `proposal` |
| `order` | number | 引用顺序 |

### WorkLiteratureReport（Parse 类：`work_literature_report`，待实现）

| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `projectId` | string | FK → work_project |
| `literatureId` | string | FK → work_literature（可选） |
| `reportType` | string | 报告类型（`reading_note` / `ai_verify`） |
| `content` | string | 报告内容 |
| `reporter` | string | 报告人 |

## Parse REST API 操作

```
// 查询文献
parseClient.query('work_literature', { where: { projectId }, order: '-year' })

// 按文献库查
parseClient.query('work_literature', { where: { projectId, libraryId } })

// 创建文献
parseClient.create('work_literature', { projectId, libraryId, title, ... })

// 更新文献
parseClient.update('work_literature', objectId, { abstract, keywords, tags })

// 查询文献库
parseClient.query('work_lit_library', { where: { projectId }, order: 'order' })
```

---

## AI 操作场景

### 场景 1：AI 在线检索（2.1，L2 — 需 WebSearch MCP）

```
步骤：
1. 确认目标 projectId 和 libraryId
   → parseClient.query('work_lit_library', { where: { projectId } })
   → 如无合适库，提示操作员选择或创建
2. 使用 WebSearch MCP 联网检索学术文献
   → 关键词、年份范围、数量限制
3. 解析检索结果，提取题录信息
4. 批量写入 work_literature
```

```ts
// 对每篇检索到的文献
await parseClient.create('work_literature', {
  projectId,
  libraryId,           // 必须指定所属文献库
  title: '文献中文标题',
  enTitle: 'English Title',
  authors: '作者1, 作者2, 作者3',
  firstAuthor: '作者1',
  journal: '期刊名',
  year: 2024,
  doi: '10.xxxx/xxxxx',
  type: 'journal',     // journal/review/conference/book/preprint/thesis/other
  language: 'en',
  source: 'ai_search',
  entryStatus: 'needs_verify',  // AI 检索的文献默认待核验
  verified: false,
})
// → 记录操作日志（每条文献一条日志）
```

### 场景 2：AI 文献推荐（2.2，L1）

基于已有文献库分析，推荐相关文献。不需要联网。

```
步骤：
1. 读取项目文献库 → parseClient.query('work_literature', { where: { projectId } })
2. 分析已有文献的主题、关键词、方法论
3. 基于 AI 知识推荐相关文献（可能不在数据库中）
4. 写入推荐结果
```

```ts
await parseClient.create('work_literature', {
  projectId,
  libraryId,
  title: '推荐的文献标题',
  authors: '...',
  doi: '10.xxxx/xxxxx',
  year: 2024,
  type: 'journal',
  source: 'ai_recommend',      // 标记为 AI 推荐
  entryStatus: 'needs_verify',  // 需要核验
  verified: false,
})
// → 记录操作日志
```

### 场景 3：文献信息核验（2.3，L2 — 需联网查 DOI）

```
步骤：
1. 查询待核验文献 → parseClient.query('work_literature', { where: { projectId, entryStatus: 'needs_verify' } })
2. 逐条通过 DOI 联网查询（CrossRef / DOI.org API）
3. 比对题录信息（标题、作者、年份、期刊等）
4. 更新核验结果
```

```ts
// 核验通过
await parseClient.update('work_literature', litId, {
  verified: true,
  verifyMarks: ['v_pass'],
  entryStatus: 'verified',
})

// 信息有误（同时修正）
await parseClient.update('work_literature', litId, {
  verified: true,
  verifyMarks: ['v_error'],
  entryStatus: 'verified',
  // 修正字段
  title: '修正后的标题',
  year: 2024,
})

// 无法核验（无 DOI 或 DOI 无效）
await parseClient.update('work_literature', litId, {
  verifyMarks: ['v_manual'],
  entryStatus: 'unverifiable',
})
// → 记录操作日志
```

### 场景 4：文献摘要标注（2.4，L2 — 可能需读取全文）

```
步骤：
1. 查询目标文献 → parseClient.get('work_literature', litId)
2. 如果已有 abstract，基于摘要分析
3. 如果无摘要，尝试通过 DOI 联网获取
4. 生成中文摘要、提取关键词、建议分类标签
5. 更新文献记录
```

```ts
await parseClient.update('work_literature', litId, {
  abstract: 'AI 生成的中文摘要...',
  keywords: '关键词1, 关键词2, 关键词3',
  tags: ['综述', '实验研究'],  // 建议的分类标签
})
// → 记录操作日志
```

---

## 前置检查

执行文献操作前，务必确认：
1. **projectId** — 操作员指定的目标项目
2. **libraryId** — 文献需要归属到某个文献库（work_lit_library），如无合适库则提示创建
3. **.env** — Parse 连接信息已配置

## 日志要求

所有写操作（create、update、delete）必须按 `dacheng:operation-log` 规范记录日志。
