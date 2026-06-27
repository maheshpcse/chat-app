import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { IContact, IContactRequest } from '../models/contact.model';
import { IApiResponse } from '../models/api-response.model';

/**
 * ContactService - Manages friend/contact requests and contact list.
 */
@Injectable({
  providedIn: 'root'
})
export class ContactService {

  private contactsSubject = new BehaviorSubject<IContact[]>([]);
  public contacts$ = this.contactsSubject.asObservable();

  private receivedRequestsSubject = new BehaviorSubject<IContactRequest[]>([]);
  public receivedRequests$ = this.receivedRequestsSubject.asObservable();

  private sentRequestsSubject = new BehaviorSubject<IContactRequest[]>([]);
  public sentRequests$ = this.sentRequestsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ===========================
  // Contact Requests
  // ===========================

  sendRequest(receiverUserId: string): Observable<IContactRequest> {
    return this.http.post<IApiResponse<IContactRequest>>(
      `${environment.apiBaseUrl}/contacts/request`,
      { receiverUserId }
    ).pipe(map(res => res.data));
  }

  getReceivedRequests(): Observable<IContactRequest[]> {
    return this.http.get<IApiResponse<IContactRequest[]>>(
      `${environment.apiBaseUrl}/contacts/requests/received`
    ).pipe(
      map(res => res.data),
      tap(requests => this.receivedRequestsSubject.next(requests))
    );
  }

  getSentRequests(): Observable<IContactRequest[]> {
    return this.http.get<IApiResponse<IContactRequest[]>>(
      `${environment.apiBaseUrl}/contacts/requests/sent`
    ).pipe(
      map(res => res.data),
      tap(requests => this.sentRequestsSubject.next(requests))
    );
  }

  acceptRequest(requestId: string): Observable<IContactRequest> {
    return this.http.put<IApiResponse<IContactRequest>>(
      `${environment.apiBaseUrl}/contacts/requests/${requestId}/accept`,
      {}
    ).pipe(map(res => res.data));
  }

  rejectRequest(requestId: string): Observable<IContactRequest> {
    return this.http.put<IApiResponse<IContactRequest>>(
      `${environment.apiBaseUrl}/contacts/requests/${requestId}/reject`,
      {}
    ).pipe(map(res => res.data));
  }

  cancelRequest(requestId: string): Observable<IContactRequest> {
    return this.http.put<IApiResponse<IContactRequest>>(
      `${environment.apiBaseUrl}/contacts/requests/${requestId}/cancel`,
      {}
    ).pipe(map(res => res.data));
  }

  // ===========================
  // Contacts
  // ===========================

  getContacts(): Observable<IContact[]> {
    return this.http.get<IApiResponse<IContact[]>>(
      `${environment.apiBaseUrl}/contacts`
    ).pipe(
      map(res => res.data),
      tap(contacts => this.contactsSubject.next(contacts))
    );
  }

  removeContact(contactUserId: string): Observable<any> {
    return this.http.delete<IApiResponse<any>>(
      `${environment.apiBaseUrl}/contacts/${contactUserId}`
    ).pipe(map(res => res.data));
  }

  // ===========================
  // Local State Helpers
  // ===========================

  addContactLocally(contact: IContact): void {
    const current = this.contactsSubject.value;
    this.contactsSubject.next([...current, contact]);
  }

  removeReceivedRequest(requestId: string): void {
    const current = this.receivedRequestsSubject.value;
    this.receivedRequestsSubject.next(current.filter(r => r.requestId !== requestId));
  }

  removeSentRequest(requestId: string): void {
    const current = this.sentRequestsSubject.value;
    this.sentRequestsSubject.next(current.filter(r => r.requestId !== requestId));
  }
}
