---
name: architecture
description: Use when needing project data architecture overview, dual-workspace mode (nsf/thesis), data tables, data models, or Parse client API reference.
---

# 项目数据架构

## 后端
- Parse Server（BaaS，REST API）
- 连接信息从项目 `.env` 文件读取（`PARSE_SERVER_URL`、`PARSE_APP_ID`、`PARSE_MASTER_KEY`）
- 如果 `.env` 不存在或缺少以上变量，请提示用户创建并填写

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
| `work_snapshot` | 版本快照（单表，按 snapshotType 区分） |

### 图表表（FK = `projectId` / `figureId` / `versionId`）

| Parse 类 | 用途 |
|----------|------|
| `work_figure` | 图表主记录 |
| `work_figure_version` | 图表版本 |
| `work_figure_comment` | 版本评论 |
| `work_figure_questionnaire` | 图表问卷（Q1-Q20） |

### 格式规范表（论文专属，v2 模板体系）

| Parse 类 | FK | 用途 |
|----------|-----|------|
| `work_format_template` | — | 格式模板（rules JSON ~160参数） |
| `work_format_binding` | `projectId` + `templateId` | 项目↔模板绑定（含 overrides） |
| `work_format_category` | `parentId` | 模板分类树 |
| `work_format_upload` | `projectId` | 格式参考文件 |

### 文献表（FK = `profileId`，归属个人）

| Parse 类 | 用途 |
|----------|------|
| `work_literature` | 文献条目（归属 profileId） |
| `work_lit_library` | 研究方向库（归属 profileId） |
| `work_lit_folder` | 文献文件夹（归属 profileId，支持嵌套） |
| `work_lit_citation` | 文献↔项目引用关联（FK = `projectId` + `literatureId`） |
| `work_literature_report` | 文献报告（归属 profileId） |

### 其他表（FK = `projectId`）

| Parse 类 | 用途 |
|----------|------|
| `work_data_plan` | 数据规划 |
| `work_project_report` | 项目报告（MD/HTML） |
| `work_questionnaire` | 通用问卷 |
| `work_questionnaire_response` | 问卷回答 |

## 核心数据模型

### WorkProfile
```
objectId, name, role, status, userId, accessibleProjects
personalInfo: { name, gender, birthDate, institution, department, title, phdDate, phdSchool, supervisor, email, phone, disciplineCode }
techniques: [String], institutionIntro, researchBackground, advisorInfo, thesisRequirements
labConditions: { platforms[], equipment[] }, disciplineCodes: [String]
profileCompleteness: Number, notes
```
> 专利和著作是独立表（`work_info_patent`、`work_info_book`），不是 profile 的嵌入字段。

### WorkProject
```
objectId, type, typeGroup('thesis'|'nsf'), profileId, title, phase, status
year, displayName, shortName, directionCode
completionRates: Object, nextAction, dashboardHtmls: Object, innovationPoints: [String]
```

### WorkContentSection（四张内容表共同字段）
```
objectId, projectId, module, contentHtml, version, workVersion, isLatest, wordCount
```

### WorkFeedback
```
objectId, sectionId, projectId, module, paragraphIndex, fingerprint
feedbackText, feedbackHtml, source('manual'|'ai'), status('pending'|'accepted'|'rejected'|'resolved'|'ai_revised'), author
```

### WorkRevision
```
objectId, sectionId, projectId, module, paragraphIndex, fingerprint
revisedHtml, rationale, feedbackId
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
objectId, profileId, title, journal, year, authorPosition, impactFactor, isCoreAsset
```

### WorkGrant (work_info_grant)
```
objectId, profileId, title, funder, amount, startDate, endDate, status
```

### WorkGlobalRequirement
```
objectId, projectId, typeGroup, module, content, author, authorId, status('open'|'resolved'), parentId(回复线程)
```

## Parse REST API

```
GET    /parse/classes/<className>?where={}&order=&limit=&include=
POST   /parse/classes/<className>          # body: JSON 数据
PUT    /parse/classes/<className>/<id>     # body: 要更新的字段
DELETE /parse/classes/<className>/<id>
POST   /parse/files/<fileName>             # body: 文件内容
```

Headers（值从 `.env` 读取）:
- `X-Parse-Application-Id: $PARSE_APP_ID`
- `X-Parse-Master-Key: $PARSE_MASTER_KEY`

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

### formatTemplateService / formatBindingService
```
// 模板
getById(objectId) → WorkFormatTemplate
getPublished() → WorkFormatTemplate[]
create(data) → { objectId }
update(objectId, data) → void
remove(objectId) → void

// 绑定
getBinding(projectId) → WorkFormatBinding | null
bind(projectId, templateId, overrides?) → { objectId }
getResolvedRules(projectId) → object    // deepMerge(template.rules, binding.overrides)
createCustom(projectId, name) → { templateId, bindingId }
unbind(objectId) → void
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
