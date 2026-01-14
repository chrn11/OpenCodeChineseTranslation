# OpenCode 预编译版本打包脚本
# 用于将编译好的二进制文件打包成发布包（含压缩）

param(
    [switch]$SkipBuild = $false,
    [switch]$BinariesOnly = $false
)

$ErrorActionPreference = "Stop"

# 配置
$PROJECT_DIR = Split-Path -Parent $PSScriptRoot
$DIST_DIR = "$PROJECT_DIR\opencode-zh-CN\packages\opencode\dist"
$RELEASE_DIR = "$PROJECT_DIR\releases"
$I18N_DIR = "$PROJECT_DIR\opencode-i18n"

# 获取版本信息
function Get-VersionInfo {
    # 1. 汉化脚本版本
    $scriptVersion = "5.6"

    # 2. OpenCode 源码版本
    $packageJson = "$PROJECT_DIR\opencode-zh-CN\packages\opencode\package.json"
    if (Test-Path $packageJson) {
        $opencodeVersion = (Get-Content $packageJson | ConvertFrom-Json).version
    } else {
        $opencodeVersion = "unknown"
    }

    # 3. 汉化配置版本（从 opencode-i18n/config.json）
    $configJson = "$I18N_DIR\config.json"
    if (Test-Path $configJson) {
        $i18nVersion = (Get-Content $configJson | ConvertFrom-Json).version
    } else {
        $i18nVersion = "unknown"
    }

    # 4. 源码 commit
    $opencodeCommit = git -C "$PROJECT_DIR\opencode-zh-CN" rev-parse --short HEAD 2>$null

    # 5. 汉化脚本 commit
    $scriptCommit = git -C $PROJECT_DIR rev-parse --short HEAD 2>$null

    # 6. 构建版本号
    $buildVersion = "v$scriptVersion-i18n$i18nVersion-opencode$opencodeVersion"

    return @{
        scriptVersion = $scriptVersion
        opencodeVersion = $opencodeVersion
        i18nVersion = $i18nVersion
        opencodeCommit = $opencodeCommit
        scriptCommit = $scriptCommit
        buildVersion = $buildVersion
    }
}

# 创建压缩包（使用 tar）
function Create-Archive {
    param(
        [string]$SourcePath,
        [string]$OutputPath,
        [string]$Format = "zip"  # zip or tar.gz
    )

    try {
        if ($Format -eq "tar.gz") {
            # 使用 tar 创建 .tar.gz（需要 Git Bash 或 WSL）
            $tarPath = Get-Command tar -ErrorAction SilentlyContinue
            if ($tarPath) {
                & tar -czf $OutputPath -C (Split-Path $SourcePath) (Split-Path $SourcePath -Leaf)
                return $true
            } else {
                # 回退到 PowerShell Compress-Archive
                Compress-Archive -Path $SourcePath -DestinationPath "$OutputPath.zip" -Force
                Move-Item "$OutputPath.zip" $OutputPath -Force
                return $true
            }
        } else {
            # Windows 使用 zip
            Compress-Archive -Path $SourcePath -DestinationPath $OutputPath -Force
            return $true
        }
    } catch {
        Write-Host "    警告: 压缩失败，保留原文件: $_" -ForegroundColor Yellow
        return $false
    }
}

# 创建发布目录
if (-not (Test-Path $RELEASE_DIR)) {
    New-Item -ItemType Directory -Path $RELEASE_DIR -Force | Out-Null
}

# 清理旧文件（除版本文件）
Get-ChildItem -Path $RELEASE_DIR -File | Where-Object {
    $_.Name -notin @('build-info.json', 'SHA256SUMS', 'README.md')
} | Remove-Item -Force

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     OpenCode 预编译版本打包工具 (含压缩)                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 检查编译产物
if (-not (Test-Path $DIST_DIR)) {
    Write-Host "❌ 编译产物目录不存在: $DIST_DIR" -ForegroundColor Red
    Write-Host "   请先运行: .\scripts\workflow.ps1" -ForegroundColor Yellow
    exit 1
}

# 获取版本信息
$versionInfo = Get-VersionInfo

Write-Host "版本信息:" -ForegroundColor Yellow
Write-Host "  汉化脚本: v$($versionInfo.scriptVersion)" -ForegroundColor Gray
Write-Host "  汉化配置: v$($versionInfo.i18nVersion)" -ForegroundColor Gray
Write-Host "  OpenCode: v$($versionInfo.opencodeVersion)" -ForegroundColor Gray
Write-Host "  源码提交: $($versionInfo.opencodeCommit)" -ForegroundColor Gray
Write-Host "  脚本提交: $($versionInfo.scriptCommit)" -ForegroundColor Gray
Write-Host "  构建版本: $($versionInfo.buildVersion)" -ForegroundColor Gray
Write-Host ""

