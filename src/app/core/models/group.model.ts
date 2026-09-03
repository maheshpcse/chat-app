// ===========================
// Group Model
// ===========================
export interface IGroup {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarUrl?: string;
  ownerId: string;
  members: IGroupMember[];
  conversationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupMember {
  userId: string;
  username: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  avatarUrl?: string;
  role: GroupMemberRole;
  joinedAt: Date;
}

export enum GroupMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

export interface ICreateGroup {
  name: string;
  description?: string;
  memberIds: string[];
}

export interface IUpdateGroup {
  name?: string;
  description?: string;
  avatar?: string;
  avatarUrl?: string;
}

export interface IAddGroupMember {
  userId: string;
}
