// ===========================
// User Model
// ===========================
export interface IUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  bio?: string;
  role?: UserRole;
  status?: string;
  isOnline: boolean;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

export interface IUserSearch {
  query: string;
  page?: number;
  limit?: number;
}

export interface IUserUpdate {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}
