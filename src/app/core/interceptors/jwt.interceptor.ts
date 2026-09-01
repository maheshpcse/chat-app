import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

/**
 * JwtInterceptor - Attaches JWT token to outgoing HTTP requests.
 * Also handles token refresh on 401 errors.
 * Skips /admin API paths (handled by AdminJwtInterceptor).
 *
 * Angular Concepts Used:
 * - HttpInterceptor interface (intercepts all HTTP calls)
 * - BehaviorSubject for refresh token lock
 * - RxJS operators: catchError, switchMap, filter, take
 * - Clone request pattern (immutable request objects)
 *
 * Registration in CoreModule:
 *   { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Admin API uses dedicated interceptor + tokens
    if (request.url.includes(`${environment.apiBaseUrl}/admin`)) {
      return next.handle(request);
    }

    // Attach token to request
    const token = this.authService.getToken();
    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !this.isAuthPublic(request.url)) {
          return this.handle401Error(request, next);
        }
        return throwError(error);
      })
    );
  }

  /** Login/register/refresh/forgot must not trigger nested refresh on 401. */
  private isAuthPublic(url: string): boolean {
    if (!url) {
      return false;
    }
    return (
      url.indexOf('/auth/login') !== -1 ||
      url.indexOf('/auth/register') !== -1 ||
      url.indexOf('/auth/refresh-token') !== -1 ||
      url.indexOf('/auth/forgot-password') !== -1 ||
      url.indexOf('/auth/reset-password') !== -1
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const refresh = this.authService.getRefreshToken();
    if (!refresh) {
      this.isRefreshing = false;
      this.authService.handleLogout();
      this.router.navigate(['/auth/login']);
      return throwError({ message: 'Session expired', status: 401 });
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((authData) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(authData.accessToken);
          return next.handle(this.addToken(request, authData.accessToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.authService.handleLogout();
          this.router.navigate(['/auth/login']);
          return throwError(err);
        })
      );
    } else {
      // Wait for refresh to complete
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token));
        })
      );
    }
  }
}
