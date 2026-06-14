// ===========================
// API Constants
// ===========================
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    CHANGE_PASSWORD: '/auth/change-password'
  },

  // Users
  USERS: {
    ME: '/users/me',
    SEARCH: '/users/search',
    BY_ID: '/users' // + /:userId
  },

  // Conversations
  CONVERSATIONS: {
    BASE: '/conversations',
    BY_ID: '/conversations' // + /:conversationId
  },

  // Messages
  MESSAGES: {
    BASE: '/messages',
    UNREAD: '/messages/unread',
    BY_CONVERSATION: '/messages', // + /:conversationId
    READ: '/messages', // + /:conversationId/read
    DELETE: '/messages' // + /:messageId
  },

  // Groups
  GROUPS: {
    BASE: '/groups',
    BY_ID: '/groups', // + /:groupId
    MEMBERS: '/groups' // + /:groupId/members
  },

  // Uploads
  UPLOADS: {
    LOCAL: '/uploads/local',
    S3: '/uploads/s3',
    DOWNLOAD: '/uploads/download'
  }
};
