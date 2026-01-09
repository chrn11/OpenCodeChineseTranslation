# ========================================
# OpenCode 备份脚本
# ========================================

$ErrorActionPreference = "Stop"
$ErrorView = "NormalView"

# 配置路径
$SCRIPTS_DIR = $PSScriptRoot
$PACKAGE_DIR = "$SCRIPTS_DIR\..\opencode-zh-CN"
$BACKUP_DIR = "$SCRIPTS_DIR\..\backup"

# ========================================
# 功能：创建完整备份
# ========================================

function Backup-Current {
    param(
        [string]$Name
    )

    Write-Host ""
    Write-Host "╔══════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  创建备份                              ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    # 获取版本信息
    $versionInfo = Get-VersionInfo
    $versionTag = if ($versionInfo.HasGit) {
        "v$($versionInfo.LocalCommit)"
    } else {
        "no-git"
    }

    # 时间戳
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

    # 备份目录
    $backupPath = "$BACKUP_DIR\$timestamp`_$versionTag"

    Write-ColorOutput Cyan "备份名称: $Name"
    Write-ColorOutput Cyan "版本: $versionTag"
    Write-ColorOutput Cyan "路径: $backupPath"
    Write-Host ""

    # 创建备份目录
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

    # 1. 备份汉化配置
    if (Test-Path "$SCRIPTS_DIR\opencode-i18n.json") {
        Copy-Item "$SCRIPTS_DIR\opencode-i18n.json" "$backupPath\opencode-i18n.json" -Force
        Write-ColorOutput Green "  ✓ 汉化配置"
    }

    # 2. 备份 i18n 目录
    if (Test-Path "$SCRIPTS_DIR\opencode-i18n") {
        Copy-Item "$SCRIPTS_DIR\opencode-i18n" "$backupPath\opencode-i18n" -Recurse -Force
        Write-ColorOutput Green "  ✓ 汉化目录"
    }

    # 3. 备份主脚本
    if (Test-Path "$SCRIPTS_DIR\opencode-v3.ps1") {
        Copy-Item "$SCRIPTS_DIR\opencode-v3.ps1" "$backupPath\opencode-v3.ps1" -Force
        Write-ColorOutput Green "  ✓ 主脚本"
    }

    # 4. 创建版本文件
    $versionFile = "$backupPath\version.txt"
    "v$versionTag - $timestamp" | Set-Content $versionFile -Encoding UTF8

    Write-Host ""
    Write-ColorOutput Green "✓ 备份完成！"
    Write-Host ""
    Write-ColorOutput Yellow "备份位置: $backupPath"
    Write-Host ""
}

# ========================================
# 功能：列出所有备份
# ========================================

function List-Backups {
    Write-Host ""
    Write-Host "╔══════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  可用备份                              ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    if (!(Test-Path $BACKUP_DIR)) {
        Write-ColorOutput Red "备份目录不存在"
        Write-Host ""
        Read-Host "按回车键继续"
        return
    }

    $backups = Get-ChildItem $BACKUP_DIR -Directory -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending

    if (!$backups) {
        Write-ColorOutput Yellow "没有找到备份"
        Write-Host ""
        Read-Host "按回车键继续"
        return
    }

    Write-ColorOutput Cyan "找到 $($backups.Count) 个备份："
    Write-Host ""

    for ($i = 0; $i -lt $backups.Count; $i++) {
        $b = $backups[$i]
        $versionFile = "$($b.FullName)\version.txt"
        $info = if (Test-Path $versionFile) {
            $lines = Get-Content $versionFile -First 2 -ErrorAction SilentlyContinue
            $lines[0]
        } else {
            $b.Name
        }

        Write-ColorOutput Cyan "  [$($i+1)] $info"
    }

    Write-Host ""
    Read-Host "按回车键继续"
}

# ========================================
# 功能：恢复备份
# ========================================

function Restore-Backup {
    param(
        [string]$BackupPath
    )

    if (!(Test-Path $BackupPath)) {
        Write-ColorOutput Red "备份不存在: $BackupPath"
        Write-Host ""
        Read-Host "按回车键继续"
        return
    }

    Write-Host ""
    Write-Host "╔══════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  恢复备份                              ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    Write-ColorOutput Yellow "⚠ 警告：恢复将覆盖当前文件！"
    Write-Host ""
    Read-Host "确认？(y/N): " -ForegroundColor Yellow

    if ($Host.UI.RawUI.ReadKeyCharacter() -ne "y" -and $Host.UI.RawUI.ReadKeyCharacter() -ne "Y") {
        Write-ColorOutput Yellow "已取消"
        Write-Host ""
        Read-Host "按回车键继续"
        return
    }

    Write-Host ""
    Write-ColorOutput Cyan "正在恢复..."
    Write-Host ""

    # 恢复汉化配置
    if (Test-Path "$BackupPath\opencode-i18n.json") {
        Copy-Item "$BackupPath\opencode-i18n.json" "$SCRIPTS_DIR\opencode-i18n.json" -Force
        Write-ColorOutput Green "  ✓ 汉化配置"
    }

    # 恢复 i18n 目录
    if (Test-Path "$BackupPath\opencode-i18n") {
        if (Test-Path "$SCRIPTS_DIR\opencode-i18n") {
            Remove-Item "$SCRIPTS_DIR\opencode-i18n" -Recurse -Force
        }
        Copy-Item "$BackupPath\opencode-i18n" "$SCRIPTS_DIR\opencode-i18n" -Recurse -Force
        Write-ColorOutput Green "  ✓ 汉化目录"
    }

    # 恢复主脚本
    if (Test-Path "$BackupPath\opencode-v3.ps1") {
        Copy-Item "$BackupPath\opencode-v3.ps1" "$SCRIPTS_DIR\opencode-v3.ps1" -Force
        Write-ColorOutput Green "  ✓ 主脚本"
    }

    Write-Host ""
    Write-ColorOutput Green "✓ 恢复完成！"
    Write-Host ""
    Read-Host "按回车键继续"
}
