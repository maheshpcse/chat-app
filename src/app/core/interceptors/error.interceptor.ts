import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

/**
 * ErrorInterceptor - Global HTTP error handler.
 *
 * Angular Concepts Used:
 * - HttpInterceptor for centralized error handling
 * - catchError operator
 * - Different handling per HTTP status code
 *
 * Registration in CoreModule:
 *   { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unexpected error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = error.error.message;
        } else {
          // Server-side error
          switch (error.status) {
            case 400:
              errorMessage = error.error?.message || 'Bad request';
              break;
            case 403:
              errorMessage = 'You do not have permission to perform this action';
              break;
            case 404:
              errorMessage = 'Resource not found';
              break;
            case 409:
              errorMessage = error.error?.message || 'Conflict';
              break;
            case 422:
              errorMessage = error.error?.message || 'Validation error';
              break;
            case 500:
              errorMessage = 'Internal server error. Please try again later.';
              break;
            case 0:
              errorMessage = 'Unable to connect to server. Check your network connection.';
              break;
            default:
              errorMessage = error.error?.message || `Error: ${error.status}`;
          }
        }

        // You can use a toast/notification service here
        console.error('HTTP Error:', errorMessage, error);

        return throwError({ message: errorMessage, status: error.status, errors: error.error?.errors });
      })
    );
  }
}
