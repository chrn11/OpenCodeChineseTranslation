## 项目定位
- 这是一个“OpenCode 官方源码 + 中文本地化包 + Node CLI 工具链”的仓库：自动同步官方 OpenCode、检测新增文本、用 OpenAI 兼容 API 翻译并做质量检查，然后构建/部署中文版本。
- 推荐主入口是一键命令 `opencodenpm full`（同步→翻译/应用→校验→构建→部署）。

## 目录与职责
- 语言包/替换规则： [opencode-i18n/](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/opencode-i18n)
  - 模块清单与版本信息： [config.json](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/opencode-i18n/config.json)
  - 各模块 JSON 文件里保存 `file` 与 `replacements`（原文→译文）。
- CLI 与自动化： [scripts/](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/scripts)
  - 命令注册入口： [cli.js](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/scripts/core/cli.js)
  - 汉化核心： [i18n.js](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/scripts/core/i18n.js)
  - 翻译器： [translator.js](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/scripts/core/translator.js)
- 官方源码工作目录（工具会 clone/pull）：`opencode-zh-CN/`（由脚本自动生成/维护）。

## 关键工作流（你后续让做任何事，我会按这条链路定位）
- 同步官方：`opencodenpm sync/update` → 确保 `opencode-zh-CN/` 是最新。
- 应用汉化：`opencodenpm apply`
  - 扫描 `opencode-i18n/**/*.json`，把 replacements 应用到 `opencode-zh-CN/packages/opencode/src/cli/cmd/tui` 的源码文件。
  - 若检测到新增文件：会用 AI 判断是否需要翻译，必要时自动生成新的 JSON 配置或加入 skip 列表。
- 检查/质量：`opencodenpm check --quality`（含 TypeScript 语法检查与 AI 审查/自动修复路径）。
- 构建/部署：`opencodenpm build` + `opencodenpm deploy`（CI 用 Bun 构建多平台产物并打包 Release）。

## 翻译配置的最小模型
- 每个 JSON 主要长这样：
  - `file`: 指向 OpenCode 源码内的相对路径（通常在 `src/cli/cmd/tui/...`）
  - `replacements`: `{ "英文": "中文" }` 的替换表
- 全量模块编排由 [opencode-i18n/config.json](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/opencode-i18n/config.json) 的 `modules` 控制（便于统计覆盖率/分模块管理）。

## 约束与风险点（后续排查问题的抓手）
- 需要 Node>=18；构建阶段依赖 Bun（CI 固定版本）。
- 翻译替换属于“直接改源码字符串”，容易被上游改动打断：路径变更、文本微调、插值变量/模板字符串变化、以及 TSX 语法都可能导致 apply 后构建失败。
- AI 翻译需要 `.env`（OpenAI 兼容 API），否则只能走跳过翻译/仅应用已有配置的模式。

## 得到确认后我会继续做的熟悉动作（不改代码）
- 跑一遍最小只读核对：列出当前版本号、模块覆盖情况、以及 `opencode-i18n/` 中每个 `file` 是否都能在上游目录命中。
- 梳理一张“命令→关键函数→写入点”的调用链索引（帮助你/我之后快速定位问题）。
- 归纳常见故障点的定位入口（同步失败、apply 失败、tsc 报错、构建产物找不到、deploy 权限等）。

如果你确认这个理解方向，我下一步会基于这些入口把“最常用的 3 条维护路径（上游更新 / 新增文件翻译 / 构建发布）”整理成可复用的操作与排错手册。