import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api.constants';
import { IUser, IUserUpdate, IUserSearch } from '../models/user.model';
import { IApiResponse } from '../models/api-response.model';

/**
 * UserService - HTTP service for user profile and search endpoints.
 *
 * Angular Concepts Used:
 * - HttpClient with typed responses
 * - HttpParams for search queries
 * - map operator for response transformation
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<IUser> {
    return this.http.get<IApiResponse<IUser>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.USERS.ME}`
    ).pipe(map(response => response.data));
  }

  updateMyProfile(data: IUserUpdate): Observable<IUser> {
    return this.http.put<IApiResponse<IUser>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.USERS.ME}`,
      data
    ).pipe(map(response => response.data));
  }

  searchUsers(searchData: IUserSearch): Observable<IUser[]> {
    let params = new HttpParams().set('search', searchData.search);
    if (searchData.page) {
      params = params.set('page', searchData.page.toString());
    }
    if (searchData.limit) {
      params = params.set('limit', searchData.limit.toString());
    }

    return this.http.get<IApiResponse<IUser[]>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.USERS.SEARCH}`,
      { params }
    ).pipe(map(response => response.data));
  }

  getUserById(userId: string): Observable<IUser> {
    return this.http.get<IApiResponse<IUser>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.USERS.BY_ID}/${userId}`
    ).pipe(map(response => response.data));
  }
}
