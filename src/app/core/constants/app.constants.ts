// ===========================
// Application Constants
// ===========================
export const APP_CONSTANTS = {
  APP_NAME: 'Chat Application',
  DEFAULT_AVATAR: 'assets/images/default-avatar.png',
  MESSAGES_PER_PAGE: 50,
  CONVERSATIONS_PER_PAGE: 20,
  SEARCH_DEBOUNCE_TIME: 300, // ms
  TYPING_TIMEOUT: 3000, // ms
  MAX_FILE_SIZE: 10485760, // 10MB in bytes
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'text/plain'],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  TOKEN_KEY: 'chat_access_token',
  REFRESH_TOKEN_KEY: 'chat_refresh_token',
  USER_KEY: 'chat_current_user'
};
