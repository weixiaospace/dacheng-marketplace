---
name: architecture
description: Use when needing project data architecture overview, dual-workspace mode (nsf/thesis), data tables, data models, or Parse client API reference.
---

# 项目数据架构

## 后端
- Parse Server（BaaS，REST API）
- 连接：`http://parse1.weixiao.space/parse`，App ID：`parseKeyan`

## 双工作台模式

通过 `typeGroup: 'thesis' | 'nsf'` 区分两种业务场景。

| 功能 | NSF（国自然） | Thesis（论文） |
|------|-------------|--------------|
| 结构化 | 科学问题 SQ0/SQH/SQ1-3/SQS | 论文大纲 OL_TITLE/.../OL_REFS |
| 写作 | 申请书 M1-M4 | 论文正文 CH1-CH5/ABSTRACT/... |
| 数据规划 | variables/analysis/viz/pilot | 同左 |
| 格式规范 | — | spec + upload + check |
| 专利/著作 | 有 | — |
| 既往项目 | 有 | — |
| 图表/文献/报告 | 有 | 有 |

## 全部数据表

所有表使用 `work_` 前缀 + snake_case。Parse 无模式（写即建列）。

### 核心表

| Parse 类 | FK | 用途 |
|----------|-----|------|
| `work_profile` | — | 统一用户档案主表 |
| `work_project` | `profileId` | 项目主表 |

### 档案附属表（9 张，FK = `profileId`）

| Parse 类 | 用途 |
|----------|------|
| `work_info_publication` | 论文发表 |
| `work_info_grant` | 科研基金 |
| `work_info_patent` | 专利 |
| `work_info_book` | 著作 |
| `work_info_past_project` | 既往项目 |
| `work_info_core_asset` | 核心资产 |
| `work_info_preliminary_data` | 前期数据 |
| `work_info_past_application` | 历史申请 |
| `work_info_collaborator` | 合作者 |

### 内容表（FK = `projectId`）

| Parse 类 | typeGroup | contentType |
|----------|-----------|-------------|
| `work_nsf_sq` | nsf | scientific |
| `work_nsf_proposal` | nsf | proposal |
| `work_thesis_outline` | thesis | outline |
| `work_thesis_manuscript` | thesis | manuscript |

### 审阅表（FK = `sectionId` / `projectId`）

| Parse 类 | 用途 |
|----------|------|
| `work_feedback` | 段落级反馈意见 |
| `work_revision` | 段落级修改稿 |
| `work_global_requirement` | 全局需求（支持回复线程） |
| `work_snapshot_*` | 版本快照（按 snapshotType 分表） |

### 图表表（FK = `projectId` / `figureId` / `versionId`）

| Parse 类 | 用途 |
|----------|------|
| `work_figure` | 图表主记录 |
| `work_figure_version` | 图表版本 |
| `work_figure_comment` | 版本评论 |
| `work_figure_questionnaire` | 图表问卷（Q1-Q20） |

### 其他表（FK = `projectId`）

| Parse 类 | 用途 |
|----------|------|
| `work_data_plan` | 数据规划 |
| `work_project_report` | 项目报告（MD/HTML） |
| `work_literature` | 文献条目 |
| `work_lit_library` | 文献库 |
| `work_lit_folder` | 文献文件夹 |
| `work_lit_citation` | 文献引用 |
| `work_questionnaire` | 通用问卷 |
| `work_questionnaire_response` | 问卷回答 |

## 核心数据模型

### WorkProfile
```
objectId, name, role, status, userId
personalInfo: { gender, birthDate, education, institution, department, position, researchField, email, phone }
patents: [{ title, type, patentNumber, inventors, year }]
books: [{ title, publisher, year, role, isbn }]
```

### WorkProject
```
objectId, type, typeGroup('thesis'|'nsf'), profileId, title, phase, status
```

### WorkContentSection
```
objectId, projectId, module, contentType, contentHtml, version, isLatest, wordCount
```

### WorkFeedback
```
objectId, sectionId, projectId, module, paragraphIndex, fingerprint
feedbackText, source('manual'|'ai'|'ai_request'), status('pending'|'accepted'|'rejected'|'resolved'|'ai_revised'), author
```

