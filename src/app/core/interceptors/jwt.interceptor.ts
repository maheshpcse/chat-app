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

/**
 * JwtInterceptor - Attaches JWT token to outgoing HTTP requests.
 * Also handles token refresh on 401 errors.
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

    // Attach token to request
    const token = this.authService.getToken();
    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(error);
      })
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
