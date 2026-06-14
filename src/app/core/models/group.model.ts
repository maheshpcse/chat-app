// ===========================
// Group Model
// ===========================
export interface IGroup {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
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
  avatar?: string;
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
}

export interface IAddGroupMember {
  userId: string;
}
