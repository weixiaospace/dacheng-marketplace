---
name: literature-ops
description: Use when searching, recommending, verifying, or annotating academic literature - AI literature search, recommendation based on existing library, DOI verification, abstract/keyword extraction, or batch import from RIS/BibTeX/EndNote files.
---

# 文献操作系统

## 适用关键词
"文献"、"检索"、"搜索"、"推荐"、"核验"、"DOI"、"摘要"、"关键词"、"标签"、"导入"、"RIS"、"BibTeX"

## 覆盖能力
- **2.1 AI 在线检索**（L2）— 联网搜索学术文献并导入
- **2.2 AI 文献推荐**（L1）— 基于已有文献推荐相关文献
- **2.3 文献信息核验**（L2）— 通过 DOI 比对验证题录信息
- **2.4 文献摘要标注**（L2）— 生成摘要、提取关键词、建议标签

## 归属关系

文献归属**个人档案**（`profileId`），不依赖项目。项目通过 `work_lit_citation` 引用表关联。

```
work_profile (profileId)
  ├── work_lit_library (研究方向)
  │     └── work_lit_folder (文件夹，可嵌套)
  │           └── work_literature (文献条目)
  └── work_literature (也可不归属文件夹)

work_project (projectId)
  └── work_lit_citation (引用关联 → literatureId)
```

## 数据模型

### WorkLiterature（Parse 类：`work_literature`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `profileId` | string | FK → work_profile（归属个人） |
| `libraryId` | string | FK → work_lit_library |
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
| `publisher` | string | 出版社（著作） |
| `conferenceName` | string | 会议名称 |
| `university` | string | 授予单位（学位论文） |
| `type` | string | 文献类型（见下方） |
| `language` | string | `zh` / `en` |
| `keywords` | string | 关键词 |
| `abstract` | string | 摘要 |
| `tags` | Array | 用户标签（见下方） |
| `source` | string | 导入来源（见下方） |
| `verified` | boolean | 是否已核验 |
| `verifyMarks` | Array | 核验标签 |
| `entryStatus` | string | 条目状态 |
| `read` | boolean | 已读 |
| `starred` | boolean | 星标 |
| `priority` | number | 优先级 0-5 |

**type 枚举（15 种，含 GB 标注）：**

| 值 | 含义 | GB |
|----|------|-----|
| `journal` | 期刊论文 | [J] |
| `review` | 综述 | [J/OL] |
| `magazine` | 报刊 | [N] |
| `book` | 专著 | [M] |
| `book_chapter` | 著作章节 | [M] |
| `edited_book` | 编著 | [M] |
| `translated` | 译著 | [M] |
| `thesis` | 学位论文 | [D] |
| `conference` | 会议论文 | [C] |
| `proceedings` | 论文集 | [G] |
| `newspaper` | 报纸 | [N] |
| `report` | 报告 | [R] |
| `patent` | 专利 | [P] |
| `preprint` | 预印本 | [OL] |
| `other` | 其他 | [Z] |

**source 枚举（14 种，按分组）：**

| 分组 | 值 | 含义 |
|------|-----|------|
| 题录导入 | `ris`, `bib`, `enw`, `nbib` | RIS/BibTeX/EndNote/PubMed 格式 |
| 在线检索 | `cnki`, `wanfang`, `pubmed`, `wos`, `scopus`, `google_scholar` | 数据库来源 |
| AI 辅助 | `ai_search`, `ai_recommend` | AI 检索/推荐 |
| 其他 | `manual`, `other` | 手动/其他 |

**tags 预定义标签（7 个）：**
`核心参考`、`方法学`、`综述背景`、`竞争团队`、`前期基础`、`创新点支撑`、`其他`

**verifyMarks 枚举：**
`v_pass`（通过）、`v_incomplete`（不完整）、`v_error`（有误）、`v_suspected`（存疑）、`v_manual`（需人工）

**entryStatus 枚举：**
`verified`（已核验）、`needs_verify`（待核验）、`unverifiable`（无法核验）

### WorkLitLibrary（Parse 类：`work_lit_library`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `profileId` | string | FK → work_profile |
| `name` | string | 研究方向名 |
| `order` | number | 排序 |

### WorkLitFolder（Parse 类：`work_lit_folder`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `profileId` | string | FK → work_profile |
| `libraryId` | string | FK → work_lit_library |
| `parentId` | string | 父文件夹（支持嵌套） |
| `name` | string | 文件夹名称 |
| `order` | number | 排序 |

