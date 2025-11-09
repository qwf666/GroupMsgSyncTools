# Telegram 群消息同步机器人

一个 Telegram 机器人，用于将消息从一个群组自动同步转发到另一个群组，并提供消息查询和统计功能。

## 功能特性

- ✅ 自动监听源群组（chatTest1）的新消息
- ✅ 自动转发消息到目标群组（chatTest2）
- ✅ 支持多种消息类型（文本、图片、视频、文件等）
- ✅ 消息记录存储到 SQLite 数据库
- ✅ 查询已同步的消息记录
- ✅ 统计同步消息数量和时间

## 安装

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量：
创建 `.env` 文件（参考 `.env.example`）：
```
BOT_TOKEN=your_bot_token_here
SOURCE_CHAT_ID=your_source_chat_id
TARGET_CHAT_ID=your_target_chat_id
```

## 使用方法

### 开发模式
```bash
npm run dev
```

### 生产模式
```bash
npm run build
npm start
```

### 快速部署（推荐）
```bash
# 使用自动化部署脚本
chmod +x deploy.sh
./deploy.sh

# 或使用 npm 脚本
npm run deploy
```

### PM2 管理命令
```bash
npm run pm2:start    # 启动
npm run pm2:stop     # 停止
npm run pm2:restart  # 重启
npm run pm2:logs     # 查看日志
```

## 线上部署

### 云平台快速部署（推荐）

- **[Railway 部署指南](./RAILWAY_DEPLOY.md)** ⭐ 最简单，5分钟完成
- **[Render 部署指南](./RENDER_DEPLOY.md)** - 免费套餐可用
- **[云平台对比](./CLOUD_DEPLOY.md)** - 选择最适合的平台

### 自建服务器部署

详细的服务器部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)，包含：
- 服务器环境准备
- 代码部署步骤
- PM2 和 Systemd 配置
- 监控和维护
- 故障排查

## 命令说明

在任意群组或私聊中使用以下命令：

- `/stats` - 查看同步统计信息（总消息数、今日消息数、最后同步时间）
- `/query [关键词]` - 搜索已同步的消息，例如：`/query 测试`
- `/help` - 显示帮助信息
- `/start` - 显示帮助信息（Telegram 默认命令）

**注意：** 如果命令没有响应，请查看 [命令故障排查指南](./COMMAND_TROUBLESHOOTING.md)

## 项目结构

```
GroupMsgSyncTools/
├── src/
│   ├── bot.ts          # 主机器人逻辑
│   ├── database.ts     # 数据存储和查询
│   ├── config.ts       # 配置管理
│   └── types.ts        # TypeScript 类型定义
├── data/               # 数据库文件存储目录
├── dist/               # 编译后的 JavaScript 文件
├── .env                # 环境变量（不提交到git）
├── .env.example        # 环境变量示例
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 技术栈

- Node.js + TypeScript
- Telegraf - Telegram Bot API 框架
- better-sqlite3 - SQLite 数据库

## 注意事项

1. 确保机器人已添加到源群组和目标群组
2. 机器人需要在目标群组中有发送消息的权限
3. 数据库文件会自动创建在 `data/messages.db`
4. 消息转发会保持原始格式，包括媒体文件

## 许可证

MIT

# GroupMsgSyncTools
