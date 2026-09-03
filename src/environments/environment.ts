// Development environment configuration
// Media URLs use socketUrl as host (see resolveMediaUrl).
// Default = Railway API (same as prod). Local BE optional override below.
export const environment = {
  production: false,
  apiBaseUrl: 'https://chat-system-production-83db.up.railway.app/api/v1',
  socketUrl: 'https://chat-system-production-83db.up.railway.app',
  // Local BE only (when primary-service runs on :3000):
  // apiBaseUrl: 'http://localhost:3000/api/v1',
  // socketUrl: 'http://localhost:3000',
  uploadMaxSize: 10485760, // 10MB
  tokenKey: 'chat_access_token',
  refreshTokenKey: 'chat_refresh_token',
  adminTokenKey: 'admin_access_token',
  adminRefreshTokenKey: 'admin_refresh_token'
};
