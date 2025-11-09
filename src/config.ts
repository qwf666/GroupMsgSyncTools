import dotenv from 'dotenv';

dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN || '',
  sourceChatId: parseInt(process.env.SOURCE_CHAT_ID || '0'),
  targetChatId: parseInt(process.env.TARGET_CHAT_ID || '0'),
  dbPath: process.env.DB_PATH || './data/messages.db',
};

// 验证配置
if (!config.botToken) {
  throw new Error('BOT_TOKEN is required');
}

if (!config.sourceChatId || !config.targetChatId) {
  throw new Error('SOURCE_CHAT_ID and TARGET_CHAT_ID are required');
}

