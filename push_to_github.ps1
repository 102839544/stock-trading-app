# 股票软件项目 - GitHub 同步脚本 (PowerShell)
# 使用方法：右键点击 -> 使用 PowerShell 运行

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "股票软件项目 - GitHub 同步脚本" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 设置工作目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# 步骤1：初始化 Git
Write-Host "[1/7] 初始化 Git 仓库..." -ForegroundColor Yellow
git init
git branch -M main

# 步骤2：添加文件
Write-Host ""
Write-Host "[2/7] 添加所有文件到 Git..." -ForegroundColor Yellow
git add .

# 步骤3：创建提交
Write-Host ""
Write-Host "[3/7] 创建首次提交..." -ForegroundColor Yellow
$gitCommitMessage = @"
初始提交：股票模拟交易软件 v1.0

功能特性：
- 用户注册/登录系统
- 实时股票数据（模拟）
- 市场行情展示
- 模拟交易功能
- 持仓管理
- 交易记录
- 数据持久化（SQLite）

技术栈：
- 后端：Node.js + Express + SQLite + Socket.IO
- 前端：HTML5 + CSS3 + JavaScript
"@

git commit -m $gitCommitMessage

# 步骤4：检查 GitHub CLI
Write-Host ""
Write-Host "[4/7] 检查 GitHub CLI..." -ForegroundColor Yellow
$ghAvailable = Get-Command gh -ErrorAction SilentlyContinue

if ($ghAvailable) {
    Write-Host "✅ GitHub CLI 已安装" -ForegroundColor Green
    Write-Host ""
    Write-Host "是否使用 GitHub CLI 创建仓库？(Y/N)" -ForegroundColor Cyan
    $useGH = Read-Host
    
    if ($useGH -eq "Y" -or $useGH -eq "y") {
        Write-Host ""
        Write-Host "[5/7] 使用 GitHub CLI 创建仓库..." -ForegroundColor Yellow
        gh repo create stock-trading-app --public --source=. --remote=origin --push
        
        Write-Host ""
        Write-Host "=============================================" -ForegroundColor Green
        Write-Host "✅ 完成！项目已成功同步到 GitHub" -ForegroundColor Green
        Write-Host "=============================================" -ForegroundColor Green
        pause
        exit
    }
}

# 步骤5：手动输入 GitHub 信息
Write-Host ""
Write-Host "[5/7] 请输入 GitHub 信息..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️ 重要提示：" -ForegroundColor Red
Write-Host "GitHub 已不支持密码推送，需要使用 Personal Access Token" -ForegroundColor Red
Write-Host "请访问 https://github.com/settings/tokens 生成 token" -ForegroundColor Red
Write-Host ""
Read-Host "按 Enter 键继续（如果已有 token 请直接继续）"

Write-Host ""
Write-Host "请输入您的 GitHub 用户名或邮箱：" -ForegroundColor Cyan
$githubUsername = Read-Host

Write-Host ""
Write-Host "请输入您的 GitHub 仓库名称（默认：stock-trading-app）：" -ForegroundColor Cyan
$repoName = Read-Host
if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "stock-trading-app"
}

# 步骤6：添加远程仓库
Write-Host ""
Write-Host "[6/7] 添加 GitHub 远程仓库..." -ForegroundColor Yellow
$gitRemoteUrl = "https://github.com/$githubUsername/$repoName.git"
Write-Host "远程仓库地址：$gitRemoteUrl" -ForegroundColor Gray

git remote add origin $gitRemoteUrl

# 步骤7：推送到 GitHub
Write-Host ""
Write-Host "[7/7] 推送到 GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "推送时请使用：" -ForegroundColor Yellow
Write-Host "  - Username: $githubUsername" -ForegroundColor White
Write-Host "  - Password: 您的 Personal Access Token（不是GitHub密码！）" -ForegroundColor White
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "✅ 完成！项目已成功同步到 GitHub" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "访问：https://github.com/$githubUsername/$repoName" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ 推送失败，可能的原因：" -ForegroundColor Red
    Write-Host "  1. 仓库不存在 - 请先在 GitHub 网站创建仓库" -ForegroundColor Yellow
    Write-Host "  2. 认证失败 - 请确保使用 Personal Access Token" -ForegroundColor Yellow
    Write-Host "  3. 远程仓库已存在 - 先运行：git remote remove origin" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "详细上传指南请查看：GITHUB_上传指南.md" -ForegroundColor Cyan
}

Write-Host ""
pause
