// Production environment configuration
export const environment = {
  production: true,
  apiBaseUrl: 'https://your-production-api.com/api/v1',
  socketUrl: 'https://your-production-api.com',
  uploadMaxSize: 10485760, // 10MB
  tokenKey: 'chat_access_token',
  refreshTokenKey: 'chat_refresh_token'
};
