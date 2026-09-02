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
    // Full online_users_list from server is authoritative for peer set.
    // Do not wipe known-online peers when list arrives empty (Redis miss / race).
    this.socketService.onlineUsers$.subscribe(users => {
      const normalized = (users || []).map(u => String(u)).filter(Boolean);
      if (normalized.length === 0) {
        // Keep current set; empty list is not proof everyone went offline.
        return;
      }
      this.onlineUsersSubject.next(new Set(normalized));
      normalized.forEach(id => this.lastSeenMap.delete(id));
    });

    // Explicit USER_OFFLINE only (all tabs closed / logout)
    this.socketService.userOffline$.subscribe(data => {
      if (!data?.userId) { return; }
      const id = String(data.userId);
      const current = new Set(this.onlineUsersSubject.value);
      current.delete(id);
      this.onlineUsersSubject.next(current);
      this.lastSeenMap.set(id, data.timestamp || Date.now());
    });

    // Explicit USER_ONLINE
    this.socketService.userOnline$.subscribe(data => {
      if (!data?.userId) { return; }
      const id = String(data.userId);
      const current = new Set(this.onlineUsersSubject.value);
      current.add(id);
      this.onlineUsersSubject.next(current);
      this.lastSeenMap.delete(id);
    });

    // Re-seed when socket reconnects (tab switch / refresh recovery)
    this.socketService.connected$.subscribe(connected => {
      if (connected) {
        this.hydrateFromApi();
        this.socketService.getOnlineUsers();
      }
    });

    this.hydrateFromApi();
  }

  /** Pull contacts presence from REST; merges online rows, never clears socket-online peers on soft fail. */
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
          } else if (!online.has(id)) {
            // Only set lastSeen when not already known online via socket
            const ls = row.lastSeen;
            if (ls != null) {
              const ms = typeof ls === 'number' ? ls : Date.parse(String(ls));
              if (!isNaN(ms)) {
                this.lastSeenMap.set(id, ms);
              }
            }
          }
        });
        // Do not remove socket-online peers just because REST said offline (stale Redis)
        this.onlineUsersSubject.next(online);
        this.hydrated = true;
      },
      () => {
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
