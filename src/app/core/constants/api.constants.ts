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
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
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
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    READ: '/notifications', // + /:notificationId/read
    READ_ALL: '/notifications/read-all',
    CLEAR: '/notifications/clear'
  },

  // Settings
  SETTINGS: {
    BASE: '/settings' // GET all, PUT bulk, PUT /:key, DELETE /:key
  },

  // Presence
  PRESENCE: {
    CONTACTS: '/presence/contacts',
    BY_USER: '/presence' // + /:userId
  },

  // Scheduled Messages
  SCHEDULED_MESSAGES: {
    BASE: '/scheduled-messages',
    CANCEL: '/scheduled-messages' // + /:id/cancel
  },

  // Admin (isolated JWT)
  ADMIN: {
    AUTH: {
      LOGIN: '/admin/auth/login',
      REFRESH_TOKEN: '/admin/auth/refresh-token',
      LOGOUT: '/admin/auth/logout',
      ME: '/admin/auth/me'
    },
    DASHBOARD: {
      OVERVIEW: '/admin/dashboard/overview'
    },
    USERS: {
      BASE: '/admin/users',
      BY_ID: '/admin/users', // + /:userId
      STATUS: '/admin/users' // + /:userId/status
    },
    FAKER: {
      USERS_GENERATE: '/admin/faker/users/generate',
      USERS_PREVIEW: '/admin/faker/users/preview',
      USERS_SAVE: '/admin/faker/users/save',
      CONTACTS_GENERATE: '/admin/faker/contacts/generate',
      CONTACTS_LINK: '/admin/faker/contacts/link',
      CONTACTS_USERS: '/admin/faker/contacts/users',
      CONTACTS_PREVIEW: '/admin/faker/contacts/preview',
      CONTACTS_SAVE: '/admin/faker/contacts/save',
      GROUPS_GENERATE: '/admin/faker/groups/generate',
      GROUPS_PREVIEW: '/admin/faker/groups/preview',
      GROUPS_SAVE: '/admin/faker/groups/save',
      MESSAGES_GENERATE: '/admin/faker/messages/generate',
      MESSAGES_PREVIEW: '/admin/faker/messages/preview',
      MESSAGES_SAVE: '/admin/faker/messages/save'
    }
  }
};
