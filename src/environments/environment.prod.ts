// Production environment configuration
export const environment = {
  production: true,
  apiBaseUrl: 'https://chat-system-production-83db.up.railway.app/api/v1',
  socketUrl: 'https://chat-system-production-83db.up.railway.app',
  uploadMaxSize: 10485760, // 10MB
  tokenKey: 'chat_access_token',
  refreshTokenKey: 'chat_refresh_token',
  adminTokenKey: 'admin_access_token',
  adminRefreshTokenKey: 'admin_refresh_token'
};
