#!/bin/bash
# 快速部署脚本

set -e

echo "========================================="
echo "Telegram 机器人部署脚本"
echo "========================================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✓ Node.js 版本: $(node --version)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "错误: 未找到 npm"
    exit 1
fi

echo "✓ npm 版本: $(npm --version)"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "警告: 未找到 .env 文件，请先创建并配置环境变量"
    echo "参考 .env.example 文件"
    exit 1
fi

echo "✓ 找到 .env 文件"

# 安装依赖
echo ""
echo "正在安装依赖..."
npm install --production

# 编译 TypeScript
echo ""
echo "正在编译 TypeScript 代码..."
npm run build

# 检查编译结果
if [ ! -f dist/bot.js ]; then
    echo "错误: 编译失败，未找到 dist/bot.js"
    exit 1
fi

echo "✓ 编译成功"

# 创建日志目录
mkdir -p logs
mkdir -p data

# 检查 PM2
if command -v pm2 &> /dev/null; then
    echo ""
    echo "检测到 PM2，使用 PM2 启动..."
    
    # 检查是否已运行
    if pm2 list | grep -q "telegram-bot"; then
        echo "重启现有进程..."
        pm2 restart telegram-bot
    else
        echo "启动新进程..."
        pm2 start ecosystem.config.js
    fi
    
    echo ""
    echo "========================================="
    echo "部署完成！"
    echo "========================================="
    echo ""
    echo "常用命令："
    echo "  查看状态: pm2 status"
    echo "  查看日志: pm2 logs telegram-bot"
    echo "  重启服务: pm2 restart telegram-bot"
    echo "  停止服务: pm2 stop telegram-bot"
    echo ""
    pm2 status
else
    echo ""
    echo "未检测到 PM2，请手动启动："
    echo "  npm start"
    echo ""
    echo "或安装 PM2: npm install -g pm2"
    echo "然后使用: pm2 start ecosystem.config.js"
fi

