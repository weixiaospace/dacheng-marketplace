---
name: debug-parse
description: Use when encountering Parse Server API errors (400, 401, 130, 209), file upload failures, empty query results, or needing to test Parse REST API directly.
---

# Parse Server 调试

## 连接信息

从项目 `.env` 文件读取以下变量：
- `PARSE_SERVER_URL` — Parse Server 地址
- `PARSE_APP_ID` — Application ID
- `PARSE_MASTER_KEY` — Master Key（仅 AI/后端脚本使用，**永远不要放在前端代码中**）

> 如果 `.env` 不存在或缺少以上变量，请提示用户：
> "请在项目根目录创建 `.env` 文件并填写 Parse 连接信息（PARSE_SERVER_URL、PARSE_APP_ID、PARSE_MASTER_KEY）"

## parseClient API

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

错误类型：`ParseError { code, isTimeout, isNetwork }`

## 常见错误

### Code 130：文件上传被拒

**中文文件名 → 400：**
```ts
// 错误：直接用中文文件名
// 正确：
const safeName = `report_${Date.now()}${ext}`
```

**扩展名被禁用（"File upload of extension xxx is disabled"）：**

Docker 配置修复：
```yaml
PARSE_SERVER_FILE_UPLOAD_OPTIONS: '{"fileExtensions":["*"],"enableForPublic":false,"enableForAuthenticatedUser":true,"enableForAnonymousUser":false}'
```

**关键坑：** 独立环境变量如 `PARSE_SERVER_FILE_UPLOAD_FILE_EXTENSIONS` 会被静默忽略，必须用 `PARSE_SERVER_FILE_UPLOAD_OPTIONS` 传 JSON 对象。

**Content-Type 被拦截：**
```ts
// 错误：type: 'text/html'
// 正确：
const blob = new Blob([text], { type: 'text/plain' })
```

### Code 209：Session Token 失效
- Token 通过 `X-Parse-Session-Token` header 传递（parseClient 自动处理）
- 解决：用户重新登录

### 查询返回空
- 字段名大小写敏感（Parse 严格匹配）
- 确认 `className` 使用了 `work_` 前缀
- 在 Parse Dashboard 中验证数据是否存在
- 检查 `where` 条件中的值类型（字符串 vs 数字）

## 调试步骤

1. 浏览器 Network 面板查看实际请求/响应
2. 检查 parseClient 的请求构造
3. curl 测试：
   ```bash
   curl -X GET "$PARSE_SERVER_URL/classes/work_xxx" \
     -H "X-Parse-Application-Id: $PARSE_APP_ID" \
     -H "X-Parse-Master-Key: $PARSE_MASTER_KEY"
   ```
4. 容器日志：`docker logs parse-server-online`
5. 进入容器检查环境变量：`docker exec -it parse-server-online env | grep PARSE`

## 文件上传完整流程

```ts
const ext = file.name.match(/\.[^.]+$/)?.[0] || '.txt'
const safeName = `upload_${Date.now()}${ext}`
const blob = new Blob([content], { type: 'text/plain' })
const { url } = await parseClient.uploadFile(safeName, blob)
```

## Parse REST API 速查

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

## 数据表命名

所有表使用 `work_` 前缀 + snake_case。完整表清单见 `dacheng:architecture`。
