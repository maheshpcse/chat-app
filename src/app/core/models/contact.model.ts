// ===========================
// Contact Models
// ===========================

export interface IContactRequest {
  requestId: string;
  senderUserId: string;
  receiverUserId: string;
  status: ContactRequestStatus;
  requestedAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  // Populated user info
  firstName?: string;
  lastName?: string;
  username?: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export enum ContactRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked'
}

export interface IContact {
  contactId: string;
  contactUserId: string;
  status: string;
  createdAt: Date;
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl?: string;
  isOnline?: boolean;
  lastSeenAt?: Date;
}

export type RelationStatus = 'none' | 'request_sent' | 'request_received' | 'contact';

export interface IRelationInfo {
  relationStatus: RelationStatus;
  requestId?: string;
}
