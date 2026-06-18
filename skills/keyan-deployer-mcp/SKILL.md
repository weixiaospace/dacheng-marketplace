---
name: keyan-deployer-mcp
description: Use when the user needs to deploy or manage sites/services through keyan-deployer, view system status/ports/logs, upload or manage reports, or set up the keyan-deployer MCP server connection. Also use when the user mentions keyan-deployer, keyan deploy, keyan mcp, site deployment, domain status, report versions, or updater release.
---

# keyan-deployer MCP 服务器

把 keyan-deployer 的 REST API 封装成按资源聚合的 MCP 工具，让 Claude Code 通过 stdio MCP 直接驱动：建站、部署、启停、查状态、管报告、发版。

## 适用场景

- 部署前端（static/spa）或后端（fastapi）站点，并拿到访问链接
- 启动 / 停止 / 重启 / 删除站点，查看后端日志
- 查看端口池、系统状态（Caddy/Supervisor/磁盘）
- 管理报告：上传报告、管理文件夹 / 标签 / 版本
- 配置或排查 MCP 连接（`KEYAN_API_URL`、`DEPLOY_PASSWORD`）
- 更新发布相关（desktop updater release 接口）

## MCP 服务接入

Claude Code 需要安装并运行 MCP server 才能调用这些工具。

**1. 所需环境变量**

```bash
KEYAN_API_URL=https://your-deployer.example.com   # 或 http://IP:port
DEPLOY_PASSWORD=your-bearer-password
```

**2. 接入方式（Claude Code）**

```bash
claude mcp add keyan-deployer-mcp \
  -e KEYAN_API_URL=https://your-deployer.example.com \
  -e DEPLOY_PASSWORD=your-password \
  -- npx -y @dachengzhihui/keyan-deployer-mcp
```

> 全局可用加 `-s user`。

**3. 验证是否连上**

可以让 Claude 说「列出所有站点」或「看下系统状态」。

## 可用工具

每个工具都通过 `{ action, params }` 调用，工具描述里有全部 action 及其参数。

| 工具 | 场景 |
|------|------|
| `sites` | 站点全生命周期：建站 / 部署 / 启停重启 / 改配置 / 删除 / 看日志 |
| `site_records` | 站点版本：列表 / 切换 / 下载 / 删除 / 备注 / 锁定解锁 |
| `ports` | 端口池：列表 / 统计 |
| `system` | 系统状态、网络模式配置 |
| `reports` | 报告：上传 / 访问内容 / 评论开关 / 移动 |
| `report_folders` | 报告文件夹树增删改查 |
| `report_records` | 报告版本管理 |
| `report_tags` | 报告标签增删改查 |
| `comment_config` | 评论插件全局配置 |

> 域名 / HTTPS / DNS 不在 MCP 里，引导用户在桌面端管理。

## 典型工作流

### 部署一个站点并拿到访问链接

1. `sites` `create` `{ code, name, category, type, config? }`
   - 前端：`category="frontend"`, `type="static"|"spa"`（压缩包根级须有 `index.html`）
   - 后端：`category="backend"`, `type="fastapi"`（压缩包须含 `pyproject.toml`）
2. `sites` `deploy` `{ id, archive_path }`，等待 `status` 为 `success`
3. `sites` `get` `{ id }` 读 `port`，访问链接 = `http://{KEYAN_API_URL的host}:{port}/`
4. 之后用 `sites` `stop` / `start` / `restart` 控制

### 上传报告

1. `report_folders` `create` 或 `list` 拿到 folder_id
2. `reports` `create` `{ title, folder_id, file_path, password?, comments_enabled? }`
3. 需要版本迭代时用 `report_records` 上传新版本、`switch` 切换

## 关键约定

- 文件上传 action（`sites.deploy`、`reports.create`、`report_records.create`）传**本地文件路径**，MCP server 会读取并以 multipart 上传。
- `KEYAN_API_URL` 可以是域名或 IP；访问链接直接用它的 host 拼端口，不再查 server_ip。
- `mcp` 是独立 npm 包 `@dachengzhihui/keyan-deployer-mcp`，版本不跟随 desktop/api。
- 开发命令（项目内）：`cd apps/mcp && npm install && npm test && npm run build`

## 常见排错

- **工具列表为空 / 连接失败**：确认 `KEYAN_API_URL` 可达（`curl $KEYAN_API_URL/health` 应返回 `{"status":"ok"}`），且 `node -v >= 20`。
- **启动报 `Missing required env var`**：环境变量没配，按上面方式重新 `claude mcp add`。
- **启动报 `Health check failed`**：URL 或密码错误，或服务器/端口不可达。
- **改了 MCP 配置不生效**：多数客户端需重启或在 MCP 面板刷新。

## 安全提示

`DEPLOY_PASSWORD` 会明文写在客户端配置中，妥善保管、勿提交进 git。
