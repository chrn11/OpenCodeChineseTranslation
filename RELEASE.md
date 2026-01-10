# 预编译版本发布说明

## 编译环境

本次预编译版本的编译环境如下：

| 项目 | 版本 |
|------|------|
| 操作系统 | Windows 11 x64 |
| 构建工具 | Bun 1.3.5 |
| Node.js | v22.19.0 |
| OpenCode 源码 | commit e92a2ec9 |
| 编译时间 | 2025-01-11 |

## 支持的平台

预编译版本支持以下平台：

- **Windows**: x64, x64-baseline
- **Linux**: x64, x64-baseline, x64-musl, x64-baseline-musl, arm64, arm64-musl
- **macOS**: x64, x64-baseline, arm64

## 使用预编译版本

### Windows 用户

1. 下载 `opencode-windows-x64.zip`
2. 解压到任意目录
3. 直接运行 `opencode.exe`

### Linux/macOS 用户

1. 下载对应平台的压缩包
2. 解压：`tar -xzf opencode-xxx.tar.gz`
3. 添加执行权限：`chmod +x opencode`
4. 运行：`./opencode`

## 自己编译

如果预编译版本无法运行，或者需要修改源码，可以自行编译：

```bash
# 克隆仓库
git clone https://github.com/1186258278/OpenCodeChineseTranslation.git
cd OpenCodeChineseTranslation

# 运行安装脚本（会自动安装 Bun 和拉取源码）
.\scripts\install.ps1    # Windows
bash scripts/install.sh   # Linux/macOS

# 开始汉化
opencodecmd full
```

## 兼容性说明

- 预编译版本仅包含核心二进制文件
- 配置文件和汉化资源需要通过完整安装流程获取
- 预编译版本适用于快速体验，完整功能建议使用源码安装

## 文件校验

| 平台 | SHA256 |
|-------|--------|
| Windows x64 | (待生成) |
| Linux x64 | (待生成) |
| macOS arm64 | (待生成) |
