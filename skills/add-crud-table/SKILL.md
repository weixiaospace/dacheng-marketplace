---
name: add-crud-table
description: Use when adding a new Parse data table - model definition, service layer, and data operations.
---

# 新增 Parse 数据表

## 步骤

### 1. 定义数据模型

```ts
interface WorkXxx extends ParseObject {
  projectId: string       // FK → work_project（或 profileId → work_profile）
  title: string
  // ...其他字段
}
```

基础字段（ParseObject 自带）：`objectId`, `createdAt`, `updatedAt`

### 2. 创建服务层

```ts
const CLASS_NAME = 'work_xxx'

export const xxxService = {
  async getAll(projectId: string): Promise<WorkXxx[]> {
    return parseClient.query<WorkXxx>(CLASS_NAME, {
      where: { projectId },
      order: '-createdAt',
    })
  },
  async create(data: Partial<WorkXxx>): Promise<{ objectId: string }> {
    return parseClient.create(CLASS_NAME, data as Record<string, unknown>)
  },
  async update(objectId: string, data: Partial<WorkXxx>): Promise<void> {
    return parseClient.update(CLASS_NAME, objectId, data as Record<string, unknown>)
  },
  async remove(objectId: string): Promise<void> {
    return parseClient.remove(CLASS_NAME, objectId)
  },
}
```

### 3. 文档更新

添加表结构定义到数据库 Schema 文档。

## 日志要求

使用新表进行写操作时，必须按 `dacheng:operation-log` 规范记录日志。

## 关键约定

| 约定 | 规则 |
|------|------|
| 表名 | `work_` 前缀 + snake_case（如 `work_project_report`） |
| FK 字段 | 项目数据用 `projectId`，档案数据用 `profileId` |
| 建表 | 无需迁移，Parse 写即建列 |
| 排序 | `order` 字段（手动排序）或 `-createdAt`（时间倒序） |

## parseClient API

```
query<T>(className, { where, order, limit, skip, include }) → T[]
get<T>(className, objectId) → T
create(className, data) → { objectId }
update(className, objectId, data) → void
remove(className, objectId) → void
uploadFile(fileName, fileData) → { url, name }
```

## 现有服务层模式参考

**档案附属表（9 张）** 使用通用工厂模式：
```ts
// 工厂: createWorkInfoService<T>(tableName)
// 实例: workPublicationService, workGrantService, workPatentService,
//       workBookService, workPastProjectService, workCoreAssetService,
//       workPreliminaryDataService, workPastApplicationService, workCollaboratorService
// 统一 API: getAll(profileId), get(objectId), create, update, save(upsert), remove
```

**内容表** 使用路由模式：
```ts
// contentService 根据 typeGroup + contentType 自动路由到正确 Parse 类
// nsf + scientific → work_nsf_sq
// nsf + proposal → work_nsf_proposal
// thesis + outline → work_thesis_outline
// thesis + manuscript → work_thesis_manuscript
```
