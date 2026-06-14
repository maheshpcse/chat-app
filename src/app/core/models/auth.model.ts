// ===========================
// Auth Models
// ===========================
export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  firstName: string;
  lastName: string;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface IRefreshTokenRequest {
  refreshToken: string;
}
