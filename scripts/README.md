# Scripts 目录

OpenCode 中文汉化版脚本集合，包含三个主要工具。

## 工具概览

| 工具 | 目录 | 说明 |
|------|------|------|
| [Codes](./codes/) | `scripts/codes/` | 开发环境管理工具 v1.1 |
| [Env](./env/) | `scripts/env/` | 一键环境初始化 v1.4 |
| [OpenCode](./opencode/) | `scripts/opencode/` | OpenCode 汉化工具 |

## 快速开始

### Linux/macOS

```bash
# 一键安装 Codes
curl -fsSL https://raw.githubusercontent.com/1186258278/OpenCodeChineseTranslation/main/scripts/install.sh | bash
```

### Windows

```powershell
# 一键安装 Codes
irm https://raw.githubusercontent.com/1186258278/OpenCodeChineseTranslation/main/scripts/install.ps1 | iex
```

## 国内镜像

```bash
# 使用 Gitee 镜像
curl -fsSL https://gitee.com/QtCodeCreators/OpenCodeChineseTranslation/raw/main/scripts/install.sh | bash
```

## 目录结构

```
scripts/
├── install.sh           # Linux/macOS 一键安装
├── install.ps1          # Windows 一键安装
│
├── env/                 # 环境初始化工具
│   ├── init.sh          # Linux/macOS 环境初始化
│   ├── init.ps1         # Windows 环境初始化
│   └── README.md        # 环境工具文档
│
├── codes/               # Codes 管理工具
│   ├── codes.sh         # Linux/macOS 核心
│   ├── codes.ps1        # Windows 核心
│   ├── install.sh       # Codes 安装 (Linux/macOS)
│   ├── install.ps1      # Codes 安装 (Windows)
│   └── README.md        # Codes 文档
│
└── opencode/            # OpenCode 汉化工具
    ├── opencode.ps1     # Windows 主脚本
    ├── init.ps1         # 初始化脚本
    └── README.md        # OpenCode 工具文档
```

## Codes 命令参考

| 命令 | 说明 |
|------|------|
| `codes doctor` | 环境诊断 |
| `codes install` | 安装组件 |
| `codes install [编号]` | 按编号安装 |
| `codes node lts` | 切换到 LTS |
| `codes --help` | 更多帮助 |

### 组件编号

| 编号 | 组件 |
|------|------|
| 1 | Node.js |
| 2 | Bun |
| 3 | Git |
| 4 | Python |
| 5 | nvm |
| 6 | coding-helper |

## 版本历史

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2025-01-10 | v1.1 | 目录重组，scripts/{env,codes,opencode}/ |
