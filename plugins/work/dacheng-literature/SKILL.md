---
name: dacheng-literature
description: 当用户提到文献相关任务时使用。包括：检索文献（搜几篇、找相关论文）、推荐文献、核验文献信息（DOI 核验）、提取摘要/关键词、导入文献（RIS/BibTeX/EndNote）、管理文件夹分类、管理项目引用（参考文献关联）。只要提到文献、论文检索、参考文献、引用、DOI 或文献导入就触发。
---

# 文献管理

文献归属个人（`profileId`），项目通过 `work_lit_citation` 引用，不复制文献行。

## 第一步：确定上下文

1. **profileId** — 文献操作首要标识。从项目反查：`parse_get('work_project', projectId)` → `project.profileId`
2. **folderId** — 分类用文件夹；查该人的：`parse_query('work_lit_folder', { where: { profileId } })`，没有则先建
3. **projectId** — 仅操作引用（citation）时需要

## 融合模型约束（必须遵守）

- 文献必须带 `profileId`；**不写 `libraryId`**（已退场）
- 文件夹（`work_lit_folder`）**不带 `projectId`**，属于个人不属于项目；用 `folderId` 分类、跨项目共享
- 项目关联文献走 `work_lit_citation`（`literatureId + projectId`），**不复制文献行**

## 读写

- **检索**：`literature_search(query, retmax?)` —— **仅查 PubMed**，返回 `[{ pmid, title, journal, pubdate }]`，`retmax ≤ 50`。**不写库**。
- **入库**：`literature_import({ profileId, title, type?, projectId?, folderId?, pmid?, doi?, journal?, year?, summary })` —— **单条、无批量、无自动去重**。多条逐条调；去重先 `parse_query('work_literature', { where: { profileId, doi } })`（或按 pmid/title）。
- **归类**：`literature_classify(objectId, folderId, summary)` —— **单条**，归入已有文件夹。
- **普通读写**：`parse_query/create/update/remove`（`work_literature` / `work_lit_folder` / `work_lit_citation`）。字段不确定时 `parse_schema('work_literature')` 查。

## 枚举语义

- **type（15）**：journal 期刊、review 综述、magazine 报刊、book 专著、book_chapter 章节、edited_book 编著、translated 译著、thesis 学位论文、conference 会议、proceedings 论文集、newspaper 报纸、report 报告、patent 专利、preprint 预印本、other
- **source**：题录(ris/bib/enw/nbib/csv)、检索(cnki/wanfang/cqvip/pubmed/wos/scopus/google_scholar/crossref)、AI(ai_search/ai_recommend)、manual/other
- **tags（7）**：核心参考、方法学、综述背景、竞争团队、前期基础、创新点支撑、其他
- **verifyMarks**：v_pass / v_incomplete / v_error / v_suspected / v_manual
- **entryStatus**：verified / needs_verify / unverifiable

## 工作流

### 检索入库
1. 定 profileId；`parse_query('work_lit_folder', { where: { profileId } })` 找或建文件夹
2. `literature_search('CRISPR gene editing', 20)` 取题录
3. **逐条** `literature_import({ profileId, folderId, title, pmid, journal, year, type: 'journal', summary })`（入库前可按 pmid 查重）

### 文献推荐（不联网）
1. `parse_query('work_literature', { where: { profileId }, limit: 100 })` 读已有
2. 分析主题/方法 → 基于知识推荐
3. 逐条 `literature_import(...)` 写入

### DOI 核验
1. `parse_query('work_literature', { where: { profileId, entryStatus: 'needs_verify' } })`
2. 逐条 CrossRef 联网核验
3. `parse_update('work_literature', litId, {...})`：通过 `{ verified:true, verifyMarks:['v_pass'], entryStatus:'verified' }`；有误修正同时改字段并 `verifyMarks:['v_error']`；无法核验 `{ verifyMarks:['v_manual'], entryStatus:'unverifiable' }`

### 摘要/关键词
`parse_get` 读 → 分析 → `parse_update('work_literature', litId, { abstract, keywords, tags })`

### 引用关联
`parse_create('work_lit_citation', { literatureId, projectId, contentType: 'manuscript', order: 1 })`；查：`parse_query('work_lit_citation', { where: { projectId }, include: 'literatureId' })`
