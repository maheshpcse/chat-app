// ===========================
// Notification Model
// ===========================
export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  GROUP_INVITE = 'group_invite',
  GROUP_REMOVED = 'group_removed',
  USER_ONLINE = 'user_online',
  MENTION = 'mention'
}
