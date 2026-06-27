import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api.constants';
import { IMessage, ISendMessage } from '../models/message.model';
import { IApiResponse } from '../models/api-response.model';

/**
 * MessageService - HTTP service for message API endpoints.
 *
 * Angular Concepts Used:
 * - HttpClient for REST API calls
 * - Observable streams for async data
 * - HttpParams for pagination
 */
@Injectable({
  providedIn: 'root'
})
export class MessageService {

  constructor(private http: HttpClient) {}

  sendMessage(data: ISendMessage): Observable<IMessage> {
    return this.http.post<IApiResponse<IMessage>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.MESSAGES.BASE}`,
      data
    ).pipe(map(response => response.data));
  }

  getMessages(conversationId: string, page: number = 1, limit: number = 50): Observable<IMessage[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<IApiResponse<IMessage[]>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.MESSAGES.BY_CONVERSATION}/${conversationId}`,
      { params }
    ).pipe(map(response => response.data));
  }

  getUnreadMessages(): Observable<{ unreadCount: number }> {
    return this.http.get<IApiResponse<{ unreadCount: number }>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.MESSAGES.UNREAD}`
    ).pipe(map(response => response.data));
  }

  markAsRead(conversationId: string): Observable<any> {
    return this.http.put<IApiResponse<any>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.MESSAGES.READ}/${conversationId}/read`,
      {}
    ).pipe(map(response => response.data));
  }

  deleteMessage(messageId: string): Observable<any> {
    return this.http.delete<IApiResponse<any>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.MESSAGES.DELETE}/${messageId}`
    ).pipe(map(response => response.data));
  }
}
