# Codes - 开发环境管理工具

[![Codes](https://img.shields.io/badge/codes-v2.0-cyan.svg)](https://gitee.com/QtCodeCreators/OpenCodeChineseTranslation)

**Codes** 是 OpenCode 中文汉化版项目的开发环境管理工具，提供组件安装、版本切换、环境诊断等功能。

---

## 功能特性

- 一键安装开发工具（Node.js、Bun、Git、Python、nvm）
- 编号安装支持，快速安装指定组件
- 自动检测并配置国内镜像
- 跨平台支持（Linux/macOS/Windows）
- Node.js 版本管理（支持 nvm）
- 永久环境变量配置
- 自动更新检测

---

## 快速安装

### Linux/macOS

```bash
curl -fsSL https://gitee.com/QtCodeCreators/OpenCodeChineseTranslation/raw/main/scripts/install.sh | bash
```

### Windows

```powershell
irm https://gitee.com/QtCodeCreators/OpenCodeChineseTranslation/raw/main/scripts/install.ps1 | iex
```

---

## 命令参考

### 基础命令

| 命令 | 说明 |
|------|------|
| `codes` | 交互菜单 - 显示图形菜单 |
| `codes doctor` | 环境诊断 - 检查所有工具状态 |
| `codes install` | 安装组件 - 安装缺失的工具 |
| `codes install [编号]` | 按编号安装 - 只安装指定组件 |
| `codes upgrade` | 升级组件 - 升级已安装的工具 |
| `codes node lts` | Node 管理 - 切换到 LTS |
| `codes node 22` | Node 管理 - 切换到 v22 |
| `codes claude` | 安装 Claude Code |
| `codes opencode` | 安装 OpenCode 汉化脚本 |
| `codes i18n` | 安装汉化管理工具 |
| `codes helper` | 启动智谱编码助手 |
| `codes env` | 显示环境变量 |
| `codes env-permanent` | 永久配置环境变量 |
| `codes update` | 检查并更新 Codes |
| `codes check-update` | 检查 Codes 新版本 |
| `codes --version` | 显示版本信息 |
| `codes --help` | 显示帮助信息 |

### 组件编号表

| 编号 | 组件 | 说明 |
|------|------|------|
| 1 | Node.js | JavaScript 运行时 |
| 2 | Bun | 快速 JavaScript 运行时 |
| 3 | Git | 版本控制工具 |
| 4 | Python | 编程语言 |
| 5 | nvm | Node 版本管理器 |
| 6 | coding-helper | 智谱编码助手 |

### 菜单选项

```
╔═══════════════════════════════════════════════╗
║           Codes - 开发环境管理工具               ║
╠═══════════════════════════════════════════════╣
║  [1] 环境诊断       - 检查所有工具状态           ║
║  [2] 安装组件       - 安装缺失的工具             ║
║  [3] 升级组件       - 升级已安装的工具             ║
║  [4] Node 管理     - 切换 Node.js 版本          ║
║  [5] Claude Code   - 安装 Claude Code          ║
║  [6] OpenCode      - 安装 OpenCode 汉化版       ║
║  [7] 汉化管理工具   - 安装汉化脚本                ║
║  [8] 智谱助手      - 启动 coding-helper        ║
║  [9] 环境变量       - 显示/导出环境变量            ║
║  [p] 永久配置      - 一键写入环境变量             ║
║  [u] 检查更新      - 检查 Codes 新版本          ║
║  [U] 更新 Codes    - 自动更新到最新版            ║
║  [0] 退出                                        ║
╚═══════════════════════════════════════════════╝
```

---

## 使用示例

```bash
# 诊断环境
codes doctor

# 安装所有缺失组件
codes install

# 只安装 Node.js
codes install 1

# 切换 Node.js 到 LTS
codes node lts

# 切换到指定版本
codes node 22

# 永久配置环境变量
codes env-permanent

# 检查更新
codes check-update

# 更新 Codes
codes update
```

---

## 文件说明

| 文件 | 说明 |
|------|------|
| `codes.sh` | Linux/macOS 核心脚本 |
| `codes.ps1` | Windows 核心脚本 |
| `install.sh` | Linux/macOS 安装脚本 |
| `install.ps1` | Windows 安装脚本 |

---

## 版本说明

Codes 使用**动态版本号**，格式为 `2.0.{提交数}`，每次提交自动递增。

- **主版本**: 2.0 - 重大功能变更
- **提交数**: Git 提交总数 - 确保版本唯一

例如：
- `v2.0.92` - 第 92 次提交
- `v2.0.100` - 第 100 次提交

---

## 相关链接

| 链接 | 说明 |
|------|------|
| [主项目](../../README.md) | OpenCode 中文汉化版 |
| [Gitee 仓库](https://gitee.com/QtCodeCreators/OpenCodeChineseTranslation) | 国内镜像 |
| [GitHub 仓库](https://github.com/1186258278/OpenCodeChineseTranslation) | GitHub 主页 |
