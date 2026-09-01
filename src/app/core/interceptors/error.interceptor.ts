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

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unexpected error occurred';
        const url = request.url || '';
        const isAdminApi = url.indexOf('/admin/') !== -1;

        if (error.error instanceof ErrorEvent) {
          errorMessage = error.error.message;
        } else {
          switch (error.status) {
            case 400:
              errorMessage = error.error?.message || 'Bad request';
              break;
            case 401:
              errorMessage = error.error?.message || 'Unauthorized';
              break;
            case 403:
              // Keep user in chat/settings flow — toast/caller handles message.
              // Hard navigate to /errors/403 only for true page-level access denials.
              errorMessage = error.error?.message || 'You do not have permission to perform this action';
              break;
            case 404:
              errorMessage = error.error?.message || 'Resource not found';
              break;
            case 409:
              errorMessage = error.error?.message || 'Conflict';
              break;
            case 422:
              errorMessage = error.error?.message || 'Validation error';
              break;
            case 500:
              // Do not yank user off chat mid-send; surface message via throwError.
              errorMessage =
                (error.error && (error.error.message || error.error.error)) ||
                'Internal server error. Please try again later.';
              break;
            case 0:
              errorMessage = 'Unable to connect to server. Check your network connection.';
              // Only offline page if not already in authenticated app shell
              if (
                !isAdminApi &&
                !this.router.url.startsWith('/admin') &&
                !this.router.url.startsWith('/chat') &&
                !this.router.url.startsWith('/dashboard') &&
                !this.router.url.startsWith('/contacts') &&
                !this.router.url.startsWith('/settings') &&
                !this.router.url.startsWith('/conversations') &&
                !this.router.url.startsWith('/notifications')
              ) {
                this.router.navigate(['/errors/offline']);
              }
              break;
            default:
              errorMessage = error.error?.message || `Error: ${error.status}`;
          }
        }

        console.error('HTTP Error:', errorMessage, error);
        return throwError({ message: errorMessage, status: error.status, errors: error.error?.errors });
      })
    );
  }
}
