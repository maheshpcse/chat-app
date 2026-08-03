// ===========================
// Message Model
// ===========================
export interface IMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  messageType: MessageType;
  attachmentUrl?: string;
  status: string;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video'
}

/**
 * Delivery/read lifecycle for a sent message.
 * Mirrors the backend messageStatus states.
 */
export enum MessageStatus {
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  SEEN = 'seen',
  READ = 'read',
  FAILED = 'failed'
}

export interface ISendMessage {
  conversationId: string;
  content: string;
  messageType: MessageType;
  attachmentUrl?: string;
}

export interface ITypingEvent {
  conversationId: string;
  userId: string;
  username: string;
  /** First + Last when provided by socket */
  displayName?: string;
  isTyping: boolean;
}
