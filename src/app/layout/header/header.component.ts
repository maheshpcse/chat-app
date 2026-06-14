import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { NotificationService } from '../../core/services/notification.service';
import { IUser } from '../../core/models/user.model';

/**
 * HeaderComponent - Top navigation bar with user info, notifications, logout.
 *
 * Angular Concepts Used:
 * - OnInit, OnDestroy lifecycle hooks
 * - Subscription management (unsubscribe on destroy)
 * - async pipe alternative (manual subscription)
 * - Router navigation
 * - Event binding
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {

  currentUser: IUser | null = null;
  unreadNotifications: number = 0;
  showNotifications: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private socketService: SocketService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.subscriptions.push(userSub);

    // Subscribe to unread notification count
    const notifSub = this.notificationService.unreadCount$.subscribe(count => {
      this.unreadNotifications = count;
    });
    this.subscriptions.push(notifSub);
  }

  // Lifecycle Hook: ngOnDestroy - cleanup subscriptions to prevent memory leaks
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  onLogout(): void {
    this.authService.logout().subscribe(
      () => {
        this.socketService.disconnect();
        this.router.navigate(['/auth/login']);
      },
      () => {
        // Even on error, logout locally
        this.authService.handleLogout();
        this.socketService.disconnect();
        this.router.navigate(['/auth/login']);
      }
    );
  }

  goToProfile(): void {
    this.router.navigate(['/user/profile']);
  }
}
