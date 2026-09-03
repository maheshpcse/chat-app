// Development environment configuration
// Media URLs use socketUrl as host (see resolveMediaUrl).
// If API runs on Railway (not local :3000), point BOTH apiBaseUrl + socketUrl
// at Railway or start local BE — else uploads → ERR_CONNECTION_REFUSED.
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api/v1',
  socketUrl: 'http://localhost:3000',
  // Example Railway (uncomment when BE is remote only):
  // apiBaseUrl: 'https://chat-system-production-83db.up.railway.app/api/v1',
  // socketUrl: 'https://chat-system-production-83db.up.railway.app',
  uploadMaxSize: 10485760, // 10MB
  tokenKey: 'chat_access_token',
  refreshTokenKey: 'chat_refresh_token',
  adminTokenKey: 'admin_access_token',
  adminRefreshTokenKey: 'admin_refresh_token'
};
