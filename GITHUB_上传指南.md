# 📤 将股票软件项目同步到 GitHub

## 🎯 快速开始（推荐）

### 方式1：使用自动化脚本（最简单）

1. **双击运行** `push_to_github.bat`
2. 按照脚本提示操作
3. 完成！

---

## 📋 手动操作步骤

### 步骤1：在 GitHub 创建仓库

1. 访问 **https://github.com/new**
2. 填写仓库信息：
   - **Repository name**: `stock-trading-app`
   - **Description**: `股票模拟交易软件 - 完整的模拟炒股平台`
   - **Public/Private**: 选择您的需求
   - ⚠️ **不要**勾选 "Initialize with README"
3. 点击 **"Create repository"**

### 步骤2：在本地初始化 Git

打开命令行（CMD 或 PowerShell），执行：

```bash
cd C:\Users\Administrator\WorkBuddy\stock-trading-app
git init
git branch -M main
```

### 步骤3：添加文件并提交

```bash
git add .
git commit -m "初始提交：股票模拟交易软件 v1.0

功能特性：
- 用户注册/登录系统
- 实时股票数据（模拟）
- 市场行情展示
- 模拟交易功能
- 持仓管理
- 交易记录
- 数据持久化（SQLite）
"
```

### 步骤4：连接 GitHub 仓库

**替换 `YOUR_USERNAME` 为您的 GitHub 用户名：**

```bash
git remote add origin https://github.com/YOUR_USERNAME/stock-trading-app.git
```

### 步骤5：推送到 GitHub

```bash
git push -u origin main
```

**⚠️ 重要：身份认证**

GitHub 已不支持密码推送，需要使用 **Personal Access Token (PAT)**：

#### 如何生成 Personal Access Token：

1. 访问 **https://github.com/settings/tokens**
2. 点击 **"Generate new token"** → **"Generate new token (classic)"**
3. 填写信息：
   - **Note**: `stock-trading-app push`
   - **Expiration**: 选择期限（如 90 天）
   - **Select scopes**: 勾选 `repo`（完整仓库权限）
4. 点击 **"Generate token"**
5. **复制生成的 token**（只显示一次！）

#### 推送时使用 Token：

```bash
# 用户名：您的 GitHub 用户名
# 密码：粘贴您生成的 Personal Access Token
git push -u origin main
```

---

## 🔐 使用您提供的凭据

根据您提供的信息：
- **账号**: `1028395447@qq.com`
- **密码**: `1028395447@qq.com`

### ⚠️ 重要提示

GitHub 现在**不支持使用密码**进行命令行操作，必须使用 **Personal Access Token**。

请按以下步骤操作：

### 步骤1：生成 Personal Access Token

1. 访问 **https://github.com/settings/tokens**
2. 使用您的账号 `1028395447@qq.com` 登录 GitHub
3. 点击 **"Generate new token (classic)"**
4. 生成 token 并复制

### 步骤2：使用 Token 推送

```bash
# 在推送时：
# Username: 1028395447@qq.com (或您的 GitHub 用户名)
# Password: 粘贴您生成的 Personal Access Token
git push -u origin main
```

---

## 🚀 使用 GitHub CLI（推荐给高级用户）

如果您安装了 GitHub CLI (`gh`)，可以更简单：

### 安装 GitHub CLI

访问：https://cli.github.com/

### 认证并创建仓库

```bash
# 认证 GitHub 账号
gh auth login

# 创建仓库并推送（一键完成）
gh repo create stock-trading-app --public --source=. --remote=origin --push
```

---

## ✅ 验证上传成功

1. 访问 `https://github.com/YOUR_USERNAME/stock-trading-app`
2. 确认所有文件已上传：
   - ✅ `backend/`
   - ✅ `frontend/`
   - ✅ `demo.html`
   - ✅ `README.md`
   - ✅ `package.json`
   - ✅ `.gitignore`
   - ✅ `LICENSE`

---

## 🐛 常见问题

### 问题1：`git push` 失败，提示密码错误

**原因**：GitHub 已禁用密码认证  
**解决**：使用 Personal Access Token（见上面步骤）

### 问题2：推送时提示 `remote origin already exists`

**解决**：
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/stock-trading-app.git
```

### 问题3：想要更新代码到 GitHub

```bash
git add .
git commit -m "更新说明"
git push
```

---

## 📞 需要帮助？

如果遇到问题，请告诉我：
- 错误提示信息
- 您执行到哪一步
- 您的操作系统（Windows/Mac/Linux）

我会帮您解决！

---

**祝您上传顺利！** 🎉
