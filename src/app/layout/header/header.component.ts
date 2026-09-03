import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { NotificationService } from '../../core/services/notification.service';
import { IUser } from '../../core/models/user.model';
import { resolveMediaUrl } from '../../shared/utilities/media-url.util';

/**
 * HeaderComponent - Top navigation bar with user info, notifications, logout.
 *
 * The notification dropdown auto-hides (fade-out) shortly after the mouse
 * leaves it, and cancels the hide when the mouse re-enters.
 *
 * Angular Concepts Used:
 * - OnInit, OnDestroy lifecycle hooks
 * - Subscription management (unsubscribe on destroy)
 * - Router navigation
 * - Event binding (mouseenter / mouseleave)
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {

  @ViewChild('notificationButton', { static: false }) notificationButton: ElementRef<HTMLElement>;
  @ViewChild('notificationPanel', { static: false }) notificationPanel: ElementRef<HTMLElement>;
  @ViewChild('profileButton', { static: false }) profileButton: ElementRef<HTMLElement>;
  @ViewChild('profilePanel', { static: false }) profilePanel: ElementRef<HTMLElement>;

  currentUser: IUser | null = null;
  unreadNotifications = 0;
  showNotifications = false;
  showProfileMenu = false;
  panelClosing = false;
  profileMenuClosing = false;
  /** Logged-in user is connected via socket → show Online in profile popup + avatar dot. */
  isSelfOnline = false;
  headerAvatarFailed = false;
  private hideTimer: any = null;
  private profileHideTimer: any = null;
  /** Keep in sync with header-panel fade CSS duration. */
  private readonly fadeMs = 420;
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
      this.headerAvatarFailed = false;
      this.refreshSelfOnline();
    });
    this.subscriptions.push(userSub);

    // Seed the unread badge on load (header is always mounted).
    this.notificationService.loadUnreadCount().subscribe();

    // Subscribe to unread notification count
    const notifSub = this.notificationService.unreadCount$.subscribe(count => {
      this.unreadNotifications = count;
    });
    this.subscriptions.push(notifSub);

    // Self presence tracks live socket connection
    this.subscriptions.push(
      this.socketService.connected$.subscribe(() => this.refreshSelfOnline())
    );
    this.refreshSelfOnline();
  }

  // Lifecycle Hook: ngOnDestroy - cleanup subscriptions to prevent memory leaks
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.cancelHide();
    this.cancelProfileHide();
  }

  toggleNotifications(): void {
    // Already open / mid-close: treat as close request.
    if (this.showNotifications) {
      this.closeNotifications();
      return;
    }

    // Only one header popup open at a time.
    if (this.showProfileMenu) {
      this.closeProfileMenu(true);
    }

    this.cancelHide();
    this.panelClosing = false;
    this.showNotifications = true;

    // List component loads rows + min shimmer on init (avoid double API).
    this.notificationService.loadUnreadCount().subscribe();
    this.scheduleHide(3000);
  }

  toggleProfileMenu(): void {
    if (this.showProfileMenu) {
      this.closeProfileMenu();
      return;
    }

    if (this.showNotifications) {
      this.closeNotifications(true);
    }

    this.cancelProfileHide();
    this.profileMenuClosing = false;
    this.showProfileMenu = true;
    this.scheduleProfileHide(3000);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    const clickedInsideNotificationButton = !!this.notificationButton?.nativeElement?.contains(target);
    const clickedInsideNotificationPanel = !!this.notificationPanel?.nativeElement?.contains(target);
    const clickedInsideProfileButton = !!this.profileButton?.nativeElement?.contains(target);
    const clickedInsideProfilePanel = !!this.profilePanel?.nativeElement?.contains(target);

    if (this.showNotifications && !clickedInsideNotificationButton && !clickedInsideNotificationPanel) {
      this.closeNotifications();
    }

    if (this.showProfileMenu && !clickedInsideProfileButton && !clickedInsideProfilePanel) {
      this.closeProfileMenu();
    }
  }

  /** Mouse left the panel: fade it out, then hide (bootstrap-like fade). */
  onPanelMouseLeave(): void {
    this.scheduleHide(600);
  }

  onProfilePanelMouseLeave(): void {
    this.scheduleProfileHide(600);
  }

  /** Arms the two-stage fade-out after the given grace delay. */
  private scheduleHide(delay: number): void {
    this.cancelHide();
    this.hideTimer = setTimeout(() => {
      this.closeNotifications();
    }, delay);
  }

  private scheduleProfileHide(delay: number): void {
    this.cancelProfileHide();
    this.profileHideTimer = setTimeout(() => {
      this.closeProfileMenu();
    }, delay);
  }

  private closeNotifications(immediate: boolean = false): void {
    this.cancelHide();
    if (!this.showNotifications) {
      return;
    }

    if (immediate || this.panelClosing) {
      this.showNotifications = false;
      this.panelClosing = false;
      return;
    }

    this.panelClosing = true;
    this.hideTimer = setTimeout(() => {
      this.showNotifications = false;
      this.panelClosing = false;
      this.hideTimer = null;
    }, this.fadeMs);
  }

  private closeProfileMenu(immediate: boolean = false): void {
    this.cancelProfileHide();
    if (!this.showProfileMenu) {
      return;
    }

    if (immediate || this.profileMenuClosing) {
      this.showProfileMenu = false;
      this.profileMenuClosing = false;
      return;
    }

    this.profileMenuClosing = true;
    this.profileHideTimer = setTimeout(() => {
      this.showProfileMenu = false;
      this.profileMenuClosing = false;
      this.profileHideTimer = null;
    }, this.fadeMs);
  }

  /** Mouse came back: cancel any pending fade/hide. */
  onPanelMouseEnter(): void {
    if (!this.showNotifications) {
      return;
    }
    this.cancelHide();
    this.panelClosing = false;
  }

  onProfilePanelMouseEnter(): void {
    if (!this.showProfileMenu) {
      return;
    }
    this.cancelProfileHide();
    this.profileMenuClosing = false;
  }

  private cancelHide(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  private cancelProfileHide(): void {
    if (this.profileHideTimer) {
      clearTimeout(this.profileHideTimer);
      this.profileHideTimer = null;
    }
  }

  viewAllNotifications(): void {
    this.closeNotifications(true);
    this.router.navigate(['/notifications']);
  }

  /** Bell popup row click → mark read (list) + Notifications page + close panel. */
  onNotificationItemOpen(): void {
    this.closeNotifications(true);
    this.router.navigate(['/notifications']);
  }

  onLogout(): void {
    this.closeProfileMenu(true);
    this.closeNotifications(true);
    this.authService.logout().subscribe(
      () => {
        this.socketService.disconnect();
        this.router.navigate(['/']);   // back to the public site landing page
      },
      () => {
        // Even on error, logout locally
        this.authService.handleLogout();
        this.socketService.disconnect();
        this.router.navigate(['/']);   // back to the public site landing page
      }
    );
  }

  goToProfile(): void {
    this.closeProfileMenu(true);
    this.router.navigate(['/settings']);
  }

  getUserInitials(): string {
    if (!this.currentUser) { return '?'; }
    const first = (this.currentUser.firstName || '').charAt(0).toUpperCase();
    const last = (this.currentUser.lastName || '').charAt(0).toUpperCase();
    return first + last || '?';
  }

  /** Relative /uploads paths must be prefixed with API host. */
  get headerAvatarSrc(): string {
    return resolveMediaUrl(this.currentUser && this.currentUser.avatarUrl);
  }

  onHeaderAvatarError(): void {
    this.headerAvatarFailed = true;
  }

  /** Logged-in session with live socket → Online in profile popup + avatar badge. */
  private refreshSelfOnline(): void {
    this.isSelfOnline = !!this.currentUser && this.socketService.isConnected();
  }
}
