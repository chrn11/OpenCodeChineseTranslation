# ========================================
# Codes 一键安装脚本 (Windows)
# 使用方式: irm https://raw.githubusercontent.com/1186258278/OpenCodeChineseTranslation/main/scripts/install.ps1 | iex
# ========================================

$ErrorActionPreference = "Stop"
$REPO = "1186258278/OpenCodeChineseTranslation"
$BRANCH = "main"
$REPO_GITEE = "QtCodeCreators/OpenCodeChineseTranslation"
$LIB_DIR = "$env:ProgramData\codes"
$BIN_DIR = "$env:LOCALAPPDATA\Microsoft\WindowsApps"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Codes 一键安装                                           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 创建库目录
Write-Host "→ 创建安装目录..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "$LIB_DIR" -Force | Out-Null

# 下载脚本（GitHub 失败则尝试 Gitee）
Write-Host "→ 下载 codes.ps1..." -ForegroundColor Cyan

# GitHub 源
$GITHUB_URL = "https://raw.githubusercontent.com/$REPO/$BRANCH/scripts/codes/codes.ps1"
# Gitee 备用源
$GITEE_URL = "https://gitee.com/$REPO_GITEE/raw/main/scripts/codes/codes.ps1"

$downloaded = $false
$scriptPath = "$LIB_DIR\codes.ps1"

# 尝试 GitHub
try {
    Invoke-WebRequest -Uri $GITHUB_URL -OutFile $scriptPath -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  ✓ 从 GitHub 下载成功" -ForegroundColor Green
    $downloaded = $true
} catch {
    # 尝试 Gitee
    try {
        Invoke-WebRequest -Uri $GITEE_URL -OutFile $scriptPath -TimeoutSec 10 -ErrorAction Stop
        Write-Host "  ✓ 从 Gitee 下载成功（备用源）" -ForegroundColor Green
        $downloaded = $true
    } catch {
        Write-Host "  ✗ 下载失败，请检查网络" -ForegroundColor Red
        Write-Host ""
        Write-Host "手动下载链接:" -ForegroundColor Yellow
        Write-Host "  GitHub: $GITHUB_URL" -ForegroundColor White
        Write-Host "  Gitee:  $GITEE_URL" -ForegroundColor White
        exit 1
    }
}

# 创建 wrapper 脚本
Write-Host "→ 创建 codes 命令..." -ForegroundColor Cyan

# 创建 wrapper bat
$wrapperBat = @"
@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "$scriptPath" %*
"@
$wrapperBat | Out-File "$BIN_DIR\codes.bat" -Encoding ASCII

# 创建 wrapper ps1
$wrapperPs1 = @"
# Codes wrapper
& "$scriptPath" @args
"@
$wrapperPs1 | Out-File "$BIN_DIR\codes.ps1" -Encoding UTF8

Write-Host ""
Write-Host "✓ 安装完成!" -ForegroundColor Green
Write-Host ""
Write-Host "使用方法:" -ForegroundColor Cyan
Write-Host "  codes doctor       # 环境诊断" -ForegroundColor White
Write-Host "  codes install      # 安装组件" -ForegroundColor White
Write-Host "  codes install 1    # 只安装 Node.js" -ForegroundColor White
Write-Host "  codes node lts     # 切换到 LTS" -ForegroundColor White
Write-Host "  codes --help       # 更多帮助" -ForegroundColor White
Write-Host ""
