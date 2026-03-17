---
name: format-ops
description: Use when parsing format requirements from documents into structured rules, inferring format specs by school/journal name, or managing format templates and project bindings.
---

# 排版格式系统

## 适用关键词
"格式"、"排版"、"模板"、"格式要求"、"论文格式"、"格式解析"、"格式规范"、"格式模板"

## 覆盖能力
- **8.1 文档格式解析**（L2）— 从格式要求文档中提取结构化参数，写入模板
- **8.2 格式规则智能补全**（L1）— 基于学校/期刊名称推断格式要求

## 数据模型

### WorkFormatTemplate（Parse 类：`work_format_template`）
| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `type` | string | `'template'`（管理员）/ `'custom'`（项目自定义） |
| `name` | string | 模板名称 |
| `description` | string | 描述 |
| `categoryId` | string | FK → work_format_category |
| `tags` | string[] | 标签 |
| `isPublished` | boolean | 是否发布 |
| `rules` | object | v2 Rules 嵌套 JSON（~160 参数，结构见下方） |
| `coverFileUrl` | string | 封面模板文件 URL |

### WorkFormatBinding（Parse 类：`work_format_binding`）
| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `projectId` | string | FK → work_project（1:1） |
| `templateId` | string | FK → work_format_template |
| `overrides` | object | 项目级覆盖（deepMerge 到模板 rules） |

### WorkFormatUpload（Parse 类：`work_format_upload`）
| 字段 | 类型 | 说明 |
|------|------|------|
| `objectId` | string | 主键 |
| `projectId` | string | FK → work_project |
| `fileName` | string | 文件名 |
| `fileUrl` | string | Parse 文件 URL |
| `parsedData` | object | 解析后的格式数据 |

## v2 Rules 完整结构

Rules 是嵌套 JSON，所有路径用 **camelCase**。字号字段统一为 `sizePt`（不是 fontSize）。边距单位 **cm**。

> 中文字号换算：小四=12pt，四号=14pt，三号=16pt，小二=18pt，二号=22pt，小一=24pt，初号=42pt。

### 1. 页面设置 `page.*`

```json
{
  "page": {
    "size": "A4",                    // A4 | A3 | B5 | Letter | 16K
    "orientation": "portrait",       // portrait | landscape
    "margin": {
      "top": 3.0,                    // cm
      "bottom": 2.5,
      "left": 3.0,
      "right": 2.5,
      "gutter": 0,                   // 装订线 cm
      "header": 2.0,                 // 页眉距边界 cm
      "footer": 1.5                  // 页脚距边界 cm
    }
  }
}
```

### 2. 正文格式 `styles.body.*`

```json
{
  "styles": {
    "body": {
      "cnFont": "宋体",
      "enFont": "Times New Roman",
      "sizePt": 12,                  // pt
      "lineSpacing": 1.5,           // 倍数
      "firstLineIndent": 2,         // 字符
      "alignment": "justify",       // left | center | right | justify
      "spaceBefore": 0,             // pt
      "spaceAfter": 0               // pt
    }
  }
}
```

### 3-4. 中英文摘要 `styles.abstractCn.*` / `styles.abstractEn.*`

```json
{
  "styles": {
    "abstractCn": {
      "title": { "text": "摘  要", "cnFont": "黑体", "enFont": "Arial", "sizePt": 16, "bold": true, "alignment": "center" },
      "body": { "cnFont": "宋体", "enFont": "Times New Roman", "sizePt": 12, "lineSpacing": 1.5, "firstLineIndent": 2 },
      "keywords": { "label": "关键词：", "labelFont": "黑体", "labelSizePt": 12, "labelBold": true, "valueFont": "宋体", "valueSizePt": 12, "separator": "；" }
    },
    "abstractEn": {
      "title": { "text": "Abstract", "cnFont": "Arial", "enFont": "Arial", "sizePt": 16, "bold": true, "alignment": "center" },
      "body": { "cnFont": "Times New Roman", "enFont": "Times New Roman", "sizePt": 12, "lineSpacing": 1.5, "firstLineIndent": 0 },
      "keywords": { "label": "Keywords:", "labelFont": "Times New Roman", "labelSizePt": 12, "labelBold": true, "valueFont": "Times New Roman", "valueSizePt": 12, "separator": "; " }
    }
  }
}
```

