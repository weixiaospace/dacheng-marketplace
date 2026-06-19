---
name: dacheng-profile
description: 当用户提到某人的信息、档案、项目情况时使用。包括：查看某人的档案/项目情况（XX 老师的项目、XX 的进展）、管理个人信息、论文发表、科研基金、专利、著作、合作者、既往项目、核心资产、前期数据、历史申请、档案完整度诊断（完整度、缺什么）、导入简历（CV 提取）、研究方向提炼。只要提到某人名+查看/管理/项目情况，或档案、简历、发表记录等就触发。
---

# 人员档案

主档案 `work_profile` + 9 张附属表（`work_info_*`）。专利、著作是独立表，不是 profile 的嵌入字段。

## 第一步：确定目标人员（profileId）

- 按姓名/用户：先 `parse_query('work_profile', { where: { name: '李明' } })`（或 `{ where: { userId } }`）拿 `objectId`，再 `profile_get(objectId)`
- 已知 profileId：直接 `profile_get(profileId)`
- 列出所有人：`parse_query('work_profile', {})`

## 读写

- **读主档案**：`profile_get(profileId)`
- **读发表记录**：`profile_publication_list(profileId)` → `work_info_publication[]`
- **读其他附属表**：`parse_query(className, { where: { profileId } })`
- **写**：`parse_create / parse_update / parse_remove`（审计自动）。字段不确定时 `parse_schema(className)` 查。

附属表 className：`work_info_publication`(论文发表)、`work_info_grant`(科研基金)、`work_info_patent`(专利)、`work_info_book`(著作)、`work_info_past_project`(既往项目)、`work_info_core_asset`(核心资产)、`work_info_preliminary_data`(前期数据)、`work_info_past_application`(历史申请)、`work_info_collaborator`(合作者)。

## 易错字段

| 错误 | 正确 |
|--|--|
| `profile.patents` | 专利在 `work_info_patent` 表 |
| `grant.fundingAgency` | 字段名是 `funder` |
| `grant.startYear` / `endYear` | 是 `startDate` / `endDate`（完整日期，如 `2022-01-01`） |

## 工作流

### 查看某人档案情况
1. 拿到 profileId（如 `parse_query('work_profile', { where: { name: '李明' } })`）
2. 并行读：`profile_publication_list(profileId)` + 各附属表 `parse_query`
3. 汇总报告

### CV/简历导入
1. 解析 PDF（你的视觉能力）提取结构化数据
2. 确认/创建 profileId
3. 写基本信息：`parse_update('work_profile', profileId, { personalInfo: {...} }, 'CV 导入')`；逐条 `parse_create('work_info_publication', {...})` / `parse_create('work_info_grant', { profileId, title, funder, amount, status, startDate, endDate }, ...)`

### 完整度诊断
按 typeGroup 取数后打分——维度、计算、输出格式见 `references/diagnosis-rubric.md`。

### 研究方向提炼
读论文/基金/既往项目 → 分析 → `parse_update('work_profile', profileId, { researchBackground, techniques }, '提炼方向')`
