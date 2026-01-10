# 开发环境管理工具

[![Codes](https://img.shields.io/badge/codes-v1.0.0-cyan.svg)](https://github.com/1186258278/OpenCodeChineseTranslation)

Codes 是一个全平台的开发环境管理工具，支持 Linux、macOS 和 Windows。

## 一键安装

### Linux / macOS

```bash
curl -fsSL https://raw.githubusercontent.com/1186258278/OpenCodeChineseTranslation/main/scripts/install.sh | bash
```

或使用 wget：

```bash
wget -qO- https://raw.githubusercontent.com/1186258278/OpenCodeChineseTranslation/main/scripts/install.sh | bash
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/1186258278/OpenCodeChineseTranslation/main/scripts/install-codes.ps1 | iex
```

## 安装后使用

```bash
# 使环境变量生效
source ~/.bashrc   # Linux/macOS
# 或重启终端

# 查看环境状态
codes doctor

# 显示帮助
codes --help
```

## 功能命令

| 命令 | 说明 |
|------|------|
| `codes doctor` | 环境诊断 - 检查所有工具状态 |
| `codes install` | 安装组件 - 安装缺失的工具 |
| `codes upgrade` | 升级组件 - 升级已安装的工具 |
| `codes node lts` | Node 管理 - 切换到 LTS 版本 |
| `codes node 22` | Node 管理 - 切换到 v22 |
| `codes helper` | 启动 coding-helper |
| `codes env` | 显示环境变量 |
| `codes --help` | 显示帮助信息 |

## 安装的组件

运行 `codes install` 会自动安装：

- **Node.js** - 通过 nvm 安装最新 LTS 版本
- **Bun** - 高性能 JavaScript 运行时
- **Git** - 版本控制系统
- **Python** - Python 3 开发环境（可选）
- **coding-helper** - 智谱 AI 编码助手（可选）

## 手动安装

如果你想要手动控制安装过程：

```bash
# 克隆仓库
git clone https://github.com/1186258278/OpenCodeChineseTranslation.git
cd OpenCodeChineseTranslation/scripts

# 运行安装脚本
bash init-dev-env.sh

# 或仅安装 codes 工具
bash install-codes.sh
```

## 命令示例

```bash
# 诊断环境
codes doctor

# 安装缺失的组件
codes install

# 升级所有组件
codes upgrade

# 切换 Node.js 版本
codes node lts     # 切换到 LTS
codes node 20      # 切换到 v20
codes node 22      # 切换到 v22

# 使用 coding-helper
codes helper auth
codes helper lang set zh_CN

# 查看环境变量
codes env
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `init-dev-env.sh` | Linux/macOS 完整环境初始化脚本 |
| `init-dev-env.ps1` | Windows PowerShell 完整环境初始化脚本 |
| `codes.sh` | Linux/macOS codes 主脚本 |
| `codes.ps1` | Windows codes 主脚本 |
| `install-codes.sh` | Linux/macOS codes 安装脚本 |
| `install-codes.ps1` | Windows codes 安装脚本 |
| `install.sh` | 一键安装脚本（从 GitHub 下载） |

## 系统要求

- **Linux**: Ubuntu 18.04+, CentOS 7+, Debian 9+, Arch Linux 等
- **macOS**: macOS 10.15+
- **Windows**: Windows 10/11 with PowerShell 5.1+

## 常见问题

### 命令找不到？

安装后需要重新加载配置：

```bash
source ~/.bashrc
```

### coding-helper 命令不可用？

确保 npm 全局安装目录在 PATH 中：

```bash
codes env
```

### 权限问题

某些操作需要 sudo 权限，脚本会自动处理。

## 许可证

MIT License