### 5. 标题级别 `styles.heading1~4.*`

每级标题共 9 个字段，结构相同：

```json
{
  "styles": {
    "heading1": {
      "cnFont": "黑体", "enFont": "Arial", "sizePt": 16,
      "bold": true, "italic": false,
      "alignment": "center",         // left | center | right | justify
      "spaceBefore": 24,             // pt
      "spaceAfter": 18,              // pt
      "lineSpacing": 1.5,
      "pageBreakBefore": true
    },
    "heading2": { "cnFont": "黑体", "enFont": "Arial", "sizePt": 14, "bold": true, "alignment": "left", "spaceBefore": 12, "spaceAfter": 6 },
    "heading3": { "cnFont": "黑体", "enFont": "Arial", "sizePt": 12, "bold": true, "alignment": "left", "spaceBefore": 6, "spaceAfter": 6 },
    "heading4": { "cnFont": "宋体", "enFont": "Times New Roman", "sizePt": 12, "bold": true, "alignment": "left" }
  }
}
```

### 6. 目录 `styles.toc.*`

```json
{
  "styles": {
    "toc": {
      "title": { "text": "目  录", "cnFont": "黑体", "enFont": "Arial", "sizePt": 16, "bold": true },
      "levels": 3,
      "level1": { "cnFont": "黑体", "sizePt": 14, "bold": true },
      "level2": { "cnFont": "宋体", "sizePt": 12, "bold": false },
      "level3": { "cnFont": "宋体", "sizePt": 12, "bold": false },
      "leaderStyle": "dot",          // dot | hyphen | underscore | none
      "showPageNumbers": true
    }
  }
}
```

### 7. 图表标题 `styles.caption.*`

```json
{
  "styles": {
    "caption": {
      "figure": {
        "cnFont": "宋体", "enFont": "Times New Roman", "sizePt": 10.5,
        "bold": false, "alignment": "center",
        "position": "below",         // above | below
        "numberFormat": "图 {chapter}-{seq}",
        "spaceBefore": 6, "spaceAfter": 12
      },
      "table": {
        "cnFont": "宋体", "enFont": "Times New Roman", "sizePt": 10.5,
        "bold": false, "alignment": "center",
        "position": "above",
        "numberFormat": "表 {chapter}-{seq}",
        "spaceBefore": 12, "spaceAfter": 6
      }
    }
  }
}
```

### 8. 表格 `table.*`

```json
{
  "table": {
    "type": "threeLine",             // threeLine | full | none
    "alignment": "center",
    "header": { "cnFont": "黑体", "enFont": "Arial", "sizePt": 10.5, "bold": true, "alignment": "center" },
    "cell": { "cnFont": "宋体", "enFont": "Times New Roman", "sizePt": 10.5, "alignment": "center", "verticalAlign": "center" },
    "border": {
      "top": { "widthPt": 1.5 },
      "bottom": { "widthPt": 1.5 },
      "headerBottom": { "widthPt": 0.75 }
    },
    "note": { "cnFont": "宋体", "sizePt": 9, "prefix": "注：" }
  }
}
```

### 9. 引用 `citation.*`

```json
{
  "citation": {
    "format": "superscript",         // superscript | inline | footnote
    "style": "numeric",              // numeric | author-year
    "sizePt": 9,
    "bracket": "[]",                 // [] | () | 空
    "separator": ","
  }
}
```

### 10. 参考文献 `reference.*`

```json
{
  "reference": {
    "style": "GB/T 7714-2015",
    "title": { "text": "参考文献", "cnFont": "黑体", "enFont": "Arial", "sizePt": 16, "bold": true, "alignment": "center" },
    "entry": { "cnFont": "宋体", "enFont": "Times New Roman", "sizePt": 10.5, "lineSpacing": 1.25, "hangingIndent": 2, "spaceBefore": 0, "spaceAfter": 0 }
  }
}
```

