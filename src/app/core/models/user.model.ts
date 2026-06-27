// ===========================
// User Model
// ===========================
export interface IUser {
  id?: string;          // Mapped from userId in auth flow
  userId?: string;      // Server returns userId
  username: string;
  email: string;
  fullName?: string;    // Computed client-side from firstName + lastName
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phoneNumber?: string;
  bio?: string;
  role?: UserRole;
  status?: string;
  isOnline?: boolean;
  lastSeenAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

export interface IUserSearch {
  search: string;
  page?: number;
  limit?: number;
}

export interface IUserUpdate {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bio?: string;
}
