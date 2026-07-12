import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { INotification } from '../models/notification.model';
import { IApiResponse } from '../models/api-response.model';
import { SocketService } from './socket.service';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api.constants';

/**
 * NotificationService - Manages in-app notifications via HTTP + socket.
 *
 * Angular Concepts Used:
 * - BehaviorSubject (holds notification list with current value)
 * - Subject (new notification event stream)
 * - HttpClient for API integration
 * - Socket subscription for real-time push
 * - tap operator for side-effects
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

  constructor(
    private http: HttpClient,
    private socketService: SocketService
  ) {
    this.listenToSocketNotifications();
  }

  // ==========================================
  // HTTP API Methods
  // ==========================================

  /**
   * Load notifications from server on app init.
   */
  loadNotifications(page: number = 1, limit: number = 20): Observable<INotification[]> {
    return this.http.get<IApiResponse<INotification[]>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.NOTIFICATIONS.BASE}`,
      { params: { page: page.toString(), limit: limit.toString() } }
    ).pipe(
      map(response => response.data),
      tap(notifications => {
        this.notificationsSubject.next(notifications);
        this.recalculateUnread(notifications);
      })
    );
  }

  /**
   * Fetch unread count from server.
   */
  loadUnreadCount(): Observable<number> {
    return this.http.get<IApiResponse<{ unreadCount: number }>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT}`
    ).pipe(
      map(response => response.data.unreadCount),
      tap(count => this.unreadCountSubject.next(count))
    );
  }

  /**
   * Add a notification locally (from socket push).
   */
  addNotification(notification: INotification): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    this.newNotificationSubject.next(notification);
  }

  /**
   * Mark single notification as read (HTTP + local update).
   */
  markAsRead(notificationId: string): void {
    this.http.put(
      `${environment.apiBaseUrl}${API_ENDPOINTS.NOTIFICATIONS.READ}/${notificationId}/read`,
      {}
    ).subscribe(() => {
      const current = this.notificationsSubject.value;
      const updated = current.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      this.notificationsSubject.next(updated);
      this.recalculateUnread(updated);
    });
  }

  /**
   * Mark all notifications as read (HTTP + local update).
   */
  markAllAsRead(): void {
    this.http.put(
      `${environment.apiBaseUrl}${API_ENDPOINTS.NOTIFICATIONS.READ_ALL}`,
      {}
    ).subscribe(() => {
      const current = this.notificationsSubject.value;
      const updated = current.map(n => ({ ...n, isRead: true }));
      this.notificationsSubject.next(updated);
      this.unreadCountSubject.next(0);
    });
  }

  /**
   * Clear all notifications (HTTP + local clear).
   */
  clearNotifications(): void {
    this.http.delete(
      `${environment.apiBaseUrl}${API_ENDPOINTS.NOTIFICATIONS.CLEAR}`
    ).subscribe(() => {
      this.notificationsSubject.next([]);
      this.unreadCountSubject.next(0);
    });
  }

  // ==========================================
  // Private Helpers
  // ==========================================

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
