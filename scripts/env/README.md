# Env - 开发环境初始化工具

**Env** 是一个一键式开发环境初始化工具，自动检测系统并安装所有必要的开发工具。

## 功能特性

- 全平台支持（Linux/macOS/Windows）
- 智能检测系统类型和包管理器
- 多备用安装方案
- 自动配置国内镜像

## 使用方法

### Linux/macOS

```bash
# 直接运行初始化脚本
bash scripts/env/init.sh

# 或下载后运行
curl -fsSL https://raw.githubusercontent.com/1186258278/OpenCodeChineseTranslation/main/scripts/env/init.sh | bash
```

### Windows

```powershell
# 直接运行初始化脚本
.\scripts\env\init.ps1
```

## 支持的组件

### 基础工具

| 组件 | 说明 |
|------|------|
| Git | 版本控制工具 |
| Node.js + npm | JavaScript 运行时 |
| Bun | 快速 JavaScript 运行时 |
| Python | 编程语言 |
| Docker | 容器技术 |
| nvm | Node 版本管理器 |

### AI 工具

| 组件 | 说明 |
|------|------|
| @z_ai/coding-helper | 智谱编码助手 |
| OpenCode | AI 编程代理（需单独安装） |

## 系统支持

| 系统 | 包管理器 | 状态 |
|------|----------|------|
| Ubuntu/Debian | apt | 全支持 |
| CentOS/RHEL | yum/dnf | 全支持 |
| macOS | brew | 全支持 |
| Arch Linux | pacman | 全支持 |
| Windows | winget/scoop/choco | 全支持 |

## 文件说明

| 文件 | 说明 |
|------|------|
| `init.sh` | Linux/macOS 初始化脚本 |
| `init.ps1` | Windows 初始化脚本 |

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.4 | 2025-01-10 | 目录重组，移至 scripts/env/ |
| v1.3 | 2025-01-09 | 添加 Bun 备用安装方案 |
| v1.2 | 2025-01-08 | 改进 yum 系统支持 |
| v1.1 | 2025-01-07 | 添加 Docker 支持 |
| v1.0 | 2025-01-06 | 初始版本 |
