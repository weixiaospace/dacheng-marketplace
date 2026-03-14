---
name: data-plan
description: Use when suggesting variable definitions, recommending analysis methods, or proposing visualization plans for research data planning.
---

# 数据规划系统

## 适用关键词
"变量"、"分析方法"、"可视化"、"数据规划"、"统计"、"因变量"、"自变量"

## 覆盖能力
- **6.1 变量定义建议**（L1）— 基于研究问题建议变量定义
- **6.2 分析方法推荐**（L1）— 基于变量类型推荐统计分析方法
- **6.3 可视化方案建议**（L1）— 基于分析结果推荐图表类型

## 数据模型

### WorkDataPlan（Parse 类：`work_data_plan`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `projectId` | string | FK → work_project |
| `module` | string | `variables` / `analysis` / `visualization` / `pilot` |
| `sortOrder` | number | 排序 |

**module = `variables` 时的字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `varType` | string | 变量类型（见下方枚举） |
| `varName` | string | 变量名称 |
| `varSource` | string | 数据来源 |
| `varConstruct` | string | 构建方式 |
| `varRange` | string | 取值范围 |

**varType 枚举值：**
| 值 | 含义 |
|----|------|
| `DV` | 因变量（Dependent Variable） |
| `IV` | 自变量（Independent Variable） |
| `MED` | 中介变量（Mediator） |
| `MOD` | 调节变量（Moderator） |
| `CTRL` | 控制变量（Control Variable） |

**module = `analysis` 时的字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `method` | string | 分析方法名称 |
| `purpose` | string | 分析目的 |
| `chapter` | string | 对应章节 |

**module = `visualization` 时的字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `chartType` | string | 图表类型 |
| `dataSource` | string | 数据来源 |
| `description` | string | 描述 |

**module = `pilot` 时的字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 预实验标题 |
| `result` | string | 预实验结果 |
| `description` | string | 描述 |

**NSF 模式额外字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `content` | Object | JSON 内容（NSF 模式使用自由结构） |

## Parse REST API 操作

```
// 查询某模块的数据规划项
parseClient.query('work_data_plan', {
  where: { projectId, module: 'variables' },
  order: 'sortOrder',
})

// 创建数据规划项
parseClient.create('work_data_plan', { projectId, module, ... })

// 更新
parseClient.update('work_data_plan', objectId, { ... })

// 删除
parseClient.remove('work_data_plan', objectId)
```

---

## AI 操作场景

### 场景 1：变量定义建议（6.1，L1）

```
步骤：
1. 读取研究问题/大纲 → contentService.get(projectId, 'OL_TITLE', typeGroup) 等
2. 读取已有变量定义（如果有）→ parseClient.query('work_data_plan', { where: { projectId, module: 'variables' } })
3. 基于研究问题和方法论，建议变量定义
4. 逐条写入 work_data_plan
```

```ts
// 建议因变量
await parseClient.create('work_data_plan', {
  projectId,
  module: 'variables',
  varType: 'DV',
  varName: '学业成就',
  varSource: '期末考试成绩',
  varConstruct: '标准化测试分数',
  varRange: '0-100',
  sortOrder: 1,
})

// 建议自变量
await parseClient.create('work_data_plan', {
  projectId,
  module: 'variables',
  varType: 'IV',
  varName: '课外辅导时间',
  varSource: '问卷调查',
  varConstruct: '每周辅导小时数',
  varRange: '0-20',
  sortOrder: 2,
})

// 建议中介变量
await parseClient.create('work_data_plan', {
  projectId,
  module: 'variables',
  varType: 'MED',
  varName: '学习动机',
  varSource: '学习动机量表（MSLQ）',
  varConstruct: 'Likert 5 点量表均值',
  varRange: '1-5',
  sortOrder: 3,
})
// → 每条记录操作日志
```

### 场景 2：分析方法推荐（6.2，L1）

```
步骤：
1. 读取已有变量定义 → parseClient.query('work_data_plan', { where: { projectId, module: 'variables' } })
2. 分析变量类型、关系、研究设计
3. 推荐适合的统计分析方法
4. 逐条写入 work_data_plan（module='analysis'）
```

```ts
await parseClient.create('work_data_plan', {
  projectId,
  module: 'analysis',
  method: '多元线性回归分析',
  purpose: '检验自变量对因变量的预测效果',
  chapter: 'CH3',
  sortOrder: 1,
})

await parseClient.create('work_data_plan', {
  projectId,
  module: 'analysis',
  method: 'Bootstrap 中介效应检验',
  purpose: '检验学习动机在课外辅导与学业成就之间的中介作用',
  chapter: 'CH4',
  sortOrder: 2,
})
// → 记录操作日志
```

### 场景 3：可视化方案建议（6.3，L1）

```
步骤：
1. 读取分析方法 → parseClient.query('work_data_plan', { where: { projectId, module: 'analysis' } })
2. 读取变量定义 → parseClient.query('work_data_plan', { where: { projectId, module: 'variables' } })
3. 推荐图表类型和呈现方式
4. 逐条写入 work_data_plan（module='visualization'）
```

```ts
await parseClient.create('work_data_plan', {
  projectId,
  module: 'visualization',
  chartType: '路径分析图',
  dataSource: '多元回归 + 中介效应结果',
  description: '展示变量间因果路径，标注标准化系数和显著性水平',
  sortOrder: 1,
})

await parseClient.create('work_data_plan', {
  projectId,
  module: 'visualization',
  chartType: '描述性统计表',
  dataSource: '所有变量的均值、标准差、相关系数',
  description: '呈现变量基本统计特征和相关矩阵',
  sortOrder: 2,
})
// → 记录操作日志
```

---

## 前置检查

执行数据规划操作前，务必确认：
1. **projectId** — 操作员指定的目标项目
2. 了解研究问题 — 可通过 contentService 读取大纲/题目获取上下文
3. **.env** — Parse 连接信息已配置

## 日志要求

所有写操作（create、update、delete）必须按 `dacheng:operation-log` 规范记录日志。
