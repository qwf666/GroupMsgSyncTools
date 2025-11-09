import { Telegraf, Context } from 'telegraf';
import { config } from './config';
import { database } from './database';
import { MessageRecord } from './types';

const bot = new Telegraf(config.botToken);

// 日志函数
function log(message: string, ...args: any[]): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, ...args);
}

// 调试中间件：记录所有收到的更新
bot.use(async (ctx, next) => {
  const updateType = ctx.updateType;
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  
  if (updateType === 'message' && ctx.message && 'text' in ctx.message) {
    const text = ctx.message.text;
    log(`[UPDATE] Received ${updateType} from chat ${chatId}, user ${userId}, text: ${text?.substring(0, 50)}`);
    
    // 如果是命令，记录详细信息
    if (text?.startsWith('/')) {
      log(`[COMMAND] Detected command: ${text}`);
    }
  } else {
    log(`[UPDATE] Received ${updateType} from chat ${chatId}, user ${userId}`);
  }
  
  return next();
});

// 获取消息类型
function getMessageType(ctx: Context): string {
  if (ctx.message && 'text' in ctx.message) return 'text';
  if (ctx.message && 'photo' in ctx.message) return 'photo';
  if (ctx.message && 'video' in ctx.message) return 'video';
  if (ctx.message && 'document' in ctx.message) return 'document';
  if (ctx.message && 'audio' in ctx.message) return 'audio';
  if (ctx.message && 'voice' in ctx.message) return 'voice';
  if (ctx.message && 'sticker' in ctx.message) return 'sticker';
  if (ctx.message && 'video_note' in ctx.message) return 'video_note';
  if (ctx.message && 'animation' in ctx.message) return 'animation';
  return 'unknown';
}

// 保存消息到数据库
function saveMessageToDb(ctx: Context, messageType: string): number | null {
  try {
    const message = ctx.message;
    if (!message) return null;

    const from = 'from' in message ? message.from : undefined;
    const chat = 'chat' in message ? message.chat : undefined;
    const text = 'text' in message ? message.text : undefined;

    const record: Omit<MessageRecord, 'id'> = {
      messageId: message.message_id,
      chatId: chat?.id || 0,
      fromUserId: from?.id,
      fromUsername: from?.username,
      fromFirstName: from?.first_name,
      text: text,
      messageType: messageType,
      timestamp: message.date * 1000, // 转换为毫秒
      synced: false,
    };

    return database.saveMessage(record);
  } catch (error) {
    log('Error saving message to database:', error);
    return null;
  }
}

// 转发消息到目标群
async function forwardMessage(ctx: Context, recordId: number): Promise<void> {
  const message = ctx.message;
  if (!message) return;

  try {
    // 转发消息
    await ctx.telegram.forwardMessage(
      config.targetChatId,
      config.sourceChatId,
      message.message_id
    );

    // 标记为已同步
    database.markAsSynced(recordId);
    log(`Message ${message.message_id} forwarded successfully`);
  } catch (error: any) {
    log('Error forwarding message:', error.message);
    // 如果转发失败，尝试发送文本消息
    if ('text' in message && message.text) {
      try {
        await ctx.telegram.sendMessage(
          config.targetChatId,
          `[转发失败] ${message.text}`
        );
        database.markAsSynced(recordId);
      } catch (sendError: any) {
        log('Error sending fallback message:', sendError.message);
      }
    }
  }
}

// 处理命令：/stats - 显示统计信息
bot.command('stats', async (ctx) => {
  try {
    log(`Command /stats received from chat ${ctx.chat?.id}, user ${ctx.from?.id}`);
    const stats = database.getStats();
    const lastSyncTime = stats.lastSyncTime
      ? new Date(stats.lastSyncTime).toLocaleString('zh-CN')
      : '无';

    const message = `📊 同步统计信息

总消息数: ${stats.totalMessages}
今日消息数: ${stats.todayMessages}
最后同步时间: ${lastSyncTime}`;

    await ctx.reply(message);
    log(`Command /stats replied successfully`);
  } catch (error: any) {
    log('Error getting stats:', error.message);
    log('Error stack:', error.stack);
    try {
      await ctx.reply('获取统计信息时出错');
    } catch (replyError: any) {
      log('Error sending error message:', replyError.message);
    }
  }
});

// 处理命令：/query - 查询消息
bot.command('query', async (ctx) => {
  try {
    log(`Command /query received from chat ${ctx.chat?.id}, user ${ctx.from?.id}`);
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const keyword = text.replace('/query', '').replace('@GroupMsgSyncToolsBot', '').trim();

    if (!keyword) {
      await ctx.reply('请提供搜索关键词，例如：/query 测试');
      log(`Command /query: no keyword provided`);
      return;
    }

    log(`Command /query: searching for keyword "${keyword}"`);
    const messages = database.queryMessages(keyword);

    if (messages.length === 0) {
      await ctx.reply(`未找到包含 "${keyword}" 的消息`);
      log(`Command /query: no messages found`);
      return;
    }

    let response = `找到 ${messages.length} 条相关消息：\n\n`;
    messages.slice(0, 10).forEach((msg, index) => {
      const time = new Date(msg.timestamp).toLocaleString('zh-CN');
      const sender = msg.fromFirstName || msg.fromUsername || '未知';
      const preview = msg.text ? (msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text) : `[${msg.messageType}]`;
      response += `${index + 1}. [${time}] ${sender}: ${preview}\n`;
    });

    if (messages.length > 10) {
      response += `\n... 还有 ${messages.length - 10} 条消息未显示`;
    }

    await ctx.reply(response);
    log(`Command /query replied successfully with ${messages.length} results`);
  } catch (error: any) {
    log('Error querying messages:', error.message);
    log('Error stack:', error.stack);
    try {
      await ctx.reply('查询消息时出错');
    } catch (replyError: any) {
      log('Error sending error message:', replyError.message);
    }
  }
});

