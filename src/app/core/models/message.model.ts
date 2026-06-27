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
  isTyping: boolean;
}
