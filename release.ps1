# OpenCode 发版脚本
# 用法: .\release.ps1 -Version 8.3.0

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

# 验证版本格式
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Error "版本号格式错误! 请使用 x.y.z 格式 (例如 8.3.0)"
    exit 1
}

$FullVersion = "v$Version"
Write-Host "🚀 开始准备发布 $FullVersion ..." -ForegroundColor Cyan

# 1. 更新 cli-go/internal/core/version.go
$VersionFile = "cli-go/internal/core/version.go"
Write-Host "Updating $VersionFile..."
(Get-Content $VersionFile) -replace 'VERSION = ".*?"', "VERSION = `"$Version`"" | Set-Content $VersionFile

# 2. 更新 install.ps1
$InstallPs1 = "install.ps1"
Write-Host "Updating $InstallPs1..."
(Get-Content $InstallPs1) -replace 'v\d+\.\d+\.\d+', "$FullVersion" | Set-Content $InstallPs1

# 3. 更新 install.sh
$InstallSh = "install.sh"
Write-Host "Updating $InstallSh..."
(Get-Content $InstallSh) -replace 'v\d+\.\d+\.\d+', "$FullVersion" | Set-Content $InstallSh

# 4. 更新 docs/index.html
$DocsFile = "docs/index.html"
Write-Host "Updating $DocsFile..."
# 更新显示的版本号
$Content = Get-Content $DocsFile
$Content = $Content -replace 'id="latest-version">v.*?<', "id=`"latest-version`">$FullVersion<"
$Content = $Content -replace 'id="dash-version">v.*?<', "id=`"dash-version`">$FullVersion<"
# 更新 fallback 数据中的版本号
$Content = $Content -replace "tag_name: 'v.*?'", "tag_name: '$FullVersion'"
# 更新 fallback 数据中的下载链接
$Content = $Content -replace "download/v.*?/", "download/$FullVersion/"
$Content | Set-Content $DocsFile

Write-Host "`n✅ 版本号替换完成!" -ForegroundColor Green
Write-Host "请执行以下后续步骤:" -ForegroundColor Yellow
Write-Host "1. 手动更新 CHANGELOG.md"
Write-Host "2. 运行: git add ."
Write-Host "3. 运行: git commit -m `"chore: release $FullVersion`""
Write-Host "4. 运行: git tag $FullVersion"
Write-Host "5. 运行: git push origin main --tags"