// 处理命令：/help - 显示帮助
bot.command('help', async (ctx) => {
  try {
    log(`Command /help received from chat ${ctx.chat?.id}, user ${ctx.from?.id}`);
    const helpText = `🤖 群消息同步机器人

可用命令：
/stats - 查看同步统计信息
/query [关键词] - 搜索已同步的消息
/help - 显示此帮助信息

机器人会自动将 chatTest1 的消息同步到 chatTest2。`;

    await ctx.reply(helpText);
    log(`Command /help replied successfully`);
  } catch (error: any) {
    log('Error sending help:', error.message);
    log('Error stack:', error.stack);
    try {
      await ctx.reply('发送帮助信息时出错');
    } catch (replyError: any) {
      log('Error sending error message:', replyError.message);
    }
  }
});

// 处理 start 命令（Telegram 默认命令）
bot.command('start', async (ctx) => {
  try {
    log(`Command /start received from chat ${ctx.chat?.id}, user ${ctx.from?.id}`);
    const helpText = `🤖 群消息同步机器人

可用命令：
/stats - 查看同步统计信息
/query [关键词] - 搜索已同步的消息
/help - 显示此帮助信息

机器人会自动将 chatTest1 的消息同步到 chatTest2。`;

    await ctx.reply(helpText);
    log(`Command /start replied successfully`);
  } catch (error: any) {
    log('Error sending start:', error.message);
    log('Error stack:', error.stack);
    try {
      await ctx.reply('发送帮助信息时出错');
    } catch (replyError: any) {
      log('Error sending error message:', replyError.message);
    }
  }
});

// 处理来自源群的消息（放在命令处理器之后，避免拦截命令）
bot.on('message', async (ctx) => {
  try {
    const chatId = ctx.chat?.id;
    
    // 只处理来自源群的消息
    if (chatId !== config.sourceChatId) {
      return;
    }

    // 忽略机器人自己的消息
    if (ctx.message && 'from' in ctx.message && ctx.message.from?.is_bot) {
      return;
    }

    // 忽略命令消息（命令会在命令处理器中处理）
    if (ctx.message && 'text' in ctx.message && ctx.message.text?.startsWith('/')) {
      return;
    }

    const messageType = getMessageType(ctx);
    log(`Received ${messageType} message from chat ${chatId}`);

    // 保存消息到数据库
    const recordId = saveMessageToDb(ctx, messageType);
    if (!recordId) {
      log('Failed to save message to database');
      return;
    }

    // 转发消息
    await forwardMessage(ctx, recordId);
  } catch (error: any) {
    log('Error processing message:', error.message);
  }
});

// 错误处理
bot.catch((err, ctx) => {
  log('Bot error:', err);
  ctx.reply('处理请求时出错，请稍后重试').catch(() => {});
});

// 启动机器人
async function start() {
  try {
    log('Starting bot...');
    log(`Source chat: ${config.sourceChatId}`);
    log(`Target chat: ${config.targetChatId}`);
    
    // 重要：先删除可能存在的 webhook，避免 409 冲突
    try {
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      log('Webhook deleted (if existed)');
    } catch (error: any) {
      log('Webhook deletion attempt (may not exist):', error.message);
    }
    
    // 设置命令范围（可选，让命令在所有群组中可用）
    try {
      await bot.telegram.setMyCommands([
        { command: 'stats', description: '查看同步统计信息' },
        { command: 'query', description: '搜索已同步的消息' },
        { command: 'help', description: '显示帮助信息' }
      ]);
      log('Commands registered successfully');
    } catch (error: any) {
      log('Warning: Failed to register commands:', error.message);
    }
    
    // 使用 polling 模式启动（不使用 webhook）
    await bot.launch({
      dropPendingUpdates: true, // 丢弃待处理的更新，避免冲突
      allowedUpdates: ['message', 'edited_message'] // 只接收消息更新
    });
    log('Bot started successfully in polling mode');
    
    // 优雅关闭
    process.once('SIGINT', () => {
      log('SIGINT received, shutting down...');
      bot.stop('SIGINT');
      database.close();
      process.exit(0);
    });
    
    process.once('SIGTERM', () => {
      log('SIGTERM received, shutting down...');
      bot.stop('SIGTERM');
      database.close();
      process.exit(0);
    });
  } catch (error: any) {
    log('Failed to start bot:', error.message);
    log('Error details:', error);
    
    // 如果是 409 冲突，提供更详细的错误信息
    if (error.response?.error_code === 409 || error.message?.includes('409')) {
      log('');
      log('========================================');
      log('错误：409 冲突 - 机器人实例冲突');
      log('========================================');
      log('可能的原因：');
      log('1. 有多个机器人实例正在运行');
      log('2. 之前设置了 webhook 未删除');
      log('3. 另一个进程正在使用相同的 Bot Token');
      log('');
      log('解决方法：');
      log('1. 检查是否有多个部署/进程在运行');
      log('2. 停止所有其他实例');
      log('3. 等待 1-2 分钟后重试');
      log('4. 如果使用 Railway，确保只有一个服务在运行');
      log('========================================');
    }
    
    // 等待一段时间后重试（可选）
    log('等待 5 秒后退出...');
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  }
}

start();

