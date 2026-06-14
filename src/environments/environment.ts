// Development environment configuration
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api/v1',
  socketUrl: 'http://localhost:3000',
  uploadMaxSize: 10485760, // 10MB
  tokenKey: 'chat_access_token',
  refreshTokenKey: 'chat_refresh_token'
};
