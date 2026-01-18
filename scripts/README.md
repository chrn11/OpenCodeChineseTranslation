# OpenCode 汉化管理工具 v7.0

跨平台统一版本的 OpenCode 中文汉化管理工具。

## 功能特性

- **一键全流程**: 更新源码 → 应用汉化 → 验证 → 编译构建
- **源码管理**: 更新/恢复 OpenCode 源码
- **汉化操作**: 应用汉化配置、验证翻译覆盖率
- **编译构建**: 支持 Windows/macOS/Linux 三端编译
- **部署打包**: 全局命令部署、Release 打包

## 安装

```bash
cd C:\Data\PC\OpenCode\scripts
npm install
```

### 全局命令安装（推荐）

使用 `npm link` 可以将 `opencodenpm` 注册为全局命令，之后可以在任何目录运行：

```bash
# 1. 进入脚本目录
cd C:\Data\PC\OpenCode\scripts

# 2. 安装依赖
npm install

# 3. 链接为全局命令
npm link

# 4. 验证安装
opencodenpm --version
```

安装成功后，可以在任意目录直接运行：

```bash
# 启动交互式菜单
opencodenpm

# 或使用命令行模式
opencodenpm full
opencodenpm build
```

**卸载全局命令：**

```bash
npm unlink -g opencodenpm
```

## 使用方式

### 交互式菜单 (推荐)

```bash
npm start
# 或
node bin/opencodenpm
```

### 命令行模式

```bash
# 完整工作流
npm run full

# 单独命令
npm run update    # 更新源码
npm run apply     # 应用汉化
npm run verify    # 验证汉化
npm run build     # 编译构建
npm run deploy    # 部署命令
npm run package   # 打包三端
npm run launch    # 启动 OpenCode
npm run rollback  # 回滚备份
npm run env       # 检查环境
npm run config    # 显示配置
```

## 目录结构

```
scripts/
├── bin/           # 可执行入口
├── commands/      # 命令模块
│   ├── update.js    # 更新源码
│   ├── apply.js     # 应用汉化
│   ├── build.js     # 编译构建
│   ├── verify.js    # 验证汉化
│   ├── full.js      # 完整工作流
│   ├── launch.js    # 启动命令
│   ├── deploy.js    # 部署命令
│   ├── package.js   # 打包命令
│   ├── rollback.js  # 回滚命令
│   └── helper.js    # 智谱助手
├── core/          # 核心模块
│   ├── cli.js       # CLI 入口
│   ├── menu.js      # 交互菜单
│   ├── grid-menu.js # 网格菜单 TUI
│   ├── version.js   # 版本管理 (统一版本号)
│   ├── colors.js    # 颜色输出
│   ├── utils.js     # 工具函数
│   ├── git.js       # Git 操作
│   └── env.js       # 环境检查
├── platforms/     # 平台相关配置
└── package.json
```

## 版本管理

版本号统一在 `core/version.js` 中管理：

```javascript
const VERSION = '7.0.0';        // 完整版本号
const VERSION_SHORT = 'v7.0';   // 短版本号
const APP_NAME = 'OpenCode 汉化管理工具';
```

修改此文件即可同步更新所有显示版本号的地方。

## 系统要求

- Node.js >= 18.0.0
- Git
- Go 1.21+ (编译时需要)

## 更新日志

### v7.0.0 (2025-01)

- 重构 TUI 界面，使用原生 readline 实现网格菜单
- **限制最大宽度 72 字符**，防止宽屏终端排版错乱
- **居中显示**，专业美观的 Box Drawing 边框
- **丰富状态栏**：显示版本、路径、源码/汉化/编译状态
- **实时更新检测**：脚本更新、源码更新提醒
- 统一版本管理，集中在 `core/version.js`
- 修复终端图标兼容性问题（使用 ASCII 替代 emoji）
- 高对比度选中状态（白底黑字）
- 支持键盘方向键和 hjkl 导航

### v6.0.0

- 跨平台统一版本
- 支持三端编译打包
- 添加回滚备份功能

## License

MIT
