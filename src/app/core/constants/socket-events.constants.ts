// ===========================
// Socket Event Constants
// ===========================
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECTION_ERROR: 'connect_error',

  // Room management
  JOIN_CONVERSATION: 'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',

  // Messages
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_READ: 'message_read',

  // Typing
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',

  // Presence
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  GET_ONLINE_USERS: 'get_online_users',
  ONLINE_USERS_LIST: 'online_users_list',

  // Notifications
  NOTIFICATION: 'notification',
  NEW_CONVERSATION: 'new_conversation',

  // Read receipts
  MARK_AS_READ: 'mark_as_read',
  READ_RECEIPT: 'read_receipt'
};
