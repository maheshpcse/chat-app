import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { ChatService } from '../core/services/chat.service';
import { ContactService } from '../core/services/contact.service';
import { NotificationService } from '../core/services/notification.service';
import { PresenceService } from '../core/services/presence.service';
import { IUser } from '../core/models/user.model';
import { IConversation } from '../core/models/conversation.model';
import { INotification } from '../core/models/notification.model';

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
  greeting: string = '';
  today: Date = new Date();
  recentConversations: IConversation[] = [];
  notifications: INotification[] = [];
  unreadCount: number = 0;
  onlineContactCount: number = 0;
  pendingRequestCount: number = 0;
  totalContactCount: number = 0;

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
    this.setGreeting();
    this.loadDashboardData();
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
    // Load recent conversations
    const convSub = this.chatService.conversations$.subscribe(conversations => {
      this.recentConversations = conversations.slice(0, 5);
    });
    this.subscriptions.push(convSub);

    // Load conversations from server
    this.chatService.loadConversations();

    // Load notifications
    const notifSub = this.notificationService.notifications$.subscribe(notifs => {
      this.notifications = notifs.slice(0, 5);
    });
    this.subscriptions.push(notifSub);

    // Load unread count
    const unreadSub = this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    this.subscriptions.push(unreadSub);

    // Load contacts data
    this.contactService.getContacts().subscribe(contacts => {
      this.totalContactCount = contacts.length;
      // Count online contacts
      this.onlineContactCount = contacts.filter(c =>
        this.presenceService.isOnline(c.contactUserId)
      ).length;
    });

    // Load pending requests
    this.contactService.getReceivedRequests().subscribe(requests => {
      this.pendingRequestCount = requests.filter(r => r.status === 'pending').length;
    });
  }

  openConversation(conversation: IConversation): void {
    this.chatService.setActiveConversation(conversation);
    this.router.navigate(['/chat']);
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
