# Dacheng Plugin — 工作台NEO 技能库

为 Claude Code 提供工作台NEO 项目的数据操作技能（Skills），让 AI 助手高效进行 Parse 数据读取、分析和写入。

## 目录结构

```
claude-plugin/
├── .claude-plugin/
│   ├── plugin.json          # 插件元信息
│   └── marketplace.json     # Marketplace 注册信息
├── skills/                  # 技能定义
│   ├── add-crud-table/      # 新增 Parse 数据表及服务层
│   ├── architecture/        # 数据架构、双工作台模式、Parse API
│   ├── content-writing/     # 内容读写（提案/大纲/正文/快照）
│   ├── debug-parse/         # Parse Server 调试排错
│   ├── figure-workflow/     # 图表数据管理流程
│   └── review-feedback/     # 段落级评审反馈数据操作
└── README.md                # 本文件
```

## 安装

### 1. 注册本地 Marketplace

在 Claude Code 中运行：

```bash
claude plugins add /path/to/工作台NEO/claude-plugin/.claude-plugin/marketplace.json
```

### 2. 安装插件

```bash
claude plugins install dacheng
```

### 3. 验证

```bash
claude plugins list
```

应看到 `dacheng` 出现在已安装列表中。在对话中输入 `/` 可看到以 `dacheng:` 为前缀的技能列表。

## 技能一览

| 技能 | 触发场景 | 用法 |
|------|---------|------|
| `dacheng:architecture` | 了解数据架构、双工作台模式、Parse API | `/architecture` |
| `dacheng:add-crud-table` | 新增 Parse 数据表及服务层 | `/add-crud-table` |
| `dacheng:content-writing` | 读写内容模块（SQ/OL/M/CH） | `/content-writing` |
| `dacheng:debug-parse` | Parse API 报错（400/401/130/209） | `/debug-parse` |
| `dacheng:review-feedback` | 段落评审、AI 修订、全局需求 | `/review-feedback` |
| `dacheng:figure-workflow` | 图表创建、版本迭代、评审优化 | `/figure-workflow` |

## 使用方式

### 手动调用

在 Claude Code 对话中直接输入斜杠命令：

```
/architecture
/debug-parse
```

### 自动触发

安装 superpowers 插件后，Claude 会根据任务内容自动匹配并调用相关技能。例如：

- 需要查询内容段数据 → 自动触发 `content-writing`
- 遇到 Parse 401 错误 → 自动触发 `debug-parse`
- 操作图表版本数据 → 自动触发 `figure-workflow`

### 组合使用

典型流程：

1. `/architecture` — 了解数据表结构和 Parse API
2. `/add-crud-table` — 新增表的模型和服务层
3. `/content-writing` 或 `/review-feedback` — 操作具体业务数据

## 更新技能

直接编辑 `skills/` 下的 `SKILL.md` 文件即可。修改后在 Claude Code 中运行：

```bash
claude plugins update dacheng
```

## 卸载

```bash
claude plugins uninstall dacheng
claude plugins remove dacheng
```
