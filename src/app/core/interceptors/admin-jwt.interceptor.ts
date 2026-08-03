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
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AdminAuthService } from '../services/admin-auth.service';

/**
 * AdminJwtInterceptor — attaches admin Bearer token only to /admin API calls.
 * Handles admin token refresh on 401 without touching chat user session.
 */
@Injectable()
export class AdminJwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(
    private adminAuthService: AdminAuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isAdminApi(request.url)) {
      return next.handle(request);
    }

    // Skip attaching token on login / refresh
    if (this.isAuthPublic(request.url)) {
      return next.handle(request);
    }

    const token = this.adminAuthService.getToken();
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

  private isAdminApi(url: string): boolean {
    return url.includes(`${environment.apiBaseUrl}/admin`);
  }

  private isAuthPublic(url: string): boolean {
    return (
      url.includes('/admin/auth/login') ||
      url.includes('/admin/auth/refresh-token')
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
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.adminAuthService.refreshToken().pipe(
        switchMap((authData) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(authData.accessToken);
          return next.handle(this.addToken(request, authData.accessToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.adminAuthService.handleLogout();
          this.router.navigate(['/admin/login']);
          return throwError(err);
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token != null),
      take(1),
      switchMap(token => next.handle(this.addToken(request, token as string)))
    );
  }
}
