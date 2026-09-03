import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, forkJoin, of, timer } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { ChatService } from '../core/services/chat.service';
import { ContactService } from '../core/services/contact.service';
import { NotificationService } from '../core/services/notification.service';
import { PresenceService } from '../core/services/presence.service';
import { IUser } from '../core/models/user.model';
import { IConversation } from '../core/models/conversation.model';
import { INotification } from '../core/models/notification.model';
import { MIN_LOADING_DASHBOARD_MS } from '../shared/utilities/min-loading.util';
import { resolveMediaUrl } from '../shared/utilities/media-url.util';

/**
 * DashboardComponent - Main landing page after login.
 * Shows overview widgets: welcome, recent conversations, stats, quick actions.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  currentUser: IUser | null = null;
  dashboardAvatarFailed = false;
  greeting = '';
  today: Date = new Date();
  recentConversations: IConversation[] = [];
  notifications: INotification[] = [];
  unreadCount = 0;
  onlineContactCount = 0;
  pendingRequestCount = 0;
  totalContactCount = 0;

  /** Full dashboard context shimmer — min 1s */
  isPageLoading = true;

  private contactIds: string[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private contactService: ContactService,
    private notificationService: NotificationService,
    private presenceService: PresenceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.dashboardAvatarFailed = false;
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        this.dashboardAvatarFailed = false;
      })
    );
    this.setGreeting();
    this.loadDashboardData();
  }

  get dashboardAvatarSrc(): string {
    return resolveMediaUrl(this.currentUser && this.currentUser.avatarUrl);
  }

  onDashboardAvatarError(): void {
    this.dashboardAvatarFailed = true;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  private setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greeting = 'Good Morning';
    } else if (hour < 17) {
      this.greeting = 'Good Afternoon';
    } else {
      this.greeting = 'Good Evening';
    }
  }

  private loadDashboardData(): void {
    this.isPageLoading = true;

    const unreadSub = this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    this.subscriptions.push(unreadSub);

    const notifLive = this.notificationService.notifications$.subscribe(notifs => {
      if (!this.isPageLoading) {
        this.notifications = (notifs || []).slice(0, 5);
      }
    });
    this.subscriptions.push(notifLive);

    const convLive = this.chatService.conversations$.subscribe(conversations => {
      if (!this.isPageLoading) {
        this.recentConversations = (conversations || []).slice(0, 5);
      }
    });
    this.subscriptions.push(convLive);

    // Keep online contact count + recent conv dots live while dashboard open
    const presenceLive = this.presenceService.onlineUsers$.subscribe(() => {
      if (this.isPageLoading) { return; }
      this.onlineContactCount = this.contactIds.filter(id =>
        this.presenceService.isOnline(id)
      ).length;
    });
    this.subscriptions.push(presenceLive);

    this.chatService.loadConversations();

    // Min 1s shimmer + parallel API work, then single paint
    const bootSub = forkJoin({
      minTime: timer(MIN_LOADING_DASHBOARD_MS),
      notifications: this.notificationService.loadNotifications(1, 10).pipe(
        catchError(() => of(null))
      ),
      contacts: this.contactService.getContacts().pipe(
        catchError(() => of([] as any[]))
      ),
      requests: this.contactService.getReceivedRequests().pipe(
        catchError(() => of([] as any[]))
      )
    }).subscribe(({ contacts, requests }) => {
      this.recentConversations = this.snapshotConversations().slice(0, 5);
      this.notifications = this.snapshotNotifications().slice(0, 5);

      const contactList = contacts || [];
      this.contactIds = contactList
        .map((c: any) => String(c.contactUserId || c.userId || ''))
        .filter((id: string) => !!id);
      this.totalContactCount = contactList.length;
      this.onlineContactCount = this.contactIds.filter(id =>
        this.presenceService.isOnline(id)
      ).length;

      const reqList = requests || [];
      this.pendingRequestCount = reqList.filter((r: any) => r.status === 'pending').length;

      this.isPageLoading = false;
    });
    this.subscriptions.push(bootSub);
  }

  private snapshotConversations(): IConversation[] {
    let latest: IConversation[] = [];
    const sub = this.chatService.conversations$.subscribe(c => latest = c || []);
    sub.unsubscribe();
    return latest;
  }

  private snapshotNotifications(): INotification[] {
    let latest: INotification[] = [];
    const sub = this.notificationService.notifications$.subscribe(n => latest = n || []);
    sub.unsubscribe();
    return latest;
  }

  openConversation(conversation: IConversation): void {
    this.chatService.setActiveConversation(conversation);
    this.router.navigate(['/chat']);
  }

  isConversationOnline(conv: IConversation): boolean {
    if (!conv?.participantId) { return false; }
    return this.presenceService.isOnline(String(conv.participantId));
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getUserInitials(): string {
    if (!this.currentUser) { return '?'; }
    const first = this.currentUser.firstName ? this.currentUser.firstName.charAt(0) : '';
    const last = this.currentUser.lastName ? this.currentUser.lastName.charAt(0) : '';
    return (first + last).toUpperCase();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'new_message': return 'message';
      case 'group_invite': return 'group_add';
      case 'group_removed': return 'group_remove';
      case 'user_online': return 'person';
      case 'mention': return 'alternate_email';
      default: return 'notifications';
    }
  }
}
