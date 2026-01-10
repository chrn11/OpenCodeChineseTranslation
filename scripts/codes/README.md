# Codes - 开发环境管理工具

[![Codes](https://img.shields.io/badge/codes-v1.1.0-cyan.svg)](https://github.com/1186258278/OpenCodeChineseTranslation)

**Codes** 是一个跨平台开发环境管理工具，提供组件安装、版本切换、环境诊断等功能。

## 功能特性

- 一键安装开发工具（Node.js、Bun、Git、Python、nvm）
- 编号安装支持，快速安装指定组件
- 自动检测并配置国内镜像
- 跨平台支持（Linux/macOS/Windows）
- Node.js 版本管理（支持 nvm）

## 快速安装

### Linux/macOS

```bash
curl -fsSL https://raw.githubusercontent.com/1186258278/OpenCodeChineseTranslation/main/scripts/install.sh | bash
```

### Windows

```powershell
irm https://raw.githubusercontent.com/1186258278/OpenCodeChineseTranslation/main/scripts/install.ps1 | iex
```

## 命令参考

### 基础命令

| 命令 | 说明 |
|------|------|
| `codes doctor` | 环境诊断 - 检查所有工具状态 |
| `codes install` | 安装组件 - 安装缺失的工具 |
| `codes install [编号]` | 按编号安装 - 只安装指定组件 |
| `codes upgrade` | 升级组件 - 升级已安装的工具 |
| `codes node lts` | Node 管理 - 切换到 LTS |
| `codes node 22` | Node 管理 - 切换到 v22 |
| `codes helper` | 启动 coding-helper |
| `codes env` | 显示环境变量 |
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

# 启动 coding-helper
codes helper auth
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `codes.sh` | Linux/macOS 核心脚本 |
| `codes.ps1` | Windows 核心脚本 |
| `install.sh` | Linux/macOS 安装脚本 |
| `install.ps1` | Windows 安装脚本 |

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.1.0 | 2025-01-10 | 编号安装、自包含设计、Node 版本管理 |
| v1.0.0 | 2025-01-09 | 初始版本 |
