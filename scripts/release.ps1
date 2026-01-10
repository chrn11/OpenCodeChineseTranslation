# OpenCode 预编译版本打包脚本
# 用于将编译好的二进制文件打包成发布包

param(
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"

# 配置
$PROJECT_DIR = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$DIST_DIR = "$PROJECT_DIR\opencode-zh-CN\packages\opencode\dist"
$RELEASE_DIR = "$PROJECT_DIR\releases"
$OPencode_DIR = "$PROJECT_DIR\opencode-zh-CN\packages\opencode"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     OpenCode 预编译版本打包工具                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. 检查编译产物是否存在
if (-not (Test-Path $DIST_DIR)) {
    Write-Host "❌ 编译产物目录不存在: $DIST_DIR" -ForegroundColor Red
    Write-Host "   请先运行编译: opencodecmd build" -ForegroundColor Yellow
    exit 1
}

# 2. 创建发布目录
if (Test-Path $RELEASE_DIR) {
    Remove-Item $RELEASE_DIR -Recurse -Force
}
New-Item -ItemType Directory -Path $RELEASE_DIR -Force | Out-Null
Write-Host "✓ 发布目录: $RELEASE_DIR" -ForegroundColor Green

# 3. 生成编译信息
$buildInfo = @{
    buildTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    buildOS = [System.Environment]::OSVersion.Platform
    bunVersion = & bun --version 2>$null
    nodeVersion = & node --version 2>$null
    opencodeCommit = & git -C "$PROJECT_DIR\opencode-zh-CN" rev-parse HEAD 2>$null
    scriptCommit = & git -C $PROJECT_DIR rev-parse HEAD 2>$null
} | ConvertTo-Json -Depth 10

$buildInfo | Out-File "$RELEASE_DIR\build-info.json" -Encoding UTF8

# 4. 打包各平台版本
$platforms = @(
    @{Name = "windows-x64"; Input = "opencode-windows-x64"; Ext = "zip"},
    @{Name = "linux-x64"; Input = "opencode-linux-x64"; Ext = "tar.gz"},
    @{Name = "darwin-arm64"; Input = "opencode-darwin-arm64"; Ext = "tar.gz"},
    @{Name = "darwin-x64"; Input = "opencode-darwin-x64"; Ext = "tar.gz"}
)

Write-Host ""
Write-Host "正在打包预编译版本..." -ForegroundColor Cyan
Write-Host ""

foreach ($platform in $platforms) {
    $sourceDir = Join-Path $DIST_DIR $platform.Input
    $outputFile = Join-Path $RELEASE_DIR "opencode-$($platform.Name).$($platform.Ext)"

    if (-not (Test-Path $sourceDir)) {
        Write-Host "  ⊘ $($platform.Name) - 跳过（目录不存在）" -ForegroundColor DarkGray
        continue
    }

    Write-Host "  → $($platform.Name)..." -ForegroundColor Cyan -NoNewline

    try {
        if ($platform.Ext -eq "zip") {
            Compress-Archive -Path "$sourceDir\*" -DestinationPath $outputFile -Force
        } else {
            # 使用 tar.gz
            & tar -czf $outputFile -C $sourceDir .
        }

        # 计算文件大小和 SHA256
        $fileSize = (Get-Item $outputFile).Length
        $sha256 = (Get-FileHash -Path $outputFile -Algorithm SHA256).Hash

        Write-Host " ✓ $([math]::Round($fileSize/1MB, 2)) MB" -ForegroundColor Green
        Write-Host "    SHA256: $sha256" -ForegroundColor DarkGray
    } catch {
        Write-Host " ✗ 失败: $_" -ForegroundColor Red
    }
}

# 5. 生成 SHA256 校验文件
Write-Host ""
Write-Host "生成校验文件..." -ForegroundColor Cyan

$checksumFile = "$RELEASE_DIR\SHA256SUMS"
"" | Out-File $checksumFile -Encoding UTF8

Get-ChildItem -Path $RELEASE_DIR -File | Where-Object { $_.Name -match "\.(zip|tar\.gz)$" } | ForEach-Object {
    $hash = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash
    "$hash  $($_.Name)" | Out-File $checksumFile -Append -Encoding UTF8
}

Write-Host "✓ 校验文件: $checksumFile" -ForegroundColor Green

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                 打包完成！                                  ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  发布文件位置: $RELEASE_DIR" -ForegroundColor White
Write-Host "║                                                            ║" -ForegroundColor White
Write-Host "║  上传到 GitHub Releases:                                    ║" -ForegroundColor White
Write-Host "║    gh release create v<version> --notes RELEASE.md           ║" -ForegroundColor White
Write-Host "║    gh release upload v<version> releases/*.zip              ║" -ForegroundColor White
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
