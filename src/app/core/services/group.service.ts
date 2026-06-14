import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api.constants';
import { IGroup, ICreateGroup, IUpdateGroup, IAddGroupMember } from '../models/group.model';
import { IApiResponse } from '../models/api-response.model';

/**
 * GroupService - HTTP service for group management API endpoints.
 *
 * Angular Concepts Used:
 * - HttpClient for CRUD operations
 * - Observable with pipe and map
 * - Type-safe interfaces for request/response
 */
@Injectable({
  providedIn: 'root'
})
export class GroupService {

  constructor(private http: HttpClient) {}

  createGroup(data: ICreateGroup): Observable<IGroup> {
    return this.http.post<IApiResponse<IGroup>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.GROUPS.BASE}`,
      data
    ).pipe(map(response => response.data));
  }

  getGroups(): Observable<IGroup[]> {
    return this.http.get<IApiResponse<IGroup[]>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.GROUPS.BASE}`
    ).pipe(map(response => response.data));
  }

  getGroupById(groupId: string): Observable<IGroup> {
    return this.http.get<IApiResponse<IGroup>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.GROUPS.BY_ID}/${groupId}`
    ).pipe(map(response => response.data));
  }

  updateGroup(groupId: string, data: IUpdateGroup): Observable<IGroup> {
    return this.http.put<IApiResponse<IGroup>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.GROUPS.BY_ID}/${groupId}`,
      data
    ).pipe(map(response => response.data));
  }

  addMember(groupId: string, data: IAddGroupMember): Observable<any> {
    return this.http.post<IApiResponse<any>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.GROUPS.MEMBERS}/${groupId}/members`,
      data
    ).pipe(map(response => response.data));
  }

  removeMember(groupId: string, userId: string): Observable<any> {
    return this.http.delete<IApiResponse<any>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.GROUPS.MEMBERS}/${groupId}/members/${userId}`
    ).pipe(map(response => response.data));
  }
}
