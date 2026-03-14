---
name: profile-ops
description: Use when extracting CV/resume data into profiles, diagnosing profile completeness, or distilling research directions from publications and grants.
---

# 档案操作系统

## 适用关键词
"档案"、"简历"、"CV"、"完整度"、"诊断"、"研究方向"、"提炼"

## 覆盖能力
- **1.1 CV 自动提取**（L2）— 解析 PDF 简历，结构化写入档案
- **1.2 档案完整度诊断**（L1）— 分析缺失维度，输出诊断报告
- **1.3 研究方向提炼**（L1）— 基于论文和项目经历提炼方向

## 数据模型

### WorkProfile（Parse 类：`work_profile`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `name` | string | 人员姓名 |
| `userId` | string | 关联 Parse User |
| `role` | string | `admin` / `member` |
| `status` | string | `active` / `disabled` |
| `personalInfo` | Object | 基本信息（见下方） |
| `techniques` | Array\<String\> | 已掌握技术/方法 |
| `institutionIntro` | string | 单位简介 |
| `researchBackground` | string | 研究背景与方向 |
| `advisorInfo` | string | 导师信息 |
| `thesisRequirements` | string | 学位论文要求 |
| `labConditions` | Object | 实验条件 { platforms[], equipment[] } |
| `disciplineCodes` | Array\<String\> | 学科代码列表 |
| `profileCompleteness` | number | 档案完整度百分比 |
| `notes` | string | 备注 |

**personalInfo 结构：**
```
{
  name, gender, birthDate, institution, department,
  title, phdDate, phdSchool, supervisor,
  email, phone, disciplineCode
}
```

### 档案附属表（9 张，FK = `profileId`）

| Parse 类 | 用途 | 核心字段 |
|----------|------|---------|
| `work_info_publication` | 论文发表 | title, journal, year, authorPosition, impactFactor, isCoreAsset |
| `work_info_grant` | 科研基金 | title, funder, amount, startDate, endDate, status |
| `work_info_patent` | 专利 | title, type, status, patentNumber, inventorRank |
| `work_info_book` | 著作 | title, publisher, year, role |
| `work_info_past_project` | 既往项目 | name, type, status, year, amount, expertOpinions |
| `work_info_core_asset` | 核心资产 | name, type, description |
| `work_info_preliminary_data` | 前期数据 | title, description, figureUrl |
| `work_info_past_application` | 历史申请 | title, type, year, result, reviewComments |
| `work_info_collaborator` | 合作者 | name, title, institution, role, expertise |

## 服务层 API

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
// 实例: workPublicationService, workGrantService, workPatentService,
// workBookService, workPastProjectService, workCoreAssetService,
// workPreliminaryDataService, workPastApplicationService, workCollaboratorService

getAll(profileId) → T[]
get(objectId) → T
create(data) → { objectId }
update(objectId, data) → void
save(objectId, data) → { objectId }   // upsert
remove(objectId) → void
```

---

## AI 操作场景

### 场景 1：CV 自动提取（1.1，L2 — 需 PDF 解析）

```
步骤：
1. 获取 PDF 文件（用户提供路径或 URL）
2. 解析 PDF 内容（Claude 视觉能力 或 PDF 解析 MCP）
3. 提取结构化数据：
   - 基本信息 → personalInfo
   - 论文列表 → work_info_publication
   - 基金项目 → work_info_grant
   - 专利 → work_info_patent
   - 著作 → work_info_book
4. 确认 profileId（操作员指定或创建新 profile）
5. 写入档案数据
```

```ts
// 更新 profile 基本信息
await parseClient.update('work_profile', profileId, {
  personalInfo: {
    name: '张三',
    gender: '男',
    birthDate: '1985-03-15',
    institution: 'XX大学',
    department: '生物学院',
    title: '副教授',
    email: 'zhangsan@xx.edu.cn',
  },
})

// 导入论文记录
await parseClient.create('work_info_publication', {
  profileId,
  title: 'xxx研究',
  journal: 'Nature Communications',
  year: 2023,
  authorPosition: '第一作者',
  impactFactor: 16.6,
  isCoreAsset: true,
})

