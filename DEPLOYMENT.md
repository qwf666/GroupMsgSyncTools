# Telegram 机器人线上部署指南

本文档提供将 Telegram 群消息同步机器人部署到生产环境的详细步骤。

## 前置要求

- Linux 服务器（推荐 Ubuntu 20.04+ 或 CentOS 7+）
- Node.js 18+ 和 npm
- 服务器有公网 IP 或域名
- 机器人已添加到源群组和目标群组，并具有管理员权限

## 一、服务器环境准备

### 1.1 安装 Node.js

**Ubuntu/Debian:**
```bash
# 更新包列表
sudo apt update

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
```

**CentOS/RHEL:**
```bash
# 安装 Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

### 1.2 安装 PM2（进程管理器）

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 --version
```

### 1.3 安装必要的系统依赖（用于 better-sqlite3）

**Ubuntu/Debian:**
```bash
sudo apt install -y build-essential python3
```

**CentOS/RHEL:**
```bash
sudo yum groupinstall -y "Development Tools"
sudo yum install -y python3
```

## 二、代码部署

### 2.1 上传代码到服务器

**方法一：使用 Git（推荐）**

```bash
# 在服务器上克隆仓库
cd /opt
sudo git clone <your-repo-url> tg-bot
cd tg-bot/GroupMsgSyncTools
```

**方法二：使用 SCP 上传**

```bash
# 在本地机器执行
cd /Volumes/SOBIGSSD/tgUtils
scp -r GroupMsgSyncTools user@your-server:/opt/tg-bot/
```

**方法三：使用 rsync**

```bash
# 在本地机器执行
cd /Volumes/SOBIGSSD/tgUtils
rsync -avz GroupMsgSyncTools user@your-server:/opt/tg-bot/
```

### 2.2 安装项目依赖

```bash
cd /opt/tg-bot/GroupMsgSyncTools
npm install --production
```

### 2.3 编译 TypeScript 代码

```bash
npm run build
```

## 三、环境配置

### 3.1 创建环境变量文件

```bash
cd /opt/tg-bot/GroupMsgSyncTools
nano .env
```

在文件中添加以下内容：

```env
BOT_TOKEN=your_bot_token_here
SOURCE_CHAT_ID=your_source_chat_id
TARGET_CHAT_ID=your_target_chat_id
DB_PATH=/opt/tg-bot/GroupMsgSyncTools/data/messages.db
```

保存并退出（Ctrl+X, 然后 Y, 然后 Enter）

### 3.2 设置文件权限

```bash
# 确保 .env 文件权限安全
chmod 600 .env

# 创建数据目录
mkdir -p data
chmod 755 data
```

## 四、使用 PM2 启动和管理

### 4.1 使用 PM2 启动应用

```bash
cd /opt/tg-bot/GroupMsgSyncTools

# 启动应用
pm2 start dist/bot.js --name telegram-bot

# 查看状态
pm2 status

# 查看日志
pm2 logs telegram-bot

# 实时监控
pm2 monit
```

### 4.2 配置 PM2 开机自启

```bash
# 生成启动脚本
pm2 startup

# 保存当前进程列表
pm2 save
```

### 4.3 PM2 常用命令

```bash
# 重启应用
pm2 restart telegram-bot

# 停止应用
pm2 stop telegram-bot

# 删除应用
pm2 delete telegram-bot

# 查看详细信息
pm2 info telegram-bot

# 查看实时日志
pm2 logs telegram-bot --lines 100

# 清空日志
pm2 flush
```

## 五、使用 Systemd 服务（替代方案）

如果你不想使用 PM2，可以使用 systemd 服务：

### 5.1 创建服务文件

```bash
sudo nano /etc/systemd/system/telegram-bot.service
```

添加以下内容：

```ini
[Unit]
Description=Telegram Group Message Sync Bot
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/opt/tg-bot/GroupMsgSyncTools
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node /opt/tg-bot/GroupMsgSyncTools/dist/bot.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**注意：** 将 `your-username` 替换为你的实际用户名。

### 5.2 启动和管理服务

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start telegram-bot

# 设置开机自启
sudo systemctl enable telegram-bot

# 查看状态
sudo systemctl status telegram-bot

# 查看日志
sudo journalctl -u telegram-bot -f

# 重启服务
sudo systemctl restart telegram-bot

# 停止服务
sudo systemctl stop telegram-bot
```

## 六、验证部署

### 6.1 检查机器人是否运行

```bash
# 如果使用 PM2
pm2 status

# 如果使用 systemd
sudo systemctl status telegram-bot
```

### 6.2 测试机器人功能

