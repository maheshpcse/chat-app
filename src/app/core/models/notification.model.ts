// ===========================
// Notification Model
// ===========================
export interface INotification {
  id: string;
  notificationId?: string;
  userId: string;
  actorUserId?: string;
  type: NotificationType | string;
  title: string;
  message: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  data?: any;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  GROUP_INVITE = 'group_invite',
  GROUP_REMOVED = 'group_removed',
  USER_ONLINE = 'user_online',
  MENTION = 'mention',
  CONTACT_REQUEST = 'contactRequest',
  CONTACT_ACCEPTED = 'contactAccepted'
}