// 导入基金项目
await parseClient.create('work_info_grant', {
  profileId,
  title: 'xxx机制研究',
  funder: '国家自然科学基金委员会',
  amount: 300000,
  startDate: '2022-01-01',
  endDate: '2024-12-31',
  status: '在研',
})
// → 每条记录操作日志
```

### 场景 2：档案完整度诊断（1.2，L1）

不写入 Parse，直接输出诊断报告给操作员。

```
步骤：
1. 读取 profile → parseClient.get('work_profile', profileId)
2. 读取所有附属表数据 → 9 张表各查询一次
3. 分析各维度完整性
4. 计算完整度 → 更新 profileCompleteness
5. 输出诊断报告
```

```ts
// 读取所有数据
const profile = await parseClient.get('work_profile', profileId)
const publications = await parseClient.query('work_info_publication', { where: { profileId } })
const grants = await parseClient.query('work_info_grant', { where: { profileId } })
const patents = await parseClient.query('work_info_patent', { where: { profileId } })
const books = await parseClient.query('work_info_book', { where: { profileId } })
const pastProjects = await parseClient.query('work_info_past_project', { where: { profileId } })
const coreAssets = await parseClient.query('work_info_core_asset', { where: { profileId } })
const preliminaryData = await parseClient.query('work_info_preliminary_data', { where: { profileId } })
const pastApplications = await parseClient.query('work_info_past_application', { where: { profileId } })
const collaborators = await parseClient.query('work_info_collaborator', { where: { profileId } })
```

**诊断维度（NSF 12 维 / 论文 10 维）：**

| 维度 | NSF | 论文 | 数据来源 |
|------|:---:|:----:|---------|
| 基本信息 | ✓ | ✓ | personalInfo 必填字段 |
| 论文发表 | ✓ | ✓ | work_info_publication（≥3 条） |
| 科研基金 | ✓ | ✓ | work_info_grant（≥1 条） |
| 专利/著作 | ✓ | — | work_info_patent + work_info_book |
| 既往项目 | ✓ | — | work_info_past_project |
| 核心资产 | ✓ | ✓ | work_info_core_asset |
| 前期数据 | ✓ | ✓ | work_info_preliminary_data |
| 合作者 | ✓ | ✓ | work_info_collaborator |
| 研究背景 | ✓ | ✓ | researchBackground 非空 |
| 技术方法 | ✓ | ✓ | techniques 非空 |
| 实验条件 | ✓ | ✓ | labConditions 非空 |
| 历史申请 | ✓ | — | work_info_past_application |

```ts
// 计算完整度并更新
const completeness = calculateCompleteness(dimensions)
await parseClient.update('work_profile', profileId, {
  profileCompleteness: completeness,
})
// → 记录操作日志

// 输出报告格式：
// ✅ 基本信息：完整
// ✅ 论文发表：5 条记录
// ⚠️ 科研基金：仅 1 条，建议补充已结题项目
// ❌ 前期数据：缺失，建议补充预实验/初步结果
// ❌ 研究背景：未填写
// 总体完整度：67%
```

### 场景 3：研究方向提炼（1.3，L1）

```
步骤：
1. 读取论文列表 → parseClient.query('work_info_publication', { where: { profileId } })
2. 读取基金项目 → parseClient.query('work_info_grant', { where: { profileId } })
3. 读取既往项目 → parseClient.query('work_info_past_project', { where: { profileId } })
4. 分析研究主题聚类 → 提炼核心方向和优势领域
5. 写入 profile
```

```ts
// AI 分析后写入
await parseClient.update('work_profile', profileId, {
  researchBackground: '该研究者主要聚焦于...（AI 生成的研究方向描述）',
  techniques: ['16S rRNA 测序', 'CRISPR-Cas9', '代谢组学分析', '多元统计分析'],
})
// → 记录操作日志
```

---

## 前置检查

执行档案操作前，务必确认：
1. **profileId** — 操作员指定的目标人员档案
2. 了解 typeGroup（NSF vs 论文）— 影响诊断维度
3. **.env** — Parse 连接信息已配置

## 日志要求

所有写操作（create、update、delete）必须按 `dacheng:operation-log` 规范记录日志。
