// ===========================
// Conversation Model
// ===========================

/**
 * IConversation matches the server response from spGetUserConversations.
 * The server returns a flat structure with displayName/avatarUrl computed.
 */
export interface IConversation {
  conversationId: string;
  conversationType: ConversationType;
  lastMessageAt?: Date;
  lastMessageContent?: string;
  lastMessageType?: string;
  lastMessageSender?: string;
  displayName?: string;
  avatarUrl?: string;
  unreadCount?: number;
  // These fields come from spCreatePrivateConversation
  participantId?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  createdAt?: Date;
}

export enum ConversationType {
  PRIVATE = 'private',
  GROUP = 'group'
}

export interface ICreateConversation {
  participantId: string;
}