### 11. 页眉页脚 `headerFooter.*`

```json
{
  "headerFooter": {
    "header": {
      "content": "XX大学硕士学位论文",
      "cnFont": "宋体", "enFont": "Times New Roman", "sizePt": 9,
      "alignment": "center",
      "borderBottom": { "widthPt": 0.75 }
    },
    "footer": {
      "type": "pageNumber",          // pageNumber | text | none
      "sizePt": 9, "enFont": "Times New Roman",
      "alignment": "center",
      "format": "decimal",           // decimal | roman | romanUpper
      "startAt": 1
    },
    "skipCoverPages": 1,
    "firstPageDifferent": false,
    "oddEvenDifferent": false,
    "abstractPageNumberFormat": "roman"  // roman | decimal | none
  }
}
```

### 12. 封面 `cover.*`

```json
{
  "cover": {
    "enabled": true,
    "fields": {
      "title": { "cnFont": "黑体", "enFont": "Arial", "sizePt": 22, "bold": true, "alignment": "center" },
      "author": { "cnFont": "宋体", "enFont": "Times New Roman", "sizePt": 16, "bold": false },
      "advisor": { "cnFont": "宋体", "enFont": "Times New Roman", "sizePt": 16 },
      "institution": { "cnFont": "宋体", "enFont": "Times New Roman", "sizePt": 16 },
      "date": { "format": "YYYY年MM月" },
      "logo": { "widthCm": 3 }
    }
  }
}
```

### 13. 声明页 `declaration.*`

```json
{
  "declaration": {
    "enabled": true,
    "title": { "text": "学位论文独创性声明", "cnFont": "黑体", "enFont": "Arial", "sizePt": 16, "bold": true },
    "signatureLine": true
  }
}
```

### 14. 致谢 `acknowledgement.*`

```json
{
  "acknowledgement": {
    "title": { "text": "致  谢", "cnFont": "黑体", "enFont": "Arial", "sizePt": 16, "bold": true, "alignment": "center" },
    "body": { "cnFont": "宋体", "enFont": "Times New Roman", "sizePt": 12, "lineSpacing": 1.5, "firstLineIndent": 2 }
  }
}
```

### 15. 编号 `numbering.*`

```json
{
  "numbering": {
    "chapter": { "format": "第{一}章", "style": "chinese" },    // chinese | decimal | roman
    "heading2": { "format": "{chapter}.{seq}" },
    "heading3": { "format": "{chapter}.{h2}.{seq}" },
    "heading4": { "format": "{chapter}.{h2}.{h3}.{seq}" },
    "figure": { "format": "图 {chapter}-{seq}" },
    "table": { "format": "表 {chapter}-{seq}" },
    "equation": { "format": "({chapter}-{seq})" }
  }
}
```

### 16. 脚注 `footnote.*`

```json
{
  "footnote": {
    "cnFont": "宋体", "enFont": "Times New Roman", "sizePt": 9,
    "lineSpacing": 1.0,
    "numberFormat": "decimal",       // decimal | symbol | roman
    "restart": "eachPage",           // eachPage | eachSection | continuous
    "position": "pageBottom"         // pageBottom | beneathText
  }
}
```

### 17. 列表 `listStyle.*`

```json
{
  "listStyle": {
    "ordered": { "indent": 2 },
    "unordered": { "bullet": "●", "indent": 2 }
  }
}
```

## 服务层 API

### formatTemplateService
```
getById(objectId) → WorkFormatTemplate
getPublished() → WorkFormatTemplate[]
create(data) → { objectId }
update(objectId, data) → void
remove(objectId) → void
```