# 生成 build-info.json
$buildInfo = @{
    version = $versionInfo.buildVersion
    scriptVersion = $versionInfo.scriptVersion
    opencodeVersion = $versionInfo.opencodeVersion
    i18nVersion = $versionInfo.i18nVersion
    opencodeCommit = $versionInfo.opencodeCommit
    scriptCommit = $versionInfo.scriptCommit
    buildTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    buildOS = [System.Environment]::OSVersion.Platform
    bunVersion = & bun --version 2>$null
    nodeVersion = & node --version 2>$null
} | ConvertTo-Json -Depth 10

$buildInfo | Out-File "$RELEASE_DIR\build-info.json" -Encoding UTF8

# 定义平台配置
$baseName = "opencode-$($versionInfo.buildVersion)"
$platforms = @(
    @{Name = "windows-x64"; Source = "opencode-windows-x64"; Binary = "bin\opencode.exe"; Ext = "exe"; ArchiveExt = "zip"},
    @{Name = "linux-x64"; Source = "opencode-linux-x64"; Binary = "bin/opencode"; Ext = ""; ArchiveExt = "tar.gz"},
    @{Name = "darwin-arm64"; Source = "opencode-darwin-arm64"; Binary = "bin/opencode"; Ext = ""; ArchiveExt = "tar.gz"},
    @{Name = "darwin-x64"; Source = "opencode-darwin-x64"; Binary = "bin/opencode"; Ext = ""; ArchiveExt = "tar.gz"}
)

Write-Host "正在打包预编译版本..." -ForegroundColor Cyan
Write-Host ""

$hashes = @()
$releaseFiles = @()

foreach ($platform in $platforms) {
    $sourceDir = Join-Path $DIST_DIR $platform.Source
    $binaryPath = Join-Path $sourceDir $platform.Binary

    if (-not (Test-Path $binaryPath)) {
        Write-Host "  ⊘ $($platform.Name) - 跳过（文件不存在）" -ForegroundColor DarkGray
        continue
    }

    # 输出文件名带版本号
    $outputName = "$baseName-$($platform.Name)"
    if ($platform.Ext) {
        $outputName += ".$($platform.Ext)"
    }
    $outputFile = Join-Path $RELEASE_DIR $outputName

    Write-Host "  → $($platform.Name)..." -ForegroundColor Cyan -NoNewline

    try {
        # 1. 复制二进制文件（可选，保留原版）
        if (-not $BinariesOnly) {
            Copy-Item -Path $binaryPath -Destination $outputFile -Force
            $fileSize = (Get-Item $outputFile).Length
            $sizeMB = [math]::Round($fileSize / 1MB, 2)
            Write-Host " [$sizeMB MB]" -ForegroundColor DarkGray -NoNewline
        }

        # 2. 创建压缩包
        $archiveName = "$baseName-$($platform.Name).$($platform.ArchiveExt)"
        $archivePath = Join-Path $RELEASE_DIR $archiveName

        # 创建临时目录用于打包
        $tempDir = Join-Path $env:TEMP "opencode-pack-$($platform.Name)"
        if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

        # 复制整个编译产物目录到临时目录
        Copy-Item -Path $sourceDir\* -Destination $tempDir -Recurse -Force

        # 创建压缩包
        if ($platform.ArchiveExt -eq "zip") {
            Compress-Archive -Path "$tempDir\*" -DestinationPath $archivePath -Force
        } else {
            # 使用 tar 创建 .tar.gz
            $tarCmd = Get-Command tar -ErrorAction SilentlyContinue
            if ($tarCmd) {
                # 在 temp 目录的同级创建打包
                $tempParent = Split-Path $tempDir -Parent
                $tempFolderName = Split-Path $tempDir -Leaf
                Push-Location $tempParent
                & tar -czf $archivePath $tempFolderName
                Pop-Location
            } else {
                Write-Host " [tar不可用，跳过压缩]" -ForegroundColor Yellow
                Remove-Item -Recurse -Force $tempDir
                continue
            }
        }

        # 清理临时目录
        Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue

        # 检查压缩包是否创建成功
        if (Test-Path $archivePath) {
            $archiveSize = (Get-Item $archivePath).Length
            $archiveSizeMB = [math]::Round($archiveSize / 1MB, 2)
            Write-Host " → 压缩: $archiveSizeMB MB" -ForegroundColor Green

            # 计算 SHA256（压缩包）
            $sha256 = (Get-FileHash -Path $archivePath -Algorithm SHA256).Hash
            $hashes += "$sha256  $archiveName"
            $releaseFiles += @{
                Name = $archiveName
                Platform = $platform.Name
                Size = $archiveSizeMB
                SHA256 = $sha256
            }
        } else {
            Write-Host " → 压缩失败" -ForegroundColor Red
        }

    } catch {
        Write-Host " ✗ 失败: $_" -ForegroundColor Red
    }
}

