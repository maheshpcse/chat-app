import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { INotification } from '../../core/models/notification.model';

/**
 * NotificationListComponent - Shows list of notifications.
 */
@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss']
})
export class NotificationListComponent implements OnInit, OnDestroy {

  notifications: INotification[] = [];
  unreadCount: number = 0;
  private subscriptions: Subscription[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
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
    this.notificationService.markAsRead(notification.id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
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
