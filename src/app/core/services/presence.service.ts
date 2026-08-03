import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SocketService } from './socket.service';

/**
 * PresenceService - Tracks user online status and last-seen timestamps.
 *
 * Angular Concepts Used:
 * - BehaviorSubject (always holds current value for online users set)
 * - Map for lastSeen timestamp storage (efficient O(1) lookup)
 * - Socket subscriptions for real-time presence events
 */
@Injectable({
  providedIn: 'root'
})
export class PresenceService {

  private onlineUsersSubject = new BehaviorSubject<Set<string>>(new Set());
  public onlineUsers$ = this.onlineUsersSubject.asObservable();

  /** Map of userId => last-seen timestamp (epoch ms) */
  private lastSeenMap: Map<string, number> = new Map();

  constructor(private socketService: SocketService) {
    // Sync online users list (normalize ids to string)
    this.socketService.onlineUsers$.subscribe(users => {
      const normalized = (users || []).map(u => String(u));
      this.onlineUsersSubject.next(new Set(normalized));
    });

    // Track when a user goes offline — store their lastSeen timestamp
    this.socketService.userOffline$.subscribe(data => {
      if (!data?.userId) { return; }
      this.lastSeenMap.set(String(data.userId), data.timestamp);
    });

    // When user comes online, remove their lastSeen entry
    this.socketService.userOnline$.subscribe(data => {
      if (!data?.userId) { return; }
      this.lastSeenMap.delete(String(data.userId));
    });
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
