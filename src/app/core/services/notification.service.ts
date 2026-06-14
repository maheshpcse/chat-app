import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { INotification } from '../models/notification.model';
import { SocketService } from './socket.service';

/**
 * NotificationService - Manages in-app notifications from socket events.
 *
 * Angular Concepts Used:
 * - BehaviorSubject (holds notification list with current value)
 * - Subject (new notification event stream)
 * - Subscription management
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private notificationsSubject = new BehaviorSubject<INotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private newNotificationSubject = new Subject<INotification>();
  public newNotification$ = this.newNotificationSubject.asObservable();

  constructor(private socketService: SocketService) {
    this.listenToSocketNotifications();
  }

  addNotification(notification: INotification): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    this.newNotificationSubject.next(notification);
  }

  markAsRead(notificationId: string): void {
    const current = this.notificationsSubject.value;
    const updated = current.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    this.notificationsSubject.next(updated);
    this.recalculateUnread(updated);
  }

  markAllAsRead(): void {
    const current = this.notificationsSubject.value;
    const updated = current.map(n => ({ ...n, isRead: true }));
    this.notificationsSubject.next(updated);
    this.unreadCountSubject.next(0);
  }

  clearNotifications(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  private recalculateUnread(notifications: INotification[]): void {
    const unread = notifications.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unread);
  }

  private listenToSocketNotifications(): void {
    this.socketService.notification$.subscribe(notification => {
      this.addNotification(notification);
    });
  }
}
