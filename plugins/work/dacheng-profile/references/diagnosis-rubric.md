# 档案完整度诊断维度与输出

诊断是**你的判断**：用 `parse_query` 取数后自行打分，MCP 无 diagnosis 工具。不同 typeGroup 维度不同。

## NSF（12 维）
personalInfo、publications(≥3)、grants(≥1)、patents+books、pastProjects、coreAssets、preliminaryData、collaborators、researchBackground、techniques、labConditions、pastApplications

## 论文（10 维）
personalInfo、publications(≥3)、researchBackground、advisorInfo、grants(≥1)、labConditions、techniques、institutionIntro、thesisRequirements、collaborators

## 计算与写回
读齐所有数据后计算完整度百分比，`parse_update('work_profile', profileId, { profileCompleteness: score })` 写回。

## 输出示例
```
✅ 基本信息：完整
✅ 论文发表：5 条
⚠️ 科研基金：仅 1 条，建议补充
❌ 前期数据：缺失
总体完整度：67%
```
