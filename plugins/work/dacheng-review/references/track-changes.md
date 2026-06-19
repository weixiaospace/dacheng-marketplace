# Track Changes 格式 + 批注字段规范

## work_content_comment 字段（按 kind 决定必填）
- 公共必填：`commentId`(完整 UUID)、`contentId`、`projectId`、`writingType`、`content`、`author`、`authorName`、`resolved`(bool)
- `kind`：`comment`(用户批注) / `suggestion`(AI 修改建议) / `reply`(AI 汇总答复)，缺省 `comment`
- `scope`（`kind='comment'` 顶层必填）：`range` 或 `global`
  - `range`：必带 `from`(number)、`to`(number)、`quotedText`
  - `global`：**禁止**带 `from/to/quotedText`
- `parentId`：答复指向原批注的 `commentId`（完整 UUID，不截断）
- `roundIndex`：AI 审阅轮次（第 1 轮 = 0）
- `changeId`：与文档内 track-change mark 的 `attrs.id` 一一对应（suggestion 用）
- `suggestion`（`kind='suggestion'` 必填，CommentSuggestionMeta）：`{ status:'pending'|'accepted'|'rejected', userFinalText?, editDistance?, rejectReason?, decidedAt?, judgeScore?, judgedAt? }`

> 批注没有专用工具：用 `parse_query/create/update` 操作 `work_content_comment`；批注行靠 `contentId` 关联（先 `content_get(projectId, writingType)` 拿 `work_content.objectId`）。

### 示例
```
// 读批注
parse_query('work_content_comment', { where: { contentId }, order: 'createdAt' })

// 划词批注（range）
parse_create('work_content_comment', { commentId:<UUID>, contentId, projectId, writingType, kind:'comment', scope:'range', content:'这段逻辑跳跃太大', author:userId, authorName, resolved:false, quotedText:'被批注文字', from:100, to:150 }, '新增批注')

// AI 修改建议（suggestion；parentId 用完整 UUID）
parse_create('work_content_comment', { commentId:<UUID>, contentId, projectId, writingType, kind:'suggestion', parentId:originalCommentId, content:'已补充过渡句', author:'system-ai', authorName:'AI 助手', resolved:false, changeId:'ai-001', roundIndex:0, suggestion:{ status:'pending' } }, 'AI 修改建议')

// 接受/拒绝
parse_update('work_content_comment', objectId, { suggestion: { ...existing, status:'accepted', decidedAt:'<ISO>' } }, '处理 AI 建议')
```

## TipTap InsertionMark / DeletionMark
attrs：`{ id, author, authorId, timestamp, commentId? }`。同 `id` 的 deletion+insertion = 一次替换：
```json
[
  { "type":"text","text":"旧文字","marks":[{"type":"deletion","attrs":{"id":"ai-001","authorId":"system-ai","commentId":"完整UUID"}}] },
  { "type":"text","text":"新文字","marks":[{"type":"insertion","attrs":{"id":"ai-001","authorId":"system-ai","commentId":"完整UUID"}}] }
]
```
- `commentId` 有值 → 批注驱动的修改；为空 → 独立修订
- `authorId:'system-ai'` 标识 AI 修改
- **⚠️ parentId / changeId / commentId 一律用完整 UUID，不截断**
