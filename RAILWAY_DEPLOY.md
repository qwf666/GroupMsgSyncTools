# Railway 快速部署指南

Railway 是一个现代化的云平台，可以快速部署 Node.js 应用。本指南将帮助你在 5 分钟内将 Telegram 机器人部署到 Railway。

## 一、准备工作

1. **注册 Railway 账号**
   - 访问 [railway.app](https://railway.app)
   - 使用 GitHub 账号登录（推荐）

2. **准备代码仓库**
   - 将代码推送到 GitHub（如果还没有）
   - 确保代码包含所有必要文件

## 二、部署步骤

### 方法一：通过 GitHub 部署（推荐）

1. **登录 Railway**
   - 访问 [railway.app](https://railway.app)
   - 点击 "Login" 使用 GitHub 登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的代码仓库
   - **重要：** 如果代码在子目录，在 "Settings" → "Root Directory" 中设置为 `GroupMsgSyncTools`

3. **配置环境变量**
   - 在项目页面，点击 "Variables" 标签
   - 添加以下环境变量：

   ```
   BOT_TOKEN=your_bot_token_here
   SOURCE_CHAT_ID=your_source_chat_id
   TARGET_CHAT_ID=your_target_chat_id
   NODE_ENV=production
   ```

4. **检查构建配置**
   - 进入 "Settings" → "Build & Deploy"
   - 确保 "Build Command" 为：`npm install && npm run build`（或留空使用 nixpacks.toml）
   - 确保 "Start Command" 为：`npm start`

5. **部署**
   - Railway 会自动检测到 Node.js 项目（通过 nixpacks.toml）
   - 自动运行 `npm install` 和 `npm run build`
   - 然后运行 `npm start`
   - 等待部署完成（通常 2-3 分钟）

6. **查看日志**
   - 点击 "Deployments" 标签
   - 点击最新的部署
   - 查看 "Logs" 确认机器人已启动

**如果遇到构建错误，请查看 [RAILWAY_FIX.md](./RAILWAY_FIX.md)**

### 方法二：使用 Railway CLI

1. **安装 Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **登录**
   ```bash
   railway login
   ```

3. **初始化项目**
   ```bash
   cd GroupMsgSyncTools
   railway init
   ```

4. **设置环境变量**
   ```bash
   railway variables set BOT_TOKEN=your_bot_token_here
   railway variables set SOURCE_CHAT_ID=your_source_chat_id
   railway variables set TARGET_CHAT_ID=your_target_chat_id
   railway variables set NODE_ENV=production
   ```

5. **部署**
   ```bash
   railway up
   ```

## 三、配置持久化存储（数据库）⚠️ 重要

**Railway 的临时文件系统会在容器重启时清空所有数据！** 必须配置持久化存储才能保存数据库。

### 方法：使用 Railway Volume（推荐）

#### 步骤 1：创建 Volume

1. 在 Railway 项目页面，点击 **"New"** → **"Volume"**
2. 配置如下：
   - **Name**: `bot-data`（或任意名称）
   - **Mount Path**: `/data` ⚠️ **必须使用这个路径**
   - **Size**: 1GB（默认即可）

#### 步骤 2：设置环境变量

在 Railway 项目设置中添加环境变量：

```bash
DB_PATH=/data/messages.db
```

**重要：** 必须使用 `/data/messages.db`，这是 Volume 的挂载路径。

#### 步骤 3：验证配置

1. 重新部署应用
2. 查看日志，应该看到：
   ```
   [INFO] Database path: /data/messages.db
   [INFO] Database connection established
   ```
3. 发送几条测试消息
4. 使用 `/stats` 命令查看消息数
5. 在 Railway 控制台重启服务
6. 再次使用 `/stats` 命令，如果数字保持不变，说明持久化成功 ✅

**详细配置指南请参考：** [PERSISTENT_STORAGE.md](./PERSISTENT_STORAGE.md)

## 四、验证部署

1. **查看部署状态**
   - 在 Railway 项目页面查看部署状态
   - 确保状态为 "Active"

2. **查看日志**
   - 点击 "Deployments" → 最新部署 → "Logs"
   - 应该看到类似输出：
     ```
     [2024-01-01T00:00:00.000Z] Starting bot...
     [2024-01-01T00:00:00.000Z] Source chat: your_source_chat_id
     [2024-01-01T00:00:00.000Z] Target chat: your_target_chat_id
     [2024-01-01T00:00:00.000Z] Bot started successfully
     ```

3. **测试功能**
   - 在 chatTest1 群组发送一条测试消息
   - 检查 chatTest2 群组是否收到转发
   - 发送 `/help` 命令测试

## 五、更新代码

### 通过 GitHub（自动部署）

1. 推送代码到 GitHub
2. Railway 会自动检测并重新部署

### 通过 CLI

```bash
railway up
```

## 六、查看日志和监控

1. **实时日志**
   - 在 Railway 项目页面点击 "Logs"
   - 或使用 CLI：`railway logs`

2. **监控指标**
   - Railway 提供 CPU、内存使用情况
   - 在项目页面查看 "Metrics"

## 七、环境变量说明

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `BOT_TOKEN` | ✅ | Telegram Bot Token | `your_bot_token_here` |
| `SOURCE_CHAT_ID` | ✅ | 源群组 ID | `your_source_chat_id` |
| `TARGET_CHAT_ID` | ✅ | 目标群组 ID | `your_target_chat_id` |
| `DB_PATH` | ❌ | 数据库路径（可选） | `/data/messages.db` |
| `NODE_ENV` | ❌ | 环境模式 | `production` |

## 八、常见问题

### Q: 部署失败怎么办？

1. **检查日志**
   - 查看部署日志中的错误信息
   - 常见问题：
     - 缺少环境变量
     - 编译错误
     - 依赖安装失败

2. **检查环境变量**
   - 确保所有必需的环境变量都已设置
   - 检查变量值是否正确（特别是群组 ID 的负号）

3. **检查 Node.js 版本**
   - Railway 默认使用 Node.js 18+
   - 如果需要特定版本，在 `package.json` 中添加：
     ```json
     "engines": {
       "node": ">=18.0.0"
     }
     ```

### Q: 机器人无法接收消息？

1. **检查 Bot Token**
   - 确保 Token 正确
   - 测试：访问 `https://api.telegram.org/bot<TOKEN>/getMe`

2. **检查群组权限**
   - 确保机器人已添加到两个群组
   - 确保机器人在目标群组有发送消息权限

3. **查看日志**
   - 检查是否有错误信息
   - 确认机器人已成功启动

### Q: 数据库数据丢失？⚠️ 常见问题

**原因：** Railway 的临时文件系统会在容器重启时清空所有数据。

**解决方案：**
1. ✅ **使用 Railway Volume（推荐）**
   - 创建 Volume，挂载路径设为 `/data`
   - 设置环境变量 `DB_PATH=/data/messages.db`
   - 参考 [PERSISTENT_STORAGE.md](./PERSISTENT_STORAGE.md) 详细步骤

2. 或使用外部数据库（如 Railway PostgreSQL，需要修改代码）

**验证：** 配置后重启服务，使用 `/stats` 命令检查数据是否保留。

### Q: 如何备份数据库？

1. **使用 Railway CLI 下载**
   ```bash
   railway run cat /data/messages.db > backup.db
   ```

2. **或使用外部存储**
   - 定期导出数据库到云存储（S3、Google Drive 等）

## 九、费用说明

- Railway 提供免费额度：$5/月
- 对于小型机器人通常足够使用
- 超出后按使用量计费

## 十、其他云平台

如果你不想使用 Railway，也可以部署到：

- **Render** - 类似 Railway，免费套餐可用
- **Fly.io** - 全球边缘部署
- **Heroku** - 经典平台（需要付费）
- **DigitalOcean App Platform** - 简单易用

部署步骤类似，主要区别在于环境变量配置方式。

## 快速检查清单

部署前确认：
- [ ] Railway 账号已注册
- [ ] 代码已推送到 GitHub
- [ ] 环境变量已配置（BOT_TOKEN, SOURCE_CHAT_ID, TARGET_CHAT_ID）
- [ ] 机器人已添加到两个群组
- [ ] 机器人有发送消息权限

部署后验证：
- [ ] 部署状态为 "Active"
- [ ] 日志显示 "Bot started successfully"
- [ ] 测试消息转发功能
- [ ] 测试命令功能（/help, /stats）

---

**完成！** 你的机器人现在应该已经在 Railway 上运行了。🎉

如有问题，请查看 Railway 文档：https://docs.railway.app

