import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api.constants';
import { IApiResponse } from '../models/api-response.model';
import {
  IScheduledMessage,
  ICreateScheduledMessage
} from '../models/scheduled-message.model';

/**
 * ScheduledMessageService - HTTP service for scheduled message CRUD.
 *
 * Angular Concepts Used:
 * - HttpClient with typed responses
 * - BehaviorSubject for local state
 * - tap for side-effect state updates
 */
@Injectable({
  providedIn: 'root'
})
export class ScheduledMessageService {

  private scheduledMessagesSubject = new BehaviorSubject<IScheduledMessage[]>([]);
  public scheduledMessages$ = this.scheduledMessagesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Load user's scheduled messages, optionally filtered by status.
   */
  loadScheduledMessages(status?: string): Observable<IScheduledMessage[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<IApiResponse<IScheduledMessage[]>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.SCHEDULED_MESSAGES.BASE}`,
      { params }
    ).pipe(
      map(response => response.data),
      tap(messages => this.scheduledMessagesSubject.next(messages))
    );
  }

  /**
   * Create a new scheduled message.
   */
  createScheduledMessage(data: ICreateScheduledMessage): Observable<IScheduledMessage> {
    return this.http.post<IApiResponse<IScheduledMessage>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.SCHEDULED_MESSAGES.BASE}`,
      data
    ).pipe(
      map(response => response.data),
      tap(newMsg => {
        const current = this.scheduledMessagesSubject.value;
        this.scheduledMessagesSubject.next([newMsg, ...current]);
      })
    );
  }

  /**
   * Cancel a pending scheduled message.
   */
  cancelScheduledMessage(id: string): Observable<void> {
    return this.http.put<IApiResponse<void>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.SCHEDULED_MESSAGES.CANCEL}/${id}/cancel`,
      {}
    ).pipe(
      map(() => void 0),
      tap(() => {
        const current = this.scheduledMessagesSubject.value;
        const updated = current.map(m =>
          m.id === id ? { ...m, status: 'cancelled' as any } : m
        );
        this.scheduledMessagesSubject.next(updated);
      })
    );
  }

  /**
   * Get count of pending scheduled messages.
   */
  getPendingCount(): number {
    return this.scheduledMessagesSubject.value
      .filter(m => m.status === 'pending').length;
  }
}
