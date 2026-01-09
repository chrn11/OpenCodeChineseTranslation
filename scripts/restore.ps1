# ========================================
# OpenCode 恢复脚本
# ========================================

$ErrorActionPreference = "Stop"
$ErrorView = "NormalView"

# 配置路径
$SCRIPTS_DIR = $PSScriptRoot
$PACKAGE_DIR = "$SCRIPTS_DIR\..\opencode-zh-CN"
$I18N_DIR = "$SCRIPTS_DIR\..\opencode-i18n"
$BACKUP_DIR = "$SCRIPTS_DIR\..\backup"

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
    Write-Host "╔════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  恢复备份                              ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    Write-ColorOutput Yellow "⚠  警告：恢复将覆盖当前文件！"
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
        Copy-Item "$BackupPath\opencode-i18n.json" "$I18N_DIR\opencode-i18n.json" -Force
        Write-ColorOutput Green "  ✓ 汉化配置"
    }

    # 恢复 i18n 目录
    if (Test-Path "$BackupPath\opencode-i18n") {
        if (Test-Path "$I18N_DIR\opencode-i18n") {
            Remove-Item "$I18N_DIR\opencode-i18n" -Recurse -Force
        }
        Copy-Item "$BackupPath\opencode-i18n" "$I18N_DIR" -Recurse -Force
        Write-ColorOutput Green "  ✓ 汉化目录"
    }

    # 恢复主脚本
    if (Test-Path "$BackupPath\opencode-v3.ps1") {
        Copy-Item "$BackupPath\opencode-v3.ps1" "$SCRIPTS_DIR\opencode.ps1" -Force
        Write-ColorOutput Green "  ✓ 主脚本"
    }

    Write-Host ""
    Write-ColorOutput Green "✓ 恢复完成！"
    Write-Host ""
    Read-Host "按回车键继续"
}

# ========================================
# 主菜单
# ========================================

Show-Menu
