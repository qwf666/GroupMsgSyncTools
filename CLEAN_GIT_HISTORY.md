# 清理 Git 历史记录指南

由于之前的提交中包含了敏感信息（BOT_TOKEN、CHAT_ID等），需要清理 Git 历史记录。

## ⚠️ 重要警告

清理 Git 历史会**永久删除**所有历史提交记录。执行前请确保：
1. 已备份重要数据
2. 所有团队成员已了解此操作
3. 如果已推送到远程仓库，需要强制推送（会覆盖远程历史）

## 方法一：创建全新的 Git 仓库（推荐，最简单）

这是最安全的方法，创建一个全新的 Git 历史：

```bash
cd /Volumes/SOBIGSSD/tgUtils/GroupMsgSyncTools

# 1. 删除现有的 .git 目录
rm -rf .git

# 2. 初始化新的 Git 仓库
git init

# 3. 添加所有文件（.gitignore 会排除敏感文件）
git add .

# 4. 创建初始提交
git commit -m "Initial commit - cleaned repository"

# 5. 如果之前有远程仓库，更新远程地址
# git remote add origin <your-repo-url>
# 或
# git remote set-url origin <your-repo-url>

# 6. 强制推送到远程（⚠️ 这会覆盖远程历史）
git push -f origin main
# 或
git push -f origin master
```

## 方法二：使用 git filter-branch（保留部分历史）

如果你想保留一些提交历史，可以使用 `git filter-branch`：

```bash
cd /Volumes/SOBIGSSD/tgUtils/GroupMsgSyncTools

# 1. 备份当前分支
git branch backup-before-clean

# 2. 使用 filter-branch 删除敏感信息
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src/config.ts RAILWAY_DEPLOY.md README.md RENDER_DEPLOY.md QUICK_START.md DEPLOYMENT.md" \
  --prune-empty --tag-name-filter cat -- --all

# 3. 重新添加清理后的文件
git add src/config.ts RAILWAY_DEPLOY.md README.md RENDER_DEPLOY.md QUICK_START.md DEPLOYMENT.md
git commit -m "Remove sensitive data from history"

# 4. 清理引用
git for-each-ref --format="%(refname)" refs/original/ | xargs -n 1 git update-ref -d
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. 强制推送
git push -f origin main
```

## 方法三：使用 BFG Repo-Cleaner（推荐用于大型仓库）

BFG 比 git filter-branch 更快更简单：

```bash
# 1. 安装 BFG (需要 Java)
# macOS
brew install bfg

# 2. 克隆仓库为镜像（bare repository）
cd /tmp
git clone --mirror /Volumes/SOBIGSSD/tgUtils/GroupMsgSyncTools

# 3. 创建敏感信息列表文件（替换为你的实际敏感信息）
cat > /tmp/sensitive-data.txt << EOF
your_bot_token_here
your_source_chat_id
your_target_chat_id
EOF

# 4. 使用 BFG 清理
bfg --replace-text /tmp/sensitive-data.txt GroupMsgSyncTools.git

# 5. 清理并推送
cd GroupMsgSyncTools.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 6. 推送到远程
git push --force
```

## 验证清理结果

清理后，验证敏感信息是否已完全移除：

```bash
# 搜索敏感信息（替换为你的实际敏感信息）
cd /Volumes/SOBIGSSD/tgUtils/GroupMsgSyncTools
git log --all --full-history --source="your_bot_token_pattern"
git log --all --full-history --source="your_chat_id_pattern"

# 如果没有任何输出，说明清理成功
```

## 后续步骤

1. **更新所有环境变量**
   - 在本地创建 `.env` 文件（参考 `.env.example`）
   - 在部署平台（Railway/Render等）更新环境变量

2. **通知团队成员**
   - 如果使用共享仓库，通知所有成员需要重新克隆
   - 提供新的仓库地址或说明

3. **重新部署**
   - 在部署平台重新部署应用
   - 确保环境变量已正确配置

## 防止未来泄露

1. ✅ 已更新 `.gitignore` 排除所有敏感文件
2. ✅ 已创建 `.env.example` 作为模板
3. ✅ 代码中不再包含硬编码的敏感信息
4. ⚠️ **重要**：提交前使用 `git diff` 检查是否有敏感信息
5. ⚠️ **重要**：使用 `git secrets` 或类似工具自动检测敏感信息

## 安装 git-secrets（可选，推荐）

```bash
# macOS
brew install git-secrets

# 配置
git secrets --install
git secrets --register-aws  # 如果使用 AWS
git secrets --add 'BOT_TOKEN.*=.*[0-9]+:[A-Za-z0-9_-]+'  # Telegram Bot Token 模式
```

## 常见问题

**Q: 清理后还能恢复历史吗？**
A: 如果使用了备份分支（方法二），可以恢复。否则无法恢复。

**Q: 远程仓库的历史也会被清理吗？**
A: 只有执行 `git push -f` 后才会覆盖远程历史。

**Q: 团队成员需要做什么？**
A: 需要删除本地仓库并重新克隆，或执行 `git fetch origin && git reset --hard origin/main`

---

**建议使用方法一（创建新仓库）**，这是最简单且最安全的方法。

