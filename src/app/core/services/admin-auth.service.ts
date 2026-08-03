import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api.constants';
import { APP_CONSTANTS } from '../constants/app.constants';
import { IApiResponse } from '../models/api-response.model';
import {
  IAdminAuthResponse,
  IAdminLoginRequest,
  IAdminUser
} from '../models/admin.model';

/**
 * AdminAuthService — isolated admin session.
 * Separate localStorage keys and API paths from chat AuthService.
 */
@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private currentAdminSubject: BehaviorSubject<IAdminUser | null>;
  public currentAdmin$: Observable<IAdminUser | null>;

  private isLoggedInSubject: BehaviorSubject<boolean>;
  public isLoggedIn$: Observable<boolean>;

  constructor(private http: HttpClient) {
    const stored = this.getStoredAdmin();
    this.currentAdminSubject = new BehaviorSubject<IAdminUser | null>(stored);
    this.currentAdmin$ = this.currentAdminSubject.asObservable();

    this.isLoggedInSubject = new BehaviorSubject<boolean>(!!this.getToken());
    this.isLoggedIn$ = this.isLoggedInSubject.asObservable();
  }

  login(credentials: IAdminLoginRequest): Observable<IAdminAuthResponse> {
    return this.http.post<IApiResponse<IAdminAuthResponse>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.AUTH.LOGIN}`,
      credentials
    ).pipe(
      map(response => response.data),
      tap(data => this.handleAuthSuccess(data))
    );
  }

  refreshToken(): Observable<IAdminAuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<IApiResponse<IAdminAuthResponse>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.AUTH.REFRESH_TOKEN}`,
      { refreshToken }
    ).pipe(
      map(response => response.data),
      tap(data => this.handleAuthSuccess(data))
    );
  }

  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    return this.http.post(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.AUTH.LOGOUT}`,
      { refreshToken }
    ).pipe(
      tap(() => this.handleLogout())
    );
  }

  me(): Observable<IAdminUser> {
    return this.http.get<IApiResponse<IAdminUser>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.AUTH.ME}`
    ).pipe(
      map(response => response.data),
      tap(admin => {
        localStorage.setItem(APP_CONSTANTS.ADMIN_USER_KEY, JSON.stringify(admin));
        this.currentAdminSubject.next(admin);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(APP_CONSTANTS.ADMIN_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(APP_CONSTANTS.ADMIN_REFRESH_TOKEN_KEY);
  }

  getCurrentAdmin(): IAdminUser | null {
    return this.currentAdminSubject.value;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    return !this.isTokenExpired(token);
  }

  handleLogout(): void {
    localStorage.removeItem(APP_CONSTANTS.ADMIN_TOKEN_KEY);
    localStorage.removeItem(APP_CONSTANTS.ADMIN_REFRESH_TOKEN_KEY);
    localStorage.removeItem(APP_CONSTANTS.ADMIN_USER_KEY);
    this.currentAdminSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  private handleAuthSuccess(data: IAdminAuthResponse): void {
    localStorage.setItem(APP_CONSTANTS.ADMIN_TOKEN_KEY, data.accessToken);
    localStorage.setItem(APP_CONSTANTS.ADMIN_REFRESH_TOKEN_KEY, data.refreshToken);
    localStorage.setItem(APP_CONSTANTS.ADMIN_USER_KEY, JSON.stringify(data.admin));
    this.currentAdminSubject.next(data.admin);
    this.isLoggedInSubject.next(true);
  }

  private getStoredAdmin(): IAdminUser | null {
    try {
      const raw = localStorage.getItem(APP_CONSTANTS.ADMIN_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) {
        return false;
      }
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}