### WorkRevision
```
objectId, sectionId, projectId, module, paragraphIndex, fingerprint
originalHtml, revisedHtml, rationale, feedbackId
source('ai'|'manual'|'ai_request'), status('pending'|'accepted'|'rejected'|'requested'|'cleared'), rejectReason, author
```

### WorkFigure
```
objectId, projectId, name, description, status('drafting'|'iterating'|'confirmed'), currentImageUrl, versionCount
```

### WorkFigureVersion
```
objectId, figureId, version, requirement, prompt, promptEn, imageUrl, status('pending'|'uploaded'|'approved')
```

### WorkPublication (work_info_publication)
```
objectId, profileId, title, authors, journal, year, impactFactor, authorPosition, contribution, isCoreAsset
```

### WorkGrant (work_info_grant)
```
objectId, profileId, title, funder, amount, startDate, endDate, role
```

### WorkGlobalRequirement
```
objectId, projectId, typeGroup, module, content, author, status('open'|'resolved'), parentId(回复线程)
```

## Parse REST API

```
GET    /parse/classes/<className>?where={}&order=&limit=&include=
POST   /parse/classes/<className>          # body: JSON 数据
PUT    /parse/classes/<className>/<id>     # body: 要更新的字段
DELETE /parse/classes/<className>/<id>
POST   /parse/files/<fileName>             # body: 文件内容
```

Headers:
- `X-Parse-Application-Id: parseKeyan`
- `X-Parse-REST-API-Key: <key>`
- `X-Parse-Session-Token: <token>`（认证用户操作）

## 服务层 API

### parseClient
```
query<T>(className, { where, order, limit, skip, include }) → T[]
get<T>(className, objectId) → T
create(className, data) → { objectId }
update(className, objectId, data) → void
remove(className, objectId) → void
uploadFile(fileName, fileData) → { url, name }
login(username, password) → ParseUser
validateSession(token) → ParseUser
```

### contentService
```
getAll(projectId, contentType, typeGroup) → WorkContentSection[]
get(projectId, module, typeGroup) → WorkContentSection | null
save(data, typeGroup) → { objectId }
getHistory(projectId, module, typeGroup) → WorkContentSection[]
```

### reviewService
```
getWorkFeedbacks(sectionId) → WorkFeedback[]
saveWorkFeedback(data) → { objectId }
updateWorkFeedback(objectId, data) → void
deleteWorkFeedback(objectId) → void
getWorkRevisions(sectionId) → WorkRevision[]
saveWorkRevision(data) → { objectId }
updateWorkRevision(objectId, data) → void
deleteWorkRevision(objectId) → void
getGlobalRequirements(projectId, typeGroup, module) → WorkGlobalRequirement[]
createGlobalRequirement(data) → { objectId }
updateGlobalRequirement(objectId, data) → void
deleteGlobalRequirement(objectId) → void
getSectionVersions(projectId, typeGroup, contentType) → WorkSnapshot[]
createSectionVersion(data, typeGroup, contentType) → { objectId }
restoreFeedbacksAndRevisions(sectionId, projectId, feedbacksJson, revisionsJson) → void
```

### figureService
```
getAll(projectId) → WorkFigure[]
create(data) → { objectId }
update(objectId, data) → void
remove(objectId) → void
getVersions(figureId) → WorkFigureVersion[]
createVersion(data) → { objectId }
updateVersion(objectId, data) → void
getComments(versionId) → WorkFigureComment[]
getAllComments(figureId) → WorkFigureComment[]
addComment(data) → { objectId }
deleteComment(objectId) → void
```

### workProfileService
```
getAll() → WorkProfile[]
get(objectId) → WorkProfile
getByUserId(userId) → WorkProfile | null
getByName(name) → WorkProfile | null
create(data) → { objectId }
update(objectId, data) → void
save(objectId, data) → { objectId }   // upsert
remove(objectId) → void
```

### workInfoService（9 张表通用工厂）
```
// 每个实例: workPublicationService, workGrantService, workPatentService,
// workBookService, workPastProjectService, workCoreAssetService,
// workPreliminaryDataService, workPastApplicationService, workCollaboratorService

getAll(profileId) → T[]
get(objectId) → T
create(data) → { objectId }
update(objectId, data) → void
save(objectId, data) → { objectId }   // upsert
remove(objectId) → void
```
