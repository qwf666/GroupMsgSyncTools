# Render 快速部署指南

Render 是另一个优秀的云平台，提供免费套餐。本指南将帮助你在 Render 上部署 Telegram 机器人。

## 一、准备工作

1. **注册 Render 账号**
   - 访问 [render.com](https://render.com)
   - 使用 GitHub 账号登录

2. **准备代码仓库**
   - 确保代码已推送到 GitHub

## 二、部署步骤

1. **创建新 Web Service**
   - 登录 Render Dashboard
   - 点击 "New +" → "Web Service"
   - 选择 "Connect a repository"
   - 选择你的 GitHub 仓库
   - 选择 `GroupMsgSyncTools` 目录

2. **配置服务**
   - **Name**: `telegram-bot`（或任意名称）
   - **Region**: 选择离你最近的区域
   - **Branch**: `main`（或你的主分支）
   - **Root Directory**: `GroupMsgSyncTools`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. **配置环境变量**
   在 "Environment" 部分添加：
   ```
   BOT_TOKEN=your_bot_token_here
   SOURCE_CHAT_ID=your_source_chat_id
   TARGET_CHAT_ID=your_target_chat_id
   NODE_ENV=production
   ```

4. **配置持久化磁盘（可选）**
   - 在 "Disks" 部分添加磁盘
   - 名称：`bot-data`
   - 挂载路径：`/data`
   - 更新环境变量：`DB_PATH=/data/messages.db`

5. **部署**
   - 点击 "Create Web Service"
   - 等待部署完成（通常 3-5 分钟）

## 三、验证部署

1. 查看日志确认机器人已启动
2. 测试消息转发功能
3. 测试命令功能

## 四、注意事项

- Render 免费套餐会在 15 分钟无活动后休眠
- 首次请求可能需要几秒唤醒时间
- 建议使用付费套餐避免休眠

---

更多信息：https://render.com/docs