### WorkLitCitation（Parse 类：`work_lit_citation`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `literatureId` | string | FK → work_literature |
| `projectId` | string | FK → work_project |
| `contentType` | string | `outline` / `manuscript` / `scientific` / `proposal` |
| `order` | number | 引用顺序 |

### WorkLiteratureReport（Parse 类：`work_literature_report`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `profileId` | string | FK → work_profile |
| `literatureId` | string | FK → work_literature（可选） |
| `reportType` | string | 报告类型 |
| `content` | string | 报告内容 |
| `reporter` | string | 报告人 |

## 服务层 API

### literatureService

```
// 文献 CRUD（profileId 作用域）
getAll(profileId) → WorkLiterature[]           // 上限 500，按 -year 排序
create(data) → { objectId }
update(objectId, data) → void
remove(objectId) → void
batchCreate(items[]) → results[]               // 上限 50 条
batchRemove(objectIds[]) → void                // 上限 50 条
getLiteratureByProject(projectId) → WorkLiterature[]  // 通过引用表关联

// 文献库
getLibraries(profileId) → WorkLitLibrary[]
createLibrary(data) → { objectId }
updateLibrary(objectId, data) → void
removeLibrary(objectId) → void

// 文件夹
getFolders(profileId) → WorkLitFolder[]
createFolder(data) → { objectId }
updateFolder(objectId, data) → void
removeFolder(objectId) → void

// 引用（projectId 作用域）
getCitations(projectId, contentType) → WorkLitCitation[]
createCitation(data) → { objectId }
removeCitation(objectId) → void
removeCitationByLitId(literatureId, projectId) → void
```

---

## AI 操作场景

### 场景 1：AI 在线检索（2.1，L2 — 需 WebSearch MCP）

```
步骤：
1. 确认 profileId 和 libraryId
   → literatureService.getLibraries(profileId)
   → 如无合适库，先创建
2. 使用 WebSearch MCP 联网检索学术文献
3. 解析检索结果，提取题录信息
4. 批量写入 work_literature
```

```ts
await literatureService.batchCreate([
  {
    profileId,
    libraryId,
    title: '文献中文标题',
    enTitle: 'English Title',
    authors: '作者1, 作者2',
    firstAuthor: '作者1',
    journal: '期刊名',
    year: 2024,
    doi: '10.xxxx/xxxxx',
    type: 'journal',
    language: 'en',
    source: 'ai_search',
    entryStatus: 'needs_verify',
    verified: false,
  },
  // ... 更多文献
])
// → 记录操作日志
```

### 场景 2：AI 文献推荐（2.2，L1）

基于已有文献库分析，推荐相关文献。不需要联网。

```
步骤：
1. 读取文献库 → literatureService.getAll(profileId)
2. 分析已有文献的主题、关键词、方法论
3. 基于 AI 知识推荐相关文献
4. 写入推荐结果
```

```ts
await parseClient.create('work_literature', {
  profileId,
  libraryId,
  title: '推荐的文献标题',
  authors: '...',
  doi: '10.xxxx/xxxxx',
  year: 2024,
  type: 'journal',
  source: 'ai_recommend',
  entryStatus: 'needs_verify',
  verified: false,
})
// → 记录操作日志
```

### 场景 3：文献信息核验（2.3，L2 — 需联网查 DOI）

```
步骤：
1. 查询待核验文献 → parseClient.query('work_literature', { where: { profileId, entryStatus: 'needs_verify' } })
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
  title: '修正后的标题',
  year: 2024,
})

// 无法核验
await parseClient.update('work_literature', litId, {
  verifyMarks: ['v_manual'],
  entryStatus: 'unverifiable',
})
// → 记录操作日志
```

### 场景 4：文献摘要标注（2.4，L2）

```
步骤：
1. 查询目标文献 → parseClient.get('work_literature', litId)
2. 如有摘要则基于摘要分析，否则尝试通过 DOI 联网获取
3. 生成中文摘要、提取关键词、建议标签
4. 更新文献记录
```

```ts
await parseClient.update('work_literature', litId, {
  abstract: 'AI 生成的中文摘要...',
  keywords: '关键词1, 关键词2, 关键词3',
  tags: ['核心参考', '方法学'],
})
// → 记录操作日志
```

---

## 前置检查

执行文献操作前，务必确认：
1. **profileId** — 目标人员档案（文献归属个人，不是项目）
2. **libraryId** — 文献需归属某个研究方向库，如无则先创建
3. **projectId** — 仅在操作引用（citation）时需要
4. **.env** — Parse 连接信息已配置

## 日志要求

所有写操作（create、update、delete、batchCreate、batchRemove）必须按 `dacheng:operation-log` 规范记录日志。
