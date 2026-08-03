import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { INotification } from '../../core/models/notification.model';
import { withMinLoading, MIN_LOADING_PAGE_MS } from '../../shared/utilities/min-loading.util';

/**
 * NotificationListComponent - Shows list of notifications.
 */
@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss']
})
export class NotificationListComponent implements OnInit, OnDestroy {

  @Output() viewAll = new EventEmitter<void>();
  /** Item click: mark read + open full Notifications page (parent closes panel). */
  @Output() itemOpen = new EventEmitter<void>();

  notifications: INotification[] = [];
  unreadCount: number = 0;
  isLoading = true;
  private subscriptions: Subscription[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.isLoading = true;
    // Seed from server; min 0.5s shimmer so panel fade does not flash empty.
    withMinLoading(
      this.notificationService.loadNotifications(1, 20),
      MIN_LOADING_PAGE_MS
    ).subscribe(
      () => { this.isLoading = false; },
      () => { this.isLoading = false; }
    );
    this.notificationService.loadUnreadCount().subscribe();

    const notifSub = this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });
    this.subscriptions.push(notifSub);

    const countSub = this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    this.subscriptions.push(countSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  markAsRead(notification: INotification): void {
    const id = notification?.id || notification?.notificationId;
    if (id && !notification.isRead) {
      this.notificationService.markAsRead(String(id));
    }
  }

  /** Popup row: clear unread for this item, then open Notifications menu/page. */
  onItemClick(notification: INotification, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.markAsRead(notification);
    this.itemOpen.emit();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  onViewAll(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.viewAll.emit();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'new_message':
      case 'newMessage': return 'message';
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
}
