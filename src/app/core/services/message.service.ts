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

  /**
   * BE returns senderFirstName/senderLastName/senderUsername/senderAvatarUrl.
   * FE bubbles need senderName + senderAvatar.
   */
  normalizeMessage(raw: any): IMessage {
    if (!raw) { return raw; }
    const first = (raw.senderFirstName || raw.firstName || '').toString().trim();
    const last = (raw.senderLastName || raw.lastName || '').toString().trim();
    const fromParts = [first, last].filter(Boolean).join(' ').trim();
    const senderName = (
      raw.senderName ||
      fromParts ||
      raw.senderUsername ||
      raw.username ||
      ''
    ).toString().trim();
    const senderAvatar = (
      raw.senderAvatar ||
      raw.senderAvatarUrl ||
      raw.avatarUrl ||
      ''
    ).toString();

    return {
      ...raw,
      messageId: raw.messageId != null ? String(raw.messageId) : raw.messageId,
      conversationId: raw.conversationId != null ? String(raw.conversationId) : raw.conversationId,
      senderId: raw.senderId != null ? String(raw.senderId) : raw.senderId,
      senderName: senderName || undefined,
      senderAvatar: senderAvatar || undefined
    } as IMessage;
  }

  sendMessage(data: ISendMessage): Observable<IMessage> {
    return this.http.post<IApiResponse<IMessage>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.MESSAGES.BASE}`,
      data
    ).pipe(map(response => this.normalizeMessage(response.data)));
  }

  getMessages(conversationId: string, page: number = 1, limit: number = 50): Observable<IMessage[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<IApiResponse<IMessage[]>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.MESSAGES.BY_CONVERSATION}/${conversationId}`,
      { params }
    ).pipe(
      map(response => (response.data || []).map(m => this.normalizeMessage(m)))
    );
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
