// ===========================
// Socket Event Constants
// ===========================
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECTION_ERROR: 'connect_error',

  // Room management
  JOIN_CONVERSATION: 'joinRoom',
  LEAVE_CONVERSATION: 'leaveRoom',

  // Messages
  SEND_MESSAGE: 'sendMessage',
  RECEIVE_MESSAGE: 'newMessage',
  MESSAGE_DELIVERED: 'messageDelivered',
  MESSAGE_READ: 'messageRead',

  // Typing
  TYPING_START: 'typingStart',
  TYPING_STOP: 'typingStop',

  // Presence
  USER_ONLINE: 'userOnline',
  USER_OFFLINE: 'userOffline',
  GET_ONLINE_USERS: 'get_online_users',
  ONLINE_USERS_LIST: 'online_users_list',

  // Notifications
  NOTIFICATION: 'notification',
  NEW_CONVERSATION: 'new_conversation',

  // Read receipts
  MARK_AS_READ: 'messageRead',
  READ_RECEIPT: 'messageRead',

  // Contact events
  CONTACT_REQUEST_RECEIVED: 'contactRequestReceived',
  CONTACT_REQUEST_ACCEPTED: 'contactRequestAccepted',
  CONTACT_REQUEST_REJECTED: 'contactRequestRejected',
  CONTACT_LIST_UPDATED: 'contactListUpdated'
};
