@echo off
chcp 65001 >nul
echo ================================================
echo 股票软件项目 - GitHub 同步脚本
echo ================================================
echo.

cd /d "%~dp0"

echo [1/6] 初始化 Git 仓库...
git init
git branch -M main

echo.
echo [2/6] 添加所有文件到 Git...
git add .

echo.
echo [3/6] 创建首次提交...
git commit -m "初始提交：股票模拟交易软件 v1.0

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
"

echo.
echo [4/6] 创建 GitHub 仓库...
echo 请注意：需要使用 GitHub CLI 或手动创建仓库
echo.
echo 方式1：使用 GitHub CLI（如果已安装）
echo 运行命令：gh repo create stock-trading-app --public --source=. --remote=origin --push
echo.
echo 方式2：手动在 GitHub 网站创建仓库
echo 1. 访问 https://github.com/new
echo 2. 仓库名称：stock-trading-app
echo 3. 选择 Public 或 Private
echo 4. 不要初始化 README
echo 5. 点击 Create repository
echo.

set /p CREATE_CHOICE=是否已手动创建 GitHub 仓库？(y/n): 
if /i "%CREATE_CHOICE%"=="y" (
    goto :add_remote
) else (
    echo 请先创建 GitHub 仓库，然后重新运行此脚本
    pause
    exit /b
)

:add_remote
echo.
echo [5/6] 添加 GitHub 远程仓库...
echo 请输入您的 GitHub 用户名:
set /p GITHUB_USERNAME=
git remote add origin https://github.com/%GITHUB_USERNAME%/stock-trading-app.git

echo.
echo [6/6] 推送到 GitHub...
echo 请注意：推送时需要输入 GitHub 用户名和密码（或 Personal Access Token）
echo 如果使用密码失败，请使用 Personal Access Token（从 GitHub Settings 生成）
echo.
git push -u origin main

echo.
echo ================================================
echo 完成！项目已成功同步到 GitHub
echo ================================================
pause
