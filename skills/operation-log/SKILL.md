---
name: operation-log
description: Use when performing any Parse write operation (create, update, delete) via skills - requires logging to both local file and Parse table for audit trail and rollback support.
---

# AI 操作日志规范

## 何时记录

对 Parse 执行**写操作**（create / update / delete）时必须记录日志。纯读操作（query / get）不记录。

## 双写机制

每次写操作同时写入两处：

### 1. 本地文件日志

追加到项目根目录 `logs/ai-operations.log`（不存在则创建目录和文件）。

格式（每条一行 JSON）：
```jsonl
{"ts":"2026-03-14T10:23:45Z","op":"create","class":"work_feedback","id":"abc123","summary":"CH1 段落3 添加反馈","data":{"sectionId":"xxx","paragraphIndex":3,"feedbackText":"建议补充文献"},"result":"ok"}
{"ts":"2026-03-14T10:23:46Z","op":"update","class":"work_thesis_manuscript","id":"def456","summary":"CH1 应用修改到段落3","data":{"contentHtml":"(truncated)","version":2},"result":"ok"}
```

字段说明：
| 字段 | 说明 |
|------|------|
| `ts` | ISO 8601 时间戳 |
| `op` | `create` / `update` / `delete` |
| `class` | Parse 类名 |
| `id` | objectId（create 时为返回的新 id） |
| `summary` | 人类可读的操作摘要（中文，一句话） |
| `data` | 写入/更新的字段（超过 500 字符的值截断为 `(truncated)`） |
| `result` | `ok` / 错误信息 |

### 2. Parse 表日志

写入 `work_ai_log` 表：

```ts
await parseClient.create('work_ai_log', {
  timestamp: new Date().toISOString(),
  operation: 'create',          // create / update / delete
  className: 'work_feedback',   // 目标表名
  targetId: 'abc123',           // 目标 objectId
  summary: 'CH1 段落3 添加反馈',
  inputData: { ... },           // 写入的数据（截断大字段）
  result: 'ok',                 // ok / 错误信息
  sessionId: sessionId,         // 当前会话标识（用于链路追踪）
  projectId: 'xxx',             // 关联项目（如有）
})
```

## 会话标识（链路追踪）

每次对话开始时生成一个 `sessionId`：

```ts
const sessionId = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
```

同一次对话中的所有操作共享此 `sessionId`，用于：
- 按会话查询所有操作：`where: { sessionId: 'ai_xxx' }`
- 批量回滚一次会话的所有变更

## 回滚支持

### 查询某次会话的操作链

```ts
const logs = await parseClient.query('work_ai_log', {
  where: { sessionId },
  order: 'timestamp',
})
// logs 按时间顺序展示完整操作链路
```

### 回滚策略

| 操作类型 | 回滚方式 |
|---------|---------|
| `create` | 删除创建的记录：`parseClient.remove(className, targetId)` |
| `update` | 用 `inputData` 中的旧值恢复（需要记录 `previousData`） |
| `delete` | 用 `inputData` 重新创建（id 会变） |

### update 操作的前值记录

对于 update 操作，`inputData` 中额外记录 `_previous` 字段：

```ts
// 更新前先读取当前值
const current = await parseClient.get(className, targetId)

await parseClient.create('work_ai_log', {
  operation: 'update',
  className,
  targetId,
  inputData: {
    _previous: { status: current.status, contentHtml: '(truncated)' },
    _updated: { status: 'resolved' },
  },
  // ...
})
```

## 执行模板

每个写操作按此模板执行：

```ts
// 1. 执行操作
const result = await parseClient.create('work_feedback', data)

// 2. 构建日志
const logEntry = {
  ts: new Date().toISOString(),
  op: 'create',
  class: 'work_feedback',
  id: result.objectId,
  summary: `${moduleKey} 段落${paragraphIndex} 添加反馈`,
  data: truncateValues(data, 500),
  result: 'ok',
}

// 3. 双写
appendToFile('logs/ai-operations.log', JSON.stringify(logEntry))
await parseClient.create('work_ai_log', {
  ...logEntry,
  timestamp: logEntry.ts,
  operation: logEntry.op,
  className: logEntry.class,
  targetId: logEntry.id,
  inputData: logEntry.data,
  sessionId,
  projectId,
})
```

## 日志文件管理

- 路径：`logs/ai-operations.log`
- 格式：JSONL（每行一条，方便 `grep` 和 `jq` 查询）
- 已加入 `.gitignore`，不提交到仓库
- 查看最近操作：`tail -20 logs/ai-operations.log | jq .`
- 按表名过滤：`grep '"class":"work_feedback"' logs/ai-operations.log | jq .`
- 按会话过滤：`grep 'ai_xxx' logs/ai-operations.log | jq .`
