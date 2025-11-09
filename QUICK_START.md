# 快速部署指南

## 一、本地测试（可选）

在部署到服务器之前，可以在本地先测试：

```bash
# 1. 安装依赖
npm install

# 2. 创建 .env 文件（如果还没有）
cp .env.example .env
# 编辑 .env 文件，填入正确的配置

# 3. 编译代码
npm run build

# 4. 运行测试
npm start
```

## 二、服务器部署（推荐方式）

### 方式一：使用自动化脚本（最简单）

1. **上传代码到服务器**
   ```bash
   # 在本地执行
   scp -r GroupMsgSyncTools user@your-server:/opt/tg-bot/
   ```

2. **SSH 登录服务器**
   ```bash
   ssh user@your-server
   ```

3. **安装 Node.js 和 PM2**（如果还没有）
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   sudo npm install -g pm2
   
   # CentOS/RHEL
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs
   sudo npm install -g pm2
   ```

4. **配置环境变量**
   ```bash
   cd /opt/tg-bot/GroupMsgSyncTools
   nano .env
   ```
   
   添加内容：
   ```env
   BOT_TOKEN=your_bot_token_here
   SOURCE_CHAT_ID=your_source_chat_id
   TARGET_CHAT_ID=your_target_chat_id
   ```

5. **运行部署脚本**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

6. **设置开机自启**
   ```bash
   pm2 startup
   pm2 save
   ```

完成！机器人已启动并运行。

### 方式二：手动部署

1. **安装依赖**
   ```bash
   cd /opt/tg-bot/GroupMsgSyncTools
   npm install --production
   ```

2. **编译代码**
   ```bash
   npm run build
   ```

3. **创建 .env 文件**（同上）

4. **使用 PM2 启动**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

## 三、验证部署

1. **检查状态**
   ```bash
   pm2 status
   ```

2. **查看日志**
   ```bash
   pm2 logs telegram-bot
   ```

3. **测试功能**
   - 在 chatTest1 发送一条消息
   - 检查 chatTest2 是否收到
   - 发送 `/help` 命令测试

## 四、常用管理命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs telegram-bot

# 重启
pm2 restart telegram-bot

# 停止
pm2 stop telegram-bot

# 查看详细信息
pm2 info telegram-bot

# 监控资源
pm2 monit
```

## 五、更新代码

```bash
cd /opt/tg-bot/GroupMsgSyncTools

# 拉取最新代码（如果使用 Git）
git pull

# 或重新上传代码

# 运行部署脚本
./deploy.sh
```

## 六、故障排查

如果机器人无法启动：

1. **检查 .env 文件**
   ```bash
   cat .env
   ```

2. **查看错误日志**
   ```bash
   pm2 logs telegram-bot --err
   ```

3. **检查 Node.js 版本**
   ```bash
   node --version  # 需要 18+
   ```

4. **测试 Bot Token**
   ```bash
   curl "https://api.telegram.org/bot<YOUR_TOKEN>/getMe"
   ```

## 七、完整文档

更多详细信息请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

