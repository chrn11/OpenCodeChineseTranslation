# OpenCode 汉化项目 - AI 维护指南

> 本文档为 AI 助手（如 Claude、GPT 等）提供维护此汉化项目的完整指南。

## 📋 项目概述

**项目名称:** OpenCode 中文汉化版
**仓库地址:** https://github.com/anomalyco/opencode
**汉化脚本:** `scripts/opencode/opencode.ps1`
**汉化配置:** `opencode-i18n/`

### 目录结构

```
OpenCode/
├── opencode-zh-CN/          # OpenCode 源码（从 anomalyco/opencode 克隆）
│   └── packages/opencode/   # 主包源码
│       └── src/
│           └── cli/cmd/tui/  # 需要汉化的 TUI 组件
├── opencode-i18n/            # 汉化配置目录
│   ├── config.json           # 主配置文件（版本、模块列表）
│   ├── dialogs/              # 对话框翻译配置
│   ├── routes/               # 路由翻译配置
│   ├── components/           # 组件翻译配置
│   └── common/               # 通用翻译配置
├── scripts/
│   ├── opencode/
│   │   └── opencode.ps1      # 主管理脚本（Windows PowerShell）
│   └── opencode-linux/
│       └── lib/
│           └── i18n.js       # 汉化应用核心（跨平台）
└── docs/                      # 文档目录
    └── AI_MAINTENANCE.md      # 本文档
```

## 🚀 快速开始

### 1. 拉取最新代码

```powershell
cd C:\Data\PC\OpenCode\opencode-zh-CN
git fetch origin
git reset --hard origin/dev
```

### 2. 运行汉化管理工具

```powershell
# 进入项目目录
cd C:\Data\PC\OpenCode

# 运行管理工具
.\scripts\opencode\opencode.ps1
```

### 3. 常用命令

| 命令 | 功能 | 说明 |
|------|------|------|
| `[1]` | 一键汉化+部署 | 拉取 → 恢复原文 → 汉化 → 部署 |
| `[2]` | 应用汉化 | 恢复原文 → 应用汉化补丁 |
| `[3]` | 验证汉化 | 检查翻译覆盖率 |
| `[4]` | 调试工具 | 诊断翻译问题 |
| `[8]` | 本地部署 | 创建 opencode.cmd |
| `[R]` | 恢复纯净 | 撤销所有汉化 |

## 🔧 更新语言包流程

### 场景：OpenCode 发布了新版本

1. **拉取最新代码**
   ```powershell
   cd C:\Data\PC\OpenCode\opencode-zh-CN
   git pull origin dev
   ```

2. **运行 `[1] 一键汉化+部署`**
   - 会自动恢复原始文件
   - 应用所有汉化补丁
   - 创建 opencode.cmd 启动脚本

3. **验证结果**
   - 运行 `[3] 验证汉化` 检查覆盖率
   - 如有失败，运行 `[4] 调试工具`

### 场景：新增/修改翻译配置

1. **编辑配置文件**
   - 位置: `opencode-i18n/` 下对应目录
   - 格式: JSON

2. **配置文件格式**
   ```json
   {
     "file": "src/cli/cmd/tui/xxx.tsx",
     "description": "文件描述",
     "note": "注意说明",
     "replacements": {
       "原文": "译文",
       "Original Text": "翻译文本"
     }
   }
   ```

3. **测试配置**
   ```powershell
   # 运行 [2] 应用汉化
   # 运行 [3] 验证汉化
   ```

4. **更新版本号**
   - 编辑 `opencode-i18n/config.json`
   - 更新 `version` 和 `supportedCommit`

## 📝 翻译配置规范

### 命名规范

| 类型 | 文件名格式 | 示例 |
|------|------------|------|
| 对话框 | `dialog-{name}.json` | `dialog-status.json` |
| 路由 | `route-{name}.json` | `route-sidebar.json` |
| 组件 | `component-{name}.json` | `component-question.json` |
| 通用 | `{category}-{name}.json` | `app-messages.json` |

### 翻译原则

1. **只翻译用户可见文本**
   - ✅ UI 文本、按钮、提示信息
   - ❌ 函数名、变量名、类型名
   - ❌ 日志输出（除非是面向用户的）

2. **保持技术术语一致性**
   - `MCP Server` → `MCP 服务器`
   - `LSP Server` → `LSP 服务器`
   - `Plugin` → `插件`
   - `Formatter` → `格式化器`

3. **匹配完整上下文**
   - 包含必要的 HTML/JSX 标签
   - 示例: `</text>` 而非单独的 `text`

### 常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| `[原文不存在]` | 源文件已更新，模式不匹配 | 运行 `[2]` 恢复原文后再应用 |
| `验证失败` | 配置模式与源文件不符 | 运行 `[4]` 调试工具检查 |
| `路径错误` | 源码路径配置错误 | 检查 `config.json` 中的 `file` 字段 |

## 🛠️ 脚本架构

### 主要函数

| 函数 | 功能 | 位置 |
|------|------|------|
| `Invoke-OneClickFull` | 一键汉化+部署 | opencode.ps1:3711 |
| `Apply-Patches` | 应用汉化补丁 | opencode.ps1:3439 |
| `Test-I18NPatches` | 验证汉化结果 | opencode.ps1:3152 |
| `Invoke-LocalBuild` | 本地部署 | opencode.ps1:4678 |
| `Restore-CleanMode` | 恢复纯净 | opencode.ps1:4431 |

### 修改脚本时的注意事项

1. **路径变量**
   ```powershell
   $SRC_DIR = "$PROJECT_DIR\opencode-zh-CN"       # 源码根目录
   $PACKAGE_DIR = "$SRC_DIR\packages\opencode"      # 主包目录
   $I18N_DIR = "$PROJECT_DIR\opencode-i18n"        # 配置目录
   ```

2. **部署路径**
   - opencode.cmd 输出: `$env:APPDATA\npm\opencode.cmd`
   - 入口文件: `$PACKAGE_DIR\src\index.ts`

3. **汉化应用**
   - Windows: `node scripts/opencode-linux/lib/i18n.js`
   - 跨平台兼容

## 📦 发布流程

1. **更新版本号**
   ```json
   // opencode-i18n/config.json
   {
     "version": "5.5",
     "supportedCommit": "最新的commit hash"
   }
   ```

2. **测试验证**
   ```powershell
   # 1. 恢复纯净
   .\scripts\opencode\opencode.ps1
   选择 [R]

   # 2. 应用汉化
   选择 [2]

   # 3. 验证结果
   选择 [3]

   # 4. 测试运行
   opencode
   ```

3. **提交更改**
   ```powershell
   git add opencode-i18n/ scripts/
   git commit -m "chore(i18n): 更新汉化配置到 v5.5"
   git push
   ```

## 🔗 相关资源

- **原仓库**: https://github.com/anomalyco/opencode
- **问题反馈**: https://github.com/1186258278278/OpenCodeChineseTranslation/issues
- **CLI 工具**: https://docs.anthropic.com

---

> 最后更新: 2026-01-15
> 维护者: CodeCreator
