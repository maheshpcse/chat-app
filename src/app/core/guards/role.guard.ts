import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * RoleGuard - Protects routes based on user roles.
 *
 * Angular Concepts Used:
 * - CanActivate interface
 * - ActivatedRouteSnapshot.data for route config data
 * - Role-based access control
 *
 * Usage in routing:
 *   {
 *     path: 'admin',
 *     canActivate: [AuthGuard, RoleGuard],
 *     data: { roles: ['admin', 'moderator'] },
 *     loadChildren: ...
 *   }
 */
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    // Get allowed roles from route data
    const allowedRoles = route.data.roles as string[];

    if (!allowedRoles || allowedRoles.length === 0) {
      return true; // No roles specified, allow access
    }

    const userRole = this.authService.getUserRole();

    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    // User doesn't have required role - redirect
    this.router.navigate(['/chat']);
    return false;
  }
}
