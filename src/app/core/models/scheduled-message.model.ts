// ===========================
// Scheduled Message Model
// ===========================

export interface IScheduledMessage {
  id: string;
  senderId: string;
  conversationId: string;
  content: string;
  messageType: string;
  fileUrl?: string;
  scheduledAt: Date;
  status: ScheduledMessageStatus;
  createdAt: Date;
  updatedAt?: Date;
  // Joined fields from API
  conversationName?: string;
}

export enum ScheduledMessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

export interface ICreateScheduledMessage {
  conversationId: string;
  content: string;
  messageType?: string;
  fileUrl?: string;
  scheduledAt: string; // ISO string
}
