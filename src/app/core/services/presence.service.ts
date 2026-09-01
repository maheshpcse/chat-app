import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { SocketService } from './socket.service';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api.constants';
import { IApiResponse } from '../models/api-response.model';

export interface IPresenceRow {
  userId: string;
  isOnline: boolean;
  lastSeen?: string | number | null;
  privacyHidden?: boolean;
}

/**
 * PresenceService - Tracks user online status and last-seen timestamps.
 * Seeds from HTTP /presence/contacts (privacy-aware), then stays live via sockets.
 */
@Injectable({
  providedIn: 'root'
})
export class PresenceService {

  private onlineUsersSubject = new BehaviorSubject<Set<string>>(new Set());
  public onlineUsers$ = this.onlineUsersSubject.asObservable();

  /** Map of userId => last-seen timestamp (epoch ms) */
  private lastSeenMap: Map<string, number> = new Map();

  private hydrated = false;

  constructor(
    private socketService: SocketService,
    private http: HttpClient
  ) {
    // Sync online users list (normalize ids to string)
    this.socketService.onlineUsers$.subscribe(users => {
      const normalized = (users || []).map(u => String(u));
      // Merge with existing set so HTTP seed is not wiped by empty socket list
      const merged = new Set(this.onlineUsersSubject.value);
      normalized.forEach(id => merged.add(id));
      // If socket sent a full list, prefer it as source of truth for online set
      if (normalized.length > 0 || this.hydrated) {
        this.onlineUsersSubject.next(new Set(normalized.length ? normalized : Array.from(merged)));
      }
    });

    // Track when a user goes offline — store their lastSeen timestamp
    this.socketService.userOffline$.subscribe(data => {
      if (!data?.userId) { return; }
      const id = String(data.userId);
      const current = new Set(this.onlineUsersSubject.value);
      current.delete(id);
      this.onlineUsersSubject.next(current);
      this.lastSeenMap.set(id, data.timestamp || Date.now());
    });

    // When user comes online, remove their lastSeen entry
    this.socketService.userOnline$.subscribe(data => {
      if (!data?.userId) { return; }
      const id = String(data.userId);
      const current = new Set(this.onlineUsersSubject.value);
      current.add(id);
      this.onlineUsersSubject.next(current);
      this.lastSeenMap.delete(id);
    });

    // One-shot HTTP seed (privacy-filtered contacts presence)
    this.hydrateFromApi();
  }

  /** Pull contacts presence from REST; safe to call multiple times. */
  hydrateFromApi(): void {
    this.http.get<IApiResponse<IPresenceRow[]>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.PRESENCE.CONTACTS}`
    ).subscribe(
      (response) => {
        const rows = response?.data || [];
        const online = new Set(this.onlineUsersSubject.value);
        rows.forEach(row => {
          if (!row || row.userId == null) { return; }
          const id = String(row.userId);
          if (row.isOnline) {
            online.add(id);
            this.lastSeenMap.delete(id);
          } else {
            online.delete(id);
            const ls = row.lastSeen;
            if (ls != null) {
              const ms = typeof ls === 'number' ? ls : Date.parse(String(ls));
              if (!isNaN(ms)) {
                this.lastSeenMap.set(id, ms);
              }
            }
          }
        });
        this.onlineUsersSubject.next(online);
        this.hydrated = true;
      },
      () => {
        // Soft-fail — sockets still drive presence
        this.hydrated = true;
      }
    );
  }

  isOnline(userId: string): boolean {
    if (userId == null || userId === '') { return false; }
    return this.onlineUsersSubject.value.has(String(userId));
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.onlineUsersSubject.value);
  }

  /**
   * Get the last-seen timestamp for a user.
   * Returns null if the user is currently online or never tracked.
   */
  getLastSeen(userId: string): Date | null {
    if (userId == null || userId === '') { return null; }
    const id = String(userId);
    if (this.isOnline(id)) { return null; }
    const timestamp = this.lastSeenMap.get(id);
    return timestamp ? new Date(timestamp) : null;
  }

  /**
   * Get a human-readable "last seen" string.
   */
  getLastSeenDisplay(userId: string): string {
    if (userId == null || userId === '') { return 'Offline'; }
    const id = String(userId);
    if (this.isOnline(id)) { return 'Online'; }

    const lastSeen = this.lastSeenMap.get(id);
    if (!lastSeen) { return 'Offline'; }

    const diff = Date.now() - lastSeen;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) { return 'Last seen just now'; }
    if (minutes < 60) { return `Last seen ${minutes}m ago`; }
    if (hours < 24) { return `Last seen ${hours}h ago`; }
    if (days < 7) { return `Last seen ${days}d ago`; }

    // Format as date for older than a week
    const date = new Date(lastSeen);
    return `Last seen ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
}
