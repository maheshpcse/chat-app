import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from '../core/services/notification.service';
import { INotification } from '../core/models/notification.model';
import { withMinLoading, MIN_LOADING_PAGE_MS } from '../shared/utilities/min-loading.util';

/**
 * NotificationsPageComponent - Full notifications page with 4 view modes:
 * Timeline (default), List, Grid, Table
 * Supports filtering by notification type.
 */
@Component({
  selector: 'app-notifications-page',
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.scss']
})
export class NotificationsPageComponent implements OnInit, OnDestroy {

  notifications: INotification[] = [];
  filteredNotifications: INotification[] = [];
  isLoading = true;
  viewMode: 'timeline' | 'list' | 'grid' | 'table' = 'timeline';
  filterType: string = 'all';
  unreadCount: number = 0;

  filterTypes = [
    { value: 'all', label: 'All', icon: 'notifications' },
    { value: 'new_message', label: 'Messages', icon: 'message' },
    { value: 'group_invite', label: 'Groups', icon: 'group' },
    { value: 'user_online', label: 'Contacts', icon: 'person' },
    { value: 'mention', label: 'Mentions', icon: 'alternate_email' }
  ];

  private subscriptions: Subscription[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Load full history; keep page shimmer at least 0.5s.
    this.isLoading = true;
    withMinLoading(
      this.notificationService.loadNotifications(1, 100),
      MIN_LOADING_PAGE_MS
    ).subscribe(
      () => { this.isLoading = false; },
      () => { this.isLoading = false; }
    );
    this.notificationService.loadUnreadCount().subscribe();

    const notifSub = this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.applyFilter();
    });
    this.subscriptions.push(notifSub);

    const countSub = this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    this.subscriptions.push(countSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  setViewMode(mode: 'timeline' | 'list' | 'grid' | 'table'): void {
    this.viewMode = mode;
  }

  setFilter(type: string): void {
    this.filterType = type;
    this.applyFilter();
  }

  private applyFilter(): void {
    if (this.filterType === 'all') {
      this.filteredNotifications = this.notifications;
    } else {
      this.filteredNotifications = this.notifications.filter(n => n.type === this.filterType);
    }
  }

  markAsRead(notification: INotification): void {
    this.notificationService.markAsRead(notification.id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  clearAll(): void {
    this.notificationService.clearNotifications();
  }

  getIcon(type: string): string {
    switch (type) {
      case 'new_message': return 'message';
      case 'group_invite': return 'group_add';
      case 'group_removed': return 'group_remove';
      case 'user_online': return 'person';
      case 'mention': return 'alternate_email';
      case 'contactRequest': return 'person_add';
      case 'contactAccepted': return 'how_to_reg';
      case 'contactRequestWithdrawn':
      case 'contactRequestCancelled': return 'person_remove';
      default: return 'notifications';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'new_message': return 'Message';
      case 'group_invite': return 'Group Invite';
      case 'group_removed': return 'Group';
      case 'user_online': return 'Contact';
      case 'mention': return 'Mention';
      case 'contactRequest': return 'Request';
      case 'contactAccepted': return 'Accepted';
      case 'contactRequestWithdrawn':
      case 'contactRequestCancelled': return 'Withdrawn';
      default: return 'System';
    }
  }
}
