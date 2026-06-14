import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';

/**
 * LoaderInterceptor - Shows/hides global spinner during HTTP requests.
 *
 * Angular Concepts Used:
 * - HttpInterceptor (intercepts all requests)
 * - finalize operator (runs on complete or error)
 * - LoaderService with BehaviorSubject
 *
 * Registration in CoreModule:
 *   { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true }
 */
@Injectable()
export class LoaderInterceptor implements HttpInterceptor {

  constructor(private loaderService: LoaderService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip loader for certain requests (e.g., typing events, status checks)
    const skipLoader = request.headers.has('X-Skip-Loader');

    if (!skipLoader) {
      this.loaderService.show();
    }

    return next.handle(request).pipe(
      finalize(() => {
        if (!skipLoader) {
          this.loaderService.hide();
        }
      })
    );
  }
}
