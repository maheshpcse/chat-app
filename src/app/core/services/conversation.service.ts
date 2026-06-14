import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api.constants';
import { IConversation, ICreateConversation } from '../models/conversation.model';
import { IApiResponse } from '../models/api-response.model';

/**
 * ConversationService - HTTP service for conversation API endpoints.
 *
 * Angular Concepts Used:
 * - HttpClient for REST calls
 * - HttpParams for query parameters
 * - Observable with map operator
 * - Type-safe API responses with generics
 */
@Injectable({
  providedIn: 'root'
})
export class ConversationService {

  constructor(private http: HttpClient) {}

  createConversation(data: ICreateConversation): Observable<IConversation> {
    return this.http.post<IApiResponse<IConversation>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.CONVERSATIONS.BASE}`,
      data
    ).pipe(map(response => response.data));
  }

  getConversations(page: number = 1, limit: number = 20): Observable<IConversation[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<IApiResponse<IConversation[]>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.CONVERSATIONS.BASE}`,
      { params }
    ).pipe(map(response => response.data));
  }

  getConversationById(conversationId: string): Observable<IConversation> {
    return this.http.get<IApiResponse<IConversation>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.CONVERSATIONS.BY_ID}/${conversationId}`
    ).pipe(map(response => response.data));
  }
}
