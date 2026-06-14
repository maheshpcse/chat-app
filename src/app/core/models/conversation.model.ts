// ===========================
// Conversation Model
// ===========================
export interface IConversation {
  id: string;
  type: ConversationType;
  participants: IParticipant[];
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    createdAt: Date;
    type: string;
  };
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum ConversationType {
  PRIVATE = 'private',
  GROUP = 'group'
}

export interface IParticipant {
  userId: string;
  username: string;
  fullName: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface ICreateConversation {
  participantId: string;
  type: ConversationType;
}