### formatBindingService
```
getBinding(projectId) → WorkFormatBinding | null
bind(projectId, templateId, overrides?) → { objectId }
updateBinding(objectId, data) → void
unbind(objectId) → void
createCustom(projectId, name) → { templateId, bindingId }
getResolvedRules(projectId) → object   // deepMerge(template.rules, binding.overrides)
```

### formatUploadService
```
getUploads(projectId) → WorkFormatUpload[]
createUpload(data) → { objectId }
removeUpload(objectId) → void
```

---

## AI 操作场景

### 场景 1：从文档解析格式要求（8.1）

用户上传格式要求文档（学校论文模板说明），AI 提取结构化参数写入模板。

```
步骤：
1. 读取上传文件内容（PDF/DOCX → 文本）
2. 逐组解析格式参数，映射到 v2 Rules 路径
3. 无法确定的参数不写入（留空）
4. 创建格式模板（isPublished=false，待人工审核）
5. 将原始文件记录到 work_format_upload
```

```ts
const parsedRules = {
  page: { size: 'A4', margin: { top: 3.0, bottom: 2.5, left: 3.0, right: 2.5 } },
  styles: {
    body: { cnFont: '宋体', enFont: 'Times New Roman', sizePt: 12, lineSpacing: 1.5, firstLineIndent: 2, alignment: 'justify' },
    heading1: { cnFont: '黑体', sizePt: 16, bold: true, alignment: 'center', pageBreakBefore: true },
    heading2: { cnFont: '黑体', sizePt: 14, bold: true, alignment: 'left' },
    heading3: { cnFont: '黑体', sizePt: 12, bold: true, alignment: 'left' },
  },
  numbering: {
    chapter: { format: '第{一}章', style: 'chinese' },
    figure: { format: '图 {chapter}-{seq}' },
    table: { format: '表 {chapter}-{seq}' },
  },
}

const { objectId: templateId } = await parseClient.create('work_format_template', {
  type: 'template',
  name: 'XX大学硕士论文格式',
  description: '根据XX大学研究生院论文撰写规范解析',
  isPublished: false,
  rules: parsedRules,
})

await parseClient.create('work_format_upload', {
  projectId,
  fileName: '格式要求.pdf',
  fileUrl: uploadedUrl,
  parsedData: parsedRules,
})
// → 记录操作日志
```

### 场景 2：格式规则智能补全（8.2）

根据学校或期刊名称推断格式要求。

```
步骤：
1. 用户提供学校/期刊名称
2. AI 推断常见格式规范，生成 v2 Rules
3. 低置信度参数留空
4. 创建模板（isPublished=false），提示用户人工核对
```

```ts
const { objectId } = await parseClient.create('work_format_template', {
  type: 'template',
  name: '清华大学博士论文格式（AI推断）',
  description: '基于公开规范推断，请人工核对后发布',
  isPublished: false,
  rules: inferredRules,
  tags: ['理工科', '985', '博士'],
})
// → 记录操作日志
```

### 场景 3：更新模板规则（按组）

```ts
const template = await parseClient.get('work_format_template', templateId)
const rules = template.rules || {}

// 更新正文组
rules.styles = rules.styles || {}
rules.styles.body = { ...rules.styles.body, cnFont: '仿宋', sizePt: 14 }

await parseClient.update('work_format_template', templateId, { rules })
// → 记录操作日志
```

### 场景 4：项目绑定与覆盖

```ts
// 引用已有模板
await formatBindingService.bind(projectId, templateId)

// 或创建自定义格式
await formatBindingService.createCustom(projectId, '自定义格式')

// 项目级覆盖（不改模板）
await formatBindingService.updateBinding(bindingId, {
  overrides: {
    page: { margin: { left: 3.5 } },
    styles: { body: { sizePt: 14 } },
  },
})
// → 记录操作日志
```

---

## 前置检查

执行格式操作前，务必确认：
1. **projectId** — 目标项目
2. **格式绑定** — 项目是否已绑定模板（`getBinding(projectId)`）
3. **.env** — Parse 连接信息已配置

## 日志要求

所有写操作必须按 `dacheng:operation-log` 规范记录日志。
