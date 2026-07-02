import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root'
})
export class PresenceService {

  private onlineUsersSubject = new BehaviorSubject<Set<string>>(new Set());
  public onlineUsers$ = this.onlineUsersSubject.asObservable();

  constructor(private socketService: SocketService) {
    this.socketService.onlineUsers$.subscribe(users => {
      this.onlineUsersSubject.next(new Set(users));
    });
  }

  isOnline(userId: string): boolean {
    return this.onlineUsersSubject.value.has(userId);
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.onlineUsersSubject.value);
  }
}
