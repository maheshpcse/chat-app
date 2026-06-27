import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api.constants';
import { APP_CONSTANTS } from '../constants/app.constants';
import {
  ILoginRequest,
  IRegisterRequest,
  IAuthResponse,
  IChangePasswordRequest,
  IRefreshTokenRequest
} from '../models/auth.model';
import { IUser } from '../models/user.model';
import { IApiResponse } from '../models/api-response.model';

/**
 * AuthService - Handles JWT authentication, token storage, and current user state.
 *
 * Angular Concepts Used:
 * - @Injectable providedIn 'root' (singleton service)
 * - BehaviorSubject (holds current user state, emits to subscribers)
 * - Observable (HTTP responses as streams)
 * - tap operator (side effects like storing tokens)
 * - map operator (transforming response data)
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // BehaviorSubject: Holds last emitted value for new subscribers
  // Used here to always know current user state across the app
  private currentUserSubject: BehaviorSubject<IUser | null>;
  public currentUser$: Observable<IUser | null>;

  private isLoggedInSubject: BehaviorSubject<boolean>;
  public isLoggedIn$: Observable<boolean>;

  constructor(private http: HttpClient) {
    // Initialize from localStorage on app start
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<IUser | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();

    this.isLoggedInSubject = new BehaviorSubject<boolean>(!!this.getToken());
    this.isLoggedIn$ = this.isLoggedInSubject.asObservable();
  }

  // ===========================
  // Public Methods
  // ===========================

  login(credentials: ILoginRequest): Observable<IAuthResponse> {
    return this.http.post<IApiResponse<IAuthResponse>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.AUTH.LOGIN}`,
      credentials
    ).pipe(
      map(response => response.data),
      tap(authData => this.handleAuthSuccess(authData))
    );
  }

  register(userData: IRegisterRequest): Observable<IAuthResponse> {
    return this.http.post<IApiResponse<IAuthResponse>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.AUTH.REGISTER}`,
      userData
    ).pipe(
      map(response => response.data),
      tap(authData => this.handleAuthSuccess(authData))
    );
  }

  refreshToken(): Observable<IAuthResponse> {
    const refreshToken = this.getRefreshToken();
    const body: IRefreshTokenRequest = { refreshToken };
    return this.http.post<IApiResponse<IAuthResponse>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
      body
    ).pipe(
      map(response => response.data),
      tap(authData => this.handleAuthSuccess(authData))
    );
  }

  logout(): Observable<any> {
    return this.http.post(
      `${environment.apiBaseUrl}${API_ENDPOINTS.AUTH.LOGOUT}`,
      {}
    ).pipe(
      tap(() => this.handleLogout())
    );
  }

  changePassword(data: IChangePasswordRequest): Observable<any> {
    return this.http.post<IApiResponse<any>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.AUTH.CHANGE_PASSWORD}`,
      data
    ).pipe(
      map(response => response.data)
    );
  }

  // ===========================
  // Token Management
  // ===========================

  getToken(): string | null {
    return localStorage.getItem(APP_CONSTANTS.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(APP_CONSTANTS.REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    // Check if token is expired
    return !this.isTokenExpired(token);
  }

  getCurrentUser(): IUser | null {
    return this.currentUserSubject.value;
  }

  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  // ===========================
  // Private Methods
  // ===========================

  private handleAuthSuccess(authData: IAuthResponse): void {
    localStorage.setItem(APP_CONSTANTS.TOKEN_KEY, authData.accessToken);
    localStorage.setItem(APP_CONSTANTS.REFRESH_TOKEN_KEY, authData.refreshToken);

    // Map server's userId to internal id, construct fullName from firstName + lastName
    const user: IUser = {
      id: authData.user.userId,
      username: authData.user.username,
      email: authData.user.email,
      firstName: authData.user.firstName,
      lastName: authData.user.lastName,
      fullName: `${authData.user.firstName} ${authData.user.lastName}`.trim(),
      role: authData.user.role as any,
      isOnline: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    localStorage.setItem(APP_CONSTANTS.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isLoggedInSubject.next(true);
  }

  handleLogout(): void {
    localStorage.removeItem(APP_CONSTANTS.TOKEN_KEY);
    localStorage.removeItem(APP_CONSTANTS.REFRESH_TOKEN_KEY);
    localStorage.removeItem(APP_CONSTANTS.USER_KEY);

    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  private getStoredUser(): IUser | null {
    const userStr = localStorage.getItem(APP_CONSTANTS.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to ms
      return Date.now() >= expiry;
    } catch {
      return true;
    }
  }
}