1. 在 chatTest1 群组发送一条测试消息
2. 检查 chatTest2 群组是否收到转发消息
3. 在任意群组发送 `/help` 命令测试查询功能
4. 发送 `/stats` 命令查看统计信息

### 6.3 检查日志

```bash
# PM2 日志
pm2 logs telegram-bot --lines 50

# Systemd 日志
sudo journalctl -u telegram-bot -n 50
```

## 七、监控和维护

### 7.1 设置日志轮转

**PM2 日志轮转：**

```bash
# 安装 PM2 日志轮转模块
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

**Systemd 日志轮转：**

创建日志轮转配置：

```bash
sudo nano /etc/logrotate.d/telegram-bot
```

添加内容：

```
/var/log/telegram-bot/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 your-username your-username
}
```

### 7.2 监控资源使用

```bash
# 查看进程资源使用
pm2 monit

# 或使用系统命令
top -p $(pgrep -f "node.*bot.js")
htop
```

### 7.3 数据库备份

创建备份脚本：

```bash
nano /opt/tg-bot/backup.sh
```

添加内容：

```bash
#!/bin/bash
BACKUP_DIR="/opt/tg-bot/backups"
DB_PATH="/opt/tg-bot/GroupMsgSyncTools/data/messages.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_PATH "$BACKUP_DIR/messages_$DATE.db"

# 删除 30 天前的备份
find $BACKUP_DIR -name "messages_*.db" -mtime +30 -delete

echo "Backup completed: messages_$DATE.db"
```

设置执行权限：

```bash
chmod +x /opt/tg-bot/backup.sh
```

添加到 crontab（每天凌晨 2 点备份）：

```bash
crontab -e
```

添加：

```
0 2 * * * /opt/tg-bot/backup.sh >> /opt/tg-bot/backup.log 2>&1
```

## 八、故障排查

### 8.1 机器人无法启动

1. 检查环境变量是否正确：
   ```bash
   cat .env
   ```

2. 检查 Node.js 版本：
   ```bash
   node --version
   ```

3. 检查端口和网络连接：
   ```bash
   curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
   ```

### 8.2 消息无法转发

1. 检查机器人是否在目标群组中
2. 检查机器人是否有发送消息的权限
3. 查看错误日志：
   ```bash
   pm2 logs telegram-bot --err
   ```

### 8.3 数据库错误

1. 检查数据库文件权限：
   ```bash
   ls -la data/
   ```

2. 检查磁盘空间：
   ```bash
   df -h
   ```

## 九、安全建议

1. **保护 .env 文件**：确保只有所有者可读
   ```bash
   chmod 600 .env
   ```

2. **使用非 root 用户运行**：创建专用用户
   ```bash
   sudo useradd -m -s /bin/bash telegram-bot
   sudo chown -R telegram-bot:telegram-bot /opt/tg-bot
   ```

3. **配置防火墙**：只开放必要端口
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

4. **定期更新依赖**：
   ```bash
   npm audit
   npm update
   ```

## 十、更新部署

当需要更新代码时：

```bash
cd /opt/tg-bot/GroupMsgSyncTools

# 拉取最新代码（如果使用 Git）
git pull

# 安装新依赖
npm install --production

# 重新编译
npm run build

# 重启应用
pm2 restart telegram-bot
# 或
sudo systemctl restart telegram-bot
```

## 十一、快速部署脚本

可以创建一个自动化部署脚本：

```bash
#!/bin/bash
# deploy.sh

set -e

echo "开始部署 Telegram 机器人..."

# 安装依赖
echo "安装依赖..."
npm install --production

# 编译代码
echo "编译 TypeScript..."
npm run build

# 重启服务
echo "重启服务..."
pm2 restart telegram-bot || pm2 start dist/bot.js --name telegram-bot

echo "部署完成！"
pm2 status
```

保存为 `deploy.sh`，设置执行权限后使用：

```bash
chmod +x deploy.sh
./deploy.sh
```

## 常见问题

**Q: 机器人启动后立即退出？**
A: 检查 .env 文件中的 BOT_TOKEN 是否正确，查看日志获取详细错误信息。

**Q: 如何查看实时日志？**
A: 使用 `pm2 logs telegram-bot -f` 或 `sudo journalctl -u telegram-bot -f`

**Q: 如何更新机器人代码？**
A: 拉取最新代码，运行 `npm install`，`npm run build`，然后 `pm2 restart telegram-bot`

**Q: 数据库文件在哪里？**
A: 默认在 `data/messages.db`，可通过 DB_PATH 环境变量配置

---

部署完成后，机器人将自动运行并开始同步消息。如有问题，请查看日志文件进行排查。

