export interface MessageRecord {
  id?: number;
  messageId: number;
  chatId: number;
  fromUserId?: number;
  fromUsername?: string;
  fromFirstName?: string;
  text?: string;
  messageType: string;
  timestamp: number;
  synced: boolean;
  syncTimestamp?: number;
}

export interface SyncStats {
  totalMessages: number;
  todayMessages: number;
  lastSyncTime?: number;
}

