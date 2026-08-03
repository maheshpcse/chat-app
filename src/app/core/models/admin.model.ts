// ===========================
// Admin Models
// ===========================

export interface IAdminLoginRequest {
  email: string;
  password: string;
}

export interface IAdminUser {
  adminId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status?: string;
  lastLoginAt?: string;
}

export interface IAdminAuthResponse {
  accessToken: string;
  refreshToken: string;
  admin: IAdminUser;
}

export interface IAdminDashboardStats {
  totalUsers: number;
  onlineUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalGroups: number;
  totalMessages: number;
  privateConversations: number;
  groupConversations: number;
  totalFriends: number;
  pendingFriendRequests: number;
  unreadNotifications: number;
}

export interface IAdminActivityItem {
  activityType: string;
  entityId: string;
  title: string;
  subtitle: string;
  occurredAt: string;
}

export interface IAdminDashboardOverview {
  stats: IAdminDashboardStats;
  recentUsers: IAdminActivityItem[];
  recentMessages: IAdminActivityItem[];
}

export interface IAdminManagedUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: string;
  status: string;
  isOnline?: number | boolean;
  lastLoginAt?: string;
  lastSeenAt?: string;
  createdAt?: string;
}

export interface IFakerPreviewUser {
  tempId: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  phoneNumber?: string;
  bio?: string;
  role: string;
  status: string;
}

export interface IFakerGenerateResult {
  previewId: string;
  users: IFakerPreviewUser[];
  expiresInMinutes: number;
}

export interface IFakerSaveResult {
  saved: number;
  failed: number;
  users: IAdminManagedUser[];
  errors: Array<{ tempId: string; email: string; message: string }>;
}


export interface IFakerPreviewContact {
  tempId: string;
  userId: string;
  contactUserId: string;
  userLabel: string;
  contactLabel: string;
  mode: 'accepted' | 'pending' | string;
  status: string;
}

export interface IFakerPreviewGroupMember {
  userId: string;
  username?: string;
  label?: string;
  role: string;
}

export interface IFakerPreviewGroup {
  tempId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdByLabel?: string;
  members: IFakerPreviewGroupMember[];
}

export interface IFakerPreviewMessage {
  tempId: string;
  conversationId?: string | null;
  senderId: string;
  receiverId?: string | null;
  senderLabel?: string;
  conversationLabel?: string;
  content: string;
  messageType: string;
}

export interface IFakerEntitySaveResult {
  saved: number;
  failed: number;
  errors: Array<{ tempId: string; message: string }>;
}
