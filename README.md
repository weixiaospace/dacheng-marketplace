# Dacheng Marketplace — 工作台NEO 技能库

为 Claude Code 提供工作台NEO 项目的数据操作技能（Skills），让 AI 助手高效进行 Parse 数据读取、分析和写入。

## 目录结构

```
dacheng-marketplace/
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

### 1. 注册 Marketplace

```bash
/plugin marketplace add https://cnb.cool/dachengzhihui/dacheng-marketplace.git
```

### 2. 安装插件

```bash
/plugin install dacheng@dacheng
```

安装后输入 `/` 可看到以 `dacheng:` 为前缀的技能列表。

## 技能一览

| 技能 | 触发场景 |
|------|---------|
| `dacheng:architecture` | 了解数据架构、双工作台模式、Parse API |
| `dacheng:add-crud-table` | 新增 Parse 数据表及服务层 |
| `dacheng:content-writing` | 读写内容模块（SQ/OL/M/CH） |
| `dacheng:debug-parse` | Parse API 报错（400/401/130/209） |
| `dacheng:review-feedback` | 段落评审、AI 修订、全局需求 |
| `dacheng:figure-workflow` | 图表创建、版本迭代、评审优化 |

## 使用方式

### 手动调用

在 Claude Code 对话中直接输入斜杠命令：

```
/dacheng:architecture
/dacheng:debug-parse
```

### 自动触发

Claude 会根据任务内容自动匹配并调用相关技能。例如：

- 需要查询内容段数据 → 自动触发 `content-writing`
- 遇到 Parse 401 错误 → 自动触发 `debug-parse`
- 操作图表版本数据 → 自动触发 `figure-workflow`

### 组合使用

典型流程：

1. `/dacheng:architecture` — 了解数据表结构和 Parse API
2. `/dacheng:add-crud-table` — 新增表的模型和服务层
3. `/dacheng:content-writing` 或 `/dacheng:review-feedback` — 操作具体业务数据

## 更新

```bash
claude plugins update dacheng
```

## 卸载

```bash
claude plugins uninstall dacheng
```