# 生成 SHA256SUMS（只包含压缩包）
Write-Host ""
Write-Host "生成校验文件..." -ForegroundColor Cyan

$checksumFile = "$RELEASE_DIR\SHA256SUMS"
if (Test-Path $checksumFile) { Remove-Item $checksumFile -Force }

foreach ($hash in $hashes) {
    $hash | Out-File $checksumFile -Append -Encoding UTF8
}

Write-Host "✓ 校验文件: $checksumFile" -ForegroundColor Green

# 生成 releases/README.md
$readmeContent = @"
# OpenCode 中文汉化版 - $($versionInfo.buildVersion)

## 版本信息

| 项目 | 版本 |
|------|------|
| 汉化脚本 | v$($versionInfo.scriptVersion) |
| 汉化配置 | v$($versionInfo.i18nVersion) |
| OpenCode | v$($versionInfo.opencodeVersion) |
| 源码提交 | $($versionInfo.opencodeCommit) |
| 脚本提交 | $($versionInfo.scriptCommit) |
| 构建时间 | $($versionInfo.buildTime) |

## 下载文件

压缩包（推荐下载）：

| 文件 | 平台 | 大小 | 说明 |
|------|------|------|------|
$($releaseFiles | ForEach-Object {
    "| \`$($_.Name)\` | $($_.Platform) | $($_.Size) MB | 下载后解压即可 |"
}) | Out-String

## 使用方法

### Windows

\`\`\`powershell
# 1. 下载 .zip 文件
# 2. 解压到任意目录
# 3. 运行 opencode.exe
.\opencode.exe
\`\`\`

### Linux

\`\`\`bash
# 1. 下载 .tar.gz 文件
# 2. 解压
tar -xzf $baseName-linux-x64.tar.gz
# 3. 添加执行权限并运行
cd opencode-linux-x64
chmod +x bin/opencode
./bin/opencode
\`\`\`

### macOS (Apple Silicon)

\`\`\`bash
# 1. 下载 darwin-arm64 .tar.gz 文件
# 2. 解压
tar -xzf $baseName-darwin-arm64.tar.gz
# 3. 运行
cd opencode-darwin-arm64
./bin/opencode
\`\`\`

### macOS (Intel)

\`\`\`bash
# 1. 下载 darwin-x64 .tar.gz 文件
# 2. 解压
tar -xzf $baseName-darwin-x64.tar.gz
# 3. 运行
cd opencode-darwin-x64
./bin/opencode
\`\`\`

## 校验

使用 SHA256SUMS 文件验证下载完整性：

\`\`\`bash
# Linux/macOS
sha256sum -c SHA256SUMS

# Windows PowerShell
Get-FileHash *.zip -Algorithm SHA256
# 对比输出与 SHA256SUMS 文件中的值
\`\`\`

## 版本说明

**$($versionInfo.buildVersion)**

- OpenCode 官方版本: $($versionInfo.opencodeVersion)
- 汉化配置版本: $($versionInfo.i18nVersion)
- 汉化脚本版本: $($versionInfo.scriptVersion)

## 问题反馈

- [GitHub Issues](https://github.com/1186258278/OpenCodeChineseTranslation/issues)
- [Gitee Issues](https://gitee.com/QtCodeCreators/OpenCodeChineseTranslation/issues)
"@

$readmeContent | Out-File "$RELEASE_DIR\README.md" -Encoding UTF8

# 统计信息
$totalSize = 0
foreach ($file in $releaseFiles) {
    $totalSize += $file.Size
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                 打包完成！                                  ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  发布文件: $RELEASE_DIR" -ForegroundColor White
Write-Host "║                                                            ║" -ForegroundColor White
Write-Host "║  版本: $($versionInfo.buildVersion)" -ForegroundColor Cyan
Write-Host "║  压缩包: $($releaseFiles.Count) 个" -ForegroundColor Green
Write-Host "║  总大小: $([math]::Round($totalSize, 1)) MB" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor White
Write-Host "║  上传到 GitHub Releases:                                    ║" -ForegroundColor White
Write-Host "║    https://github.com/1186258278/OpenCodeChineseTranslation/releases" -ForegroundColor White
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
