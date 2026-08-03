import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
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
    return this.http.get<any>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.NOTIFICATIONS.BASE}`,
      { params: { page: page.toString(), limit: limit.toString(), includeRead: 'true' } }
    ).pipe(
      map(response => this.extractNotifications(response)),
      tap(notifications => {
        this.notificationsSubject.next(notifications);
        this.recalculateUnread(notifications);
      }),
      catchError(() => {
        this.notificationsSubject.next([]);
        this.recalculateUnread([]);
        return of([]);
      })
    );
  }

  /**
   * Fetch unread count from server.
   */
  loadUnreadCount(): Observable<number> {
    return this.http.get<any>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT}`
    ).pipe(
      map(response => this.extractUnreadCount(response)),
      tap(count => this.unreadCountSubject.next(count)),
      catchError(() => {
        this.unreadCountSubject.next(0);
        return of(0);
      })
    );
  }

  /**
   * Add a notification locally (from socket push).
   */
  addNotification(notification: INotification): void {
    const normalized = this.normalize(notification);
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([normalized, ...current]);
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    this.newNotificationSubject.next(normalized);
  }

  /**
   * Mark single notification as read (HTTP + local update).
   */
  markAsRead(notificationId: string): void {
    if (!notificationId) { return; }
    const id = String(notificationId);

    // Optimistic local clear so badge drops immediately
    const current = this.notificationsSubject.value;
    const updated = current.map(n =>
      String(n.id || n.notificationId || '') === id ? { ...n, isRead: true } : n
    );
    this.notificationsSubject.next(updated);
    this.recalculateUnread(updated);

    this.http.put(
      `${environment.apiBaseUrl}${API_ENDPOINTS.NOTIFICATIONS.READ}/${id}/read`,
      {}
    ).subscribe({
      error: () => {
        // keep optimistic read state; badge already cleared
      }
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

  private extractNotifications(response: any): INotification[] {
    const payload = response?.data ?? response?.notifications ?? response ?? [];
    const list = Array.isArray(payload) ? payload : (payload?.items ?? payload?.results ?? []);
    return (list || []).map(n => this.normalize(n));
  }

  private extractUnreadCount(response: any): number {
    const payload = response?.data ?? response;
    const count = payload?.unreadCount ?? payload?.count ?? payload?.unread ?? 0;
    return typeof count === 'number' ? count : Number(count || 0);
  }

  /**
   * Normalizes a server/socket notification to the shape the UI expects:
   * maps notificationId->id and body->message, coerces isRead to boolean.
   */
  private normalize(n: any): INotification {
    const title = n.title || n.message || n.body || 'Notification';
    const body = n.body || n.message || n.title || '';
    return {
      ...n,
      id: n.id || n.notificationId || n._id,
      title,
      message: body,
      isRead: n.isRead === true || n.isRead === 1 || n.read === true,
      createdAt: n.createdAt ? new Date(n.createdAt) : new Date()
    } as INotification;
  }

  private listenToSocketNotifications(): void {
    this.socketService.notification$.subscribe(notification => {
      this.addNotification(notification);
    });
  }
}
