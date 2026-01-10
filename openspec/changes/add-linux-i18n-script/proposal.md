# OpenCode Linux 汉化脚本提案

## 元信息

- **创建时间**: 2025-01-10
- **提案类型**: 新功能
- **优先级**: 中等
- **状态**: 待审核

## 变更原因

### 当前问题

1. OpenCode 汉化脚本 (`opencode.ps1`) 仅支持 Windows/PowerShell
2. Linux 用户无法使用汉化功能
3. 开发服务器、Docker 环境无法应用汉化

### 目标

创建 Linux 版本的汉化管理脚本，支持：
- OpenCode 源码更新检测
- 源码拉取
- 应用汉化
- 编译构建
- 汉化验证

### 收益

| 收益 | 说明 |
|------|------|
| 跨平台支持 | Windows + Linux 均可使用 |
| 统一配置 | 共用一套 JSON 翻译文件 |
| CI/CD 友好 | 支持在 Docker/服务器环境自动化 |
| 降低维护成本 | 配置文件只需维护一套 |

## 技术方案

### 目录结构

```
OpenCodeChineseTranslation/
├── opencode-i18n/          # ⭐ 通用汉化配置（共用）
│   ├── config.json         # 主配置
│   ├── dialogs/            # 对话框翻译
│   ├── routes/             # 路由翻译
│   ├── components/         # 组件翻译
│   └── common/             # 通用翻译
│
├── scripts/
│   ├── opencode/           # Windows 版本（已有）
│   │   └── opencode.ps1    # 读取 opencode-i18n
│   └── opencode-linux/     # Linux 版本（新建）
│       ├── opencode.js     # 主脚本
│       ├── package.json    # 依赖配置
│       ├── lib/            # 核心库
│       │   ├── env.js      # 环境检查
│       │   ├── git.js      # Git 操作
│       │   ├── i18n.js     # 汉化应用
│       │   ├── build.js    # 编译构建
│       │   └── version.js  # 版本检测
│       └── README.md       # 说明文档
│
└── opencode-zh-CN/         # OpenCode 源码（动态拉取）
```

### 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    opencode.js                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │                    CLI Parser                        │ │
│  │   update | apply | build | verify | full         │ │
│  └────────────────────────────────────────────────────┘ │
│                          ▼                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │                    Core Modules                     │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │ │
│  │  │  Env   │ │  Git   │ │  I18N  │ │ Build  │   │ │
│  │  │ Check  │ │  Pull  │ │ Apply │ │  Run  │   │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘   │ │
│  └────────────────────────────────────────────────────┘ │
│                          ▼                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │                 opencode-i18n/                      │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │ │
│  │  │dialogs/│ │routes/ │ │comps/  │ │common/ │   │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘   │ │
│  │           ↕  JSON 配置文件（通用）               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 功能模块

| 模块 | 功能 | 说明 |
|------|------|------|
| `env.js` | 环境检查 | Node.js / Bun / Git 检测 |
| `version.js` | 版本检测 | 脚本版本 + OpenCode 版本 |
| `git.js` | 源码管理 | git pull / commit 对比 |
| `i18n.js` | 汉化应用 | 读取 JSON → 文件替换 |
| `build.js` | 编译构建 | bun run build |
| `verify.js` | 汉化验证 | 覆盖率统计 |

### 命令行接口

```bash
# 交互菜单
node opencode.js

# 子命令
node opencode.js update    # 拉取最新源码
node opencode.js apply     # 应用汉化
node opencode.js build     # 编译构建
node opencode.js verify    # 验证汉化覆盖率
node opencode.js full      # 一键全流程
node opencode.js --version # 显示版本
```

### Codes 工具适配

| 平台 | 检测条件 | 汉化脚本 | 全局命令 |
|------|----------|----------|----------|
| Windows | PowerShell | `scripts/opencode/opencode.ps1` | `opencodecmd` |
| Linux | Bash | `scripts/opencode-linux/opencode.js` | `opencodecmd` |

```bash
# Codes 安装命令（跨平台）
codes opencode    # 自动检测系统，安装对应版本
codes i18n        # 安装汉化管理工具
```

### 配置文件格式

```json
{
  "version": "1.0.0",
  "opencode_commit": "abc123",
  "files": {
    "packages/opencode/src/acp/dialog.ts": {
      "type": "dialog",
      "replacements": [
        {"find": "Chat", "replace": "对话"},
        {"find": "New Chat", "replace": "新建对话"}
      ]
    }
  }
}
```

## 实施计划

### Phase 1: 基础框架
- [ ] 创建目录结构
- [ ] 初始化 package.json
- [ ] CLI 参数解析
- [ ] 环境检查模块

### Phase 2: 核心功能
- [ ] Git 操作模块
- [ ] 版本检测模块
- [ ] 汉化应用模块
- [ ] 编译构建模块

### Phase 3: 集成测试
- [ ] Docker 环境测试
- [ ] Codes 工具集成
- [ ] 文档更新

### Phase 4: 发布
- [ ] 版本发布
- [ ] README 更新
- [ ] 用户文档

## 文档更新

### 需要更新的文档

| 文档 | 更新内容 |
|------|----------|
| `README.md` | 添加 Linux 使用说明 |
| `scripts/codes/README.md` | 添加跨平台说明 |
| `docs/plans/linux-i18n.md` | 详细设计文档（新建） |

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Node.js 版本兼容 | 运行失败 | 指定 Node.js 版本范围 |
| 汉化配置变更 | 兼容性问题 | 保持 JSON 格式稳定 |
| 编译失败 | 无法生成产物 | 提供详细错误日志 |

## 验收标准

- [ ] Linux 环境可执行 `node opencode.js full` 完成全流程
- [ ] 汉化覆盖率与 Windows 版本一致
- [ ] Codes 工具可正常安装 Linux 版本
- [ ] 文档完整更新
