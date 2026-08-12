import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api.constants';
import { IApiResponse } from '../models/api-response.model';
import {
  IAdminDashboardOverview,
  IAdminManagedUser,
  IFakerGenerateResult,
  IFakerPreviewUser,
  IFakerPreviewContact,
  IFakerPreviewGroup,
  IFakerPreviewMessage,
  IFakerSaveResult,
  IFakerEntitySaveResult,
  IFakerLinkUser
} from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  constructor(private http: HttpClient) {}

  getDashboardOverview(): Observable<IAdminDashboardOverview> {
    return this.http.get<IApiResponse<IAdminDashboardOverview>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.DASHBOARD.OVERVIEW}`
    ).pipe(map(r => r.data));
  }

  listUsers(query: {
    page?: number; limit?: number; search?: string; status?: string; role?: string;
  } = {}): Observable<{ users: IAdminManagedUser[]; meta: any }> {
    let params = new HttpParams();
    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, String(val));
      }
    });
    return this.http.get<IApiResponse<IAdminManagedUser[]>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.USERS.BASE}`,
      { params }
    ).pipe(map(r => ({ users: r.data || [], meta: r.meta || {} })));
  }

  getUser(userId: string): Observable<IAdminManagedUser> {
    return this.http.get<IApiResponse<IAdminManagedUser>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.USERS.BY_ID}/${userId}`
    ).pipe(map(r => r.data));
  }

  updateUserStatus(userId: string, status: string): Observable<IAdminManagedUser> {
    return this.http.patch<IApiResponse<IAdminManagedUser>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.USERS.STATUS}/${userId}/status`,
      { status }
    ).pipe(map(r => r.data));
  }

  // Users faker
  generateUsers(body: { count: number; defaultPassword?: string; role?: string; status?: string; }): Observable<IFakerGenerateResult> {
    return this.http.post<IApiResponse<IFakerGenerateResult>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.USERS_GENERATE}`, body
    ).pipe(map(r => r.data));
  }

  updateFakerUser(previewId: string, tempId: string, patch: Partial<IFakerPreviewUser>): Observable<IFakerPreviewUser> {
    return this.http.patch<IApiResponse<IFakerPreviewUser>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.USERS_PREVIEW}/${previewId}/${tempId}`, patch
    ).pipe(map(r => r.data));
  }

  deleteFakerUser(previewId: string, tempId: string): Observable<{ remaining: number }> {
    return this.http.delete<IApiResponse<{ remaining: number }>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.USERS_PREVIEW}/${previewId}/${tempId}`
    ).pipe(map(r => r.data));
  }

  regenerateFakerUser(previewId: string, tempId: string): Observable<IFakerPreviewUser> {
    return this.http.post<IApiResponse<IFakerPreviewUser>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.USERS_PREVIEW}/${previewId}/${tempId}/regenerate`, {}
    ).pipe(map(r => r.data));
  }

  discardFakerPreview(previewId: string, entity: 'users' | 'contacts' | 'groups' | 'messages' = 'users'): Observable<any> {
    const base =
      entity === 'contacts' ? API_ENDPOINTS.ADMIN.FAKER.CONTACTS_PREVIEW :
      entity === 'groups' ? API_ENDPOINTS.ADMIN.FAKER.GROUPS_PREVIEW :
      entity === 'messages' ? API_ENDPOINTS.ADMIN.FAKER.MESSAGES_PREVIEW :
      API_ENDPOINTS.ADMIN.FAKER.USERS_PREVIEW;
    return this.http.delete<IApiResponse<any>>(
      `${environment.apiBaseUrl}${base}/${previewId}`
    ).pipe(map(r => r.data));
  }

  saveFakerUsers(previewId: string): Observable<IFakerSaveResult> {
    return this.http.post<IApiResponse<IFakerSaveResult>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.USERS_SAVE}`, { previewId }
    ).pipe(map(r => r.data));
  }

  // Contacts
  listContactLinkUsers(query: { search?: string; limit?: number } = {}): Observable<{
    users: IFakerLinkUser[];
    total: number;
  }> {
    let params = new HttpParams();
    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, String(val));
      }
    });
    return this.http.get<IApiResponse<{ users: IFakerLinkUser[]; total: number }>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.CONTACTS_USERS}`,
      { params }
    ).pipe(map(r => r.data || { users: [], total: 0 }));
  }

  generateContacts(body: { count: number; mode?: string }): Observable<{
    previewId: string;
    contacts: IFakerPreviewContact[];
    expiresInMinutes: number;
  }> {
    return this.http.post<IApiResponse<any>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.CONTACTS_GENERATE}`, body
    ).pipe(map(r => r.data));
  }

  /**
   * Cartesian link of selected owners × peers into contacts preview (1:1 / 1:N / N:1 / N:M).
   */
  linkContacts(body: {
    userIds: string[];
    contactUserIds: string[];
    mode?: string;
    previewId?: string;
  }): Observable<{
    previewId: string;
    contacts: IFakerPreviewContact[];
    added: number;
    expiresInMinutes: number;
  }> {
    return this.http.post<IApiResponse<any>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.CONTACTS_LINK}`, body
    ).pipe(map(r => r.data));
  }

  updateFakerContact(
    previewId: string,
    tempId: string,
    patch: Partial<Pick<IFakerPreviewContact, 'userId' | 'contactUserId' | 'mode'>>
  ): Observable<IFakerPreviewContact> {
    return this.http.patch<IApiResponse<IFakerPreviewContact>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.CONTACTS_PREVIEW}/${previewId}/${tempId}`,
      patch
    ).pipe(map(r => r.data));
  }

  deleteFakerContact(previewId: string, tempId: string): Observable<{ remaining: number }> {
    return this.http.delete<IApiResponse<{ remaining: number }>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.CONTACTS_PREVIEW}/${previewId}/${tempId}`
    ).pipe(map(r => r.data));
  }

  regenerateFakerContact(previewId: string, tempId: string): Observable<IFakerPreviewContact> {
    return this.http.post<IApiResponse<IFakerPreviewContact>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.CONTACTS_PREVIEW}/${previewId}/${tempId}/regenerate`, {}
    ).pipe(map(r => r.data));
  }

  saveFakerContacts(previewId: string): Observable<IFakerEntitySaveResult> {
    return this.http.post<IApiResponse<IFakerEntitySaveResult>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.CONTACTS_SAVE}`, { previewId }
    ).pipe(map(r => r.data));
  }

  // Groups
  generateGroups(body: { count: number; membersPerGroup?: number }): Observable<{
    previewId: string;
    groups: IFakerPreviewGroup[];
    expiresInMinutes: number;
  }> {
    return this.http.post<IApiResponse<any>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.GROUPS_GENERATE}`, body
    ).pipe(map(r => r.data));
  }

  deleteFakerGroup(previewId: string, tempId: string): Observable<{ remaining: number }> {
    return this.http.delete<IApiResponse<{ remaining: number }>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.GROUPS_PREVIEW}/${previewId}/${tempId}`
    ).pipe(map(r => r.data));
  }

  regenerateFakerGroup(previewId: string, tempId: string): Observable<IFakerPreviewGroup> {
    return this.http.post<IApiResponse<IFakerPreviewGroup>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.GROUPS_PREVIEW}/${previewId}/${tempId}/regenerate`, {}
    ).pipe(map(r => r.data));
  }

  updateFakerGroup(previewId: string, tempId: string, patch: Partial<IFakerPreviewGroup>): Observable<IFakerPreviewGroup> {
    return this.http.patch<IApiResponse<IFakerPreviewGroup>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.GROUPS_PREVIEW}/${previewId}/${tempId}`, patch
    ).pipe(map(r => r.data));
  }

  saveFakerGroups(previewId: string): Observable<IFakerEntitySaveResult> {
    return this.http.post<IApiResponse<IFakerEntitySaveResult>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.GROUPS_SAVE}`, { previewId }
    ).pipe(map(r => r.data));
  }

  // Messages
  generateMessages(body: { count: number; messageType?: string }): Observable<{
    previewId: string;
    messages: IFakerPreviewMessage[];
    expiresInMinutes: number;
  }> {
    return this.http.post<IApiResponse<any>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.MESSAGES_GENERATE}`, body
    ).pipe(map(r => r.data));
  }

  deleteFakerMessage(previewId: string, tempId: string): Observable<{ remaining: number }> {
    return this.http.delete<IApiResponse<{ remaining: number }>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.MESSAGES_PREVIEW}/${previewId}/${tempId}`
    ).pipe(map(r => r.data));
  }

  regenerateFakerMessage(previewId: string, tempId: string): Observable<IFakerPreviewMessage> {
    return this.http.post<IApiResponse<IFakerPreviewMessage>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.MESSAGES_PREVIEW}/${previewId}/${tempId}/regenerate`, {}
    ).pipe(map(r => r.data));
  }

  saveFakerMessages(previewId: string): Observable<IFakerEntitySaveResult> {
    return this.http.post<IApiResponse<IFakerEntitySaveResult>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.ADMIN.FAKER.MESSAGES_SAVE}`, { previewId }
    ).pipe(map(r => r.data));
  }
}
