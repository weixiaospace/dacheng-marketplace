---
name: dacheng-review
description: 当用户提到审阅、修改意见、反馈相关任务时使用。包括：录入专家/老师的修改意见（张老师的意见、审稿意见）、根据意见修改论文（按意见改、帮我改）、AI 自动审阅（审阅一下、看看有什么问题）、管理全局需求（总体要求）、版本/快照对比。只要提到修改意见、审阅、反馈、按要求修改或版本对比就触发。
---

# 审阅与修改

机制：TipTap track changes（InsertionMark/DeletionMark）+ `work_content_comment` 批注 + `work_content.aiStatus` 状态机 + `work_content_snapshot` 快照。

## AI 审阅状态机（`work_content.aiStatus`）

```
editing → submitted → processing → reviewed → editing
                                  → reviewed_stale（AI 处理期间用户改了内容）
                                  → error
```

## 批注驱动 AI 修改（核心流程）

用户批注 → AI 生成修改 → 接受/拒绝，全部在批注 timeline 内完成：
1. 用户加批注 → CommentMark 加在选区文字上
2. AI 回复 → `work_content_comment` 追加一行，`parentId` 指向原批注，带 `suggestion`/revision 数据
3. AI 同时在文档：移除 CommentMark → 加 DeletionMark + InsertionMark（带 commentId）
4. 用户接受 → track change 生效 + suggestion.status = `accepted`
5. 用户拒绝 → track change 撤销 + suggestion.status = `rejected`

**批注字段规范、读写示例、track-changes JSON 格式见 `references/track-changes.md`。**

## 快照

- 建：`content_snapshot_create(projectId, writingType, contentId, contentHtml, contentJson, label, wordCount, summary)`
- 列：`content_snapshot_list(contentId)` —— 参数是 `contentId`（work_content 的 objectId），不是 projectId+writingType；先 `content_get(projectId, writingType)` 拿到它。

## 录入外部修改意见

把专家/老师意见录为 `work_content_comment`（`kind:'comment'`，`scope:'range'` 或 `'global'`），再按意见生成修改（见上流程）。全局总体要求录为 `scope:'global'` 的文档级批注。
