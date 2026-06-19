# Dacheng Marketplace

为 Claude Code 提供三套技能插件：

- **work** — keyan/dacheng 科研写作工作台技能（总览、写作、文献、档案、审阅）
- **deployer** — keyan-deployer 相关技能（MCP server 自动注册、站点部署、报告管理）
- **dev** — 开发类技能（Tauri 自动更新、构建/发版工作流）

## 目录结构

```
dacheng-marketplace/
├── .claude-plugin/
│   └── marketplace.json     # Marketplace 注册信息（work / deployer / dev）
├── plugins/
│   ├── work/                # keyan/dacheng 科研工作台 plugin
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── dacheng-overview/
│   │   ├── dacheng-writing/
│   │   ├── dacheng-literature/
│   │   ├── dacheng-profile/
│   │   └── dacheng-review/
│   ├── deployer/            # keyan-deployer plugin
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── .mcp.json        # 自动注册 keyan-deployer-mcp MCP server
│   │   └── keyan-deployer-mcp/
│   └── dev/                 # 开发类 plugin
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── shadcn/
│       └── tauri-cnb-autoupdate/
├── docs/                    # 规划文档
└── README.md                # 本文件
```

## 安装

### 1. 注册 Marketplace

```bash
/plugin marketplace add https://cnb.cool/dachengzhihui/dacheng-marketplace.git
```

### 2. 安装所需插件

```bash
# 工作台NEO 数据操作
/plugin install work@dacheng

# keyan-deployer 部署与 MCP 操作（自动注册 MCP server）
/plugin install deployer@dacheng

# 开发类技能（Tauri 自动更新等）
/plugin install dev@dacheng
```

### 3. 配置

**work 插件**依赖 Parse 连接。在目标项目根目录创建 `.env`：

```env
PARSE_SERVER_URL=http://your-parse-server/parse
PARSE_APP_ID=yourAppId
PARSE_MASTER_KEY=yourMasterKey
```

**deployer 插件**安装后会通过 `.mcp.json` 自动注册 `keyan-deployer-mcp` MCP server，但你需要提供环境变量。任选一种方式：

1. **Shell 环境继承（推荐）**：启动 Claude Code 前 export：
   ```bash
   export KEYAN_API_URL=https://your-deployer.example.com
   export DEPLOY_PASSWORD=your-password
   claude
   ```

2. **手动重新注册**：
   ```bash
   claude mcp add keyan-deployer-mcp \
     -e KEYAN_API_URL=https://your-deployer.example.com \
     -e DEPLOY_PASSWORD=your-password \
     -- npx -y @dachengzhihui/keyan-deployer-mcp
   ```

3. 在 `~/.claude/settings.json` 的 `mcpServers` 中编辑 `keyan-deployer-mcp` 的 `env`。

> 若缺少 env，MCP server 启动会打印 `Missing required env var`，按上面方式配置即可。

## 使用方式

在 Claude Code 对话中直接输入斜杠命令：

```
/work:dacheng-overview
/work:dacheng-writing
/work:dacheng-literature

/deployer:keyan-deployer-mcp

/dev:tauri-cnb-autoupdate
/dev:shadcn
```

Claude 也会根据任务内容自动匹配并调用相关技能。

## work 技能一览

| 技能 | 触发场景 |
|------|---------|
| `work:dacheng-overview` | 科研工作台总入口：确立操作模型，配合其他域技能使用 |
| `work:dacheng-writing` | 学术写作内容：章节/正文/大纲/科学问题/摘要、生成初稿、润色 |
| `work:dacheng-literature` | 文献管理：检索、推荐、DOI 核验、导入、文件夹分类、项目引用 |
| `work:dacheng-profile` | 人员档案：查看/管理档案、论文/基金/专利、完整度诊断、CV 提取 |
| `work:dacheng-review` | 审阅与修改：录入意见、按意见修改、AI 审阅、版本快照对比 |

## deployer 技能一览

| 技能 | 触发场景 |
|------|---------|
| `deployer:keyan-deployer-mcp` | 通过 MCP 驱动 keyan-deployer：建站、部署、启停、查状态、管报告 |

## dev 技能一览

| 技能 | 触发场景 |
|------|---------|
| `dev:tauri-cnb-autoupdate` | Tauri 自动更新：GitHub 构建签名 + CNB 托管下载（国内） |
| `dev:shadcn` | shadcn/ui 组件管理：添加、搜索、修复、调试、样式、组合 |

## 更新

```bash
/plugin marketplace update dacheng
```

## 卸载

```bash
/plugin marketplace remove dacheng
```

## 注意事项

- **work 插件数据表命名**：所有表使用 `work_` 前缀 + snake_case（如 `work_project_report`）
- **Master Key 安全**：仅用于 AI/后端脚本操作，永远不要放在前端代码中
- **Windows 用户**：禁止在命令行参数中直接写中文 JSON，必须保存为 `.js` 文件后 `node 文件名.js` 执行
- **破坏性操作**：执行 DROP/DELETE/TRUNCATE 前必须二次确认
- **版本管理**：历史版本记录只设 `isLatest=false`，不要删除
