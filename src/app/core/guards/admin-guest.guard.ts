import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AdminAuthService } from '../services/admin-auth.service';

/**
 * AdminGuestGuard — redirects authenticated admins away from login.
 */
@Injectable({
  providedIn: 'root'
})
export class AdminGuestGuard implements CanActivate {
  constructor(
    private adminAuthService: AdminAuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (this.adminAuthService.isAuthenticated()) {
      this.router.navigate(['/admin/dashboard']);
      return false;
    }
    return true;
  }
}
