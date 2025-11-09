import Database from 'better-sqlite3';
import { MessageRecord, SyncStats } from './types';
import { config } from './config';
import * as fs from 'fs';
import * as path from 'path';

// 日志函数
function log(message: string, ...args: any[]): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, ...args);
}

// 确保数据目录存在
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  log(`Created database directory: ${dbDir}`);
}

log(`Database path: ${config.dbPath}`);
log(`Database directory: ${dbDir}`);

const db = new Database(config.dbPath);
log(`Database connection established`);

// 初始化数据库表
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    chat_id INTEGER NOT NULL,
    from_user_id INTEGER,
    from_username TEXT,
    from_first_name TEXT,
    text TEXT,
    message_type TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    synced INTEGER DEFAULT 0,
    sync_timestamp INTEGER
  );
  
  CREATE INDEX IF NOT EXISTS idx_message_id ON messages(message_id);
  CREATE INDEX IF NOT EXISTS idx_chat_id ON messages(chat_id);
  CREATE INDEX IF NOT EXISTS idx_timestamp ON messages(timestamp);
  CREATE INDEX IF NOT EXISTS idx_synced ON messages(synced);
`);

const insertMessage = db.prepare(`
  INSERT INTO messages (
    message_id, chat_id, from_user_id, from_username, from_first_name,
    text, message_type, timestamp, synced, sync_timestamp
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateSyncStatus = db.prepare(`
  UPDATE messages 
  SET synced = 1, sync_timestamp = ? 
  WHERE id = ?
`);

const getMessageById = db.prepare(`
  SELECT * FROM messages WHERE id = ?
`);

const getMessagesByKeyword = db.prepare(`
  SELECT * FROM messages 
  WHERE text LIKE ? AND synced = 1
  ORDER BY timestamp DESC
  LIMIT 20
`);

const getStats = db.prepare(`
  SELECT 
    COUNT(*) as total_messages,
    SUM(CASE WHEN timestamp >= ? THEN 1 ELSE 0 END) as today_messages,
    MAX(sync_timestamp) as last_sync_time
  FROM messages
  WHERE synced = 1
`);

export const database = {
  // 保存消息记录
  saveMessage(record: Omit<MessageRecord, 'id'>): number {
    const result = insertMessage.run(
      record.messageId,
      record.chatId,
      record.fromUserId || null,
      record.fromUsername || null,
      record.fromFirstName || null,
      record.text || null,
      record.messageType,
      record.timestamp,
      record.synced ? 1 : 0,
      record.syncTimestamp || null
    );
    return Number(result.lastInsertRowid);
  },

  // 更新同步状态
  markAsSynced(recordId: number): void {
    updateSyncStatus.run(Date.now(), recordId);
  },

  // 根据ID获取消息
  getMessage(id: number): MessageRecord | null {
    const row = getMessageById.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      messageId: row.message_id,
      chatId: row.chat_id,
      fromUserId: row.from_user_id,
      fromUsername: row.from_username,
      fromFirstName: row.from_first_name,
      text: row.text,
      messageType: row.message_type,
      timestamp: row.timestamp,
      synced: row.synced === 1,
      syncTimestamp: row.sync_timestamp,
    };
  },

  // 根据关键词查询消息
  queryMessages(keyword: string): MessageRecord[] {
    const rows = getMessagesByKeyword.all(`%${keyword}%`) as any[];
    return rows.map(row => ({
      id: row.id,
      messageId: row.message_id,
      chatId: row.chat_id,
      fromUserId: row.from_user_id,
      fromUsername: row.from_username,
      fromFirstName: row.from_first_name,
      text: row.text,
      messageType: row.message_type,
      timestamp: row.timestamp,
      synced: row.synced === 1,
      syncTimestamp: row.sync_timestamp,
    }));
  },

  // 获取统计信息
  getStats(): SyncStats {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = Math.floor(todayStart.getTime() / 1000) * 1000;

    const row = getStats.get(todayTimestamp) as any;
    return {
      totalMessages: row?.total_messages || 0,
      todayMessages: row?.today_messages || 0,
      lastSyncTime: row?.last_sync_time || undefined,
    };
  },

  // 关闭数据库连接
  close(): void {
    log('Closing database connection');
    db.close();
  },
};

