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
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    userId: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
  };
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface IRefreshTokenRequest {
  refreshToken: string;
}
