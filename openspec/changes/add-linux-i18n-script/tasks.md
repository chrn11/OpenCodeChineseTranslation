# OpenCode Linux 汉化脚本 - 任务清单

## 阶段 1: 基础框架

- [x] 创建 OpenSpec 提案
- [ ] 创建 `scripts/opencode-linux/` 目录
- [ ] 初始化 `package.json`
- [ ] 创建 `opencode.js` 主脚本框架
- [ ] 实现 CLI 参数解析
- [ ] 实现环境检查模块 `lib/env.js`

## 阶段 2: 核心功能

### 版本检测
- [ ] 实现脚本版本检测（基于 git 提交数）
- [ ] 实现 OpenCode 版本检测（commit 对比）
- [ ] 版本显示命令

### Git 操作
- [ ] 实现源码拉取功能
- [ ] 实现版本比对功能
- [ ] 错误处理与重试

### 汉化应用
- [ ] 读取 opencode-i18n JSON 配置
- [ ] 遍历源码文件
- [ ] 字符串替换逻辑
- [ ] 进度显示

### 编译构建
- [ ] 调用 `bun run build`
- [ ] 编译结果验证
- [ ] 错误输出

### 验证功能
- [ ] 汉化覆盖率统计
- [ ] 验证报告生成

## 阶段 3: 集成

### Codes 工具适配
- [ ] 修改 `install_opencode_i18n` 支持 Linux
- [ ] 添加平台检测逻辑
- [ ] 更新全局命令安装

### 文档更新
- [ ] 更新主 README.md
- [ ] 更新 codes/README.md
- [ ] 创建 opencode-linux/README.md

## 阶段 4: 测试与发布

### 测试
- [ ] 本地环境测试
- [ ] Docker 环境测试
- [ ] Codes 工具集成测试

### 发布
- [ ] 提交代码
- [ ] 推送到 GitHub/Gitee
- [ ] 版本标记
