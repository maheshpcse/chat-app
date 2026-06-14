import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import * as io from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { SOCKET_EVENTS } from '../constants/socket-events.constants';
import { AuthService } from './auth.service';
import { IMessage, ITypingEvent } from '../models/message.model';

/**
 * SocketService - Manages Socket.IO connection and real-time events.
 *
 * Angular Concepts Used:
 * - @Injectable providedIn 'root' (singleton across app)
 * - Subject (multicast event emitter for typing, notifications)
 * - BehaviorSubject (online users list - always has current value)
 * - Observable (streams of socket events exposed to components)
 * - RxJS operators used in consumers
 */
@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket: any;

  // Subjects for different event streams
  private messageReceivedSubject = new Subject<IMessage>();
  private typingSubject = new Subject<ITypingEvent>();
  private onlineUsersSubject = new BehaviorSubject<string[]>([]);
  private notificationSubject = new Subject<any>();
  private readReceiptSubject = new Subject<{ conversationId: string; userId: string }>();

  // Public observables for components to subscribe
  public messageReceived$ = this.messageReceivedSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public onlineUsers$ = this.onlineUsersSubject.asObservable();
  public notification$ = this.notificationSubject.asObservable();
  public readReceipt$ = this.readReceiptSubject.asObservable();

  constructor(private authService: AuthService) {}

  // ===========================
  // Connection Management
  // ===========================

  /**
   * Connect socket after successful login.
   * Passes JWT token for server-side authentication.
   */
  connect(): void {
    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    this.socket = io.connect(environment.socketUrl, {
      query: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.setupSocketListeners();
  }

  /**
   * Disconnect socket on logout.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if socket is currently connected.
   */
  isConnected(): boolean {
    return this.socket && this.socket.connected;
  }

  // ===========================
  // Room Management
  // ===========================

  joinConversation(conversationId: string): void {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, { conversationId });
    }
  }

  leaveConversation(conversationId: string): void {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, { conversationId });
    }
  }

  // ===========================
  // Message Events
  // ===========================

  sendMessage(message: any): void {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.SEND_MESSAGE, message);
    }
  }

  // ===========================
  // Typing Events
  // ===========================

  emitTypingStart(conversationId: string): void {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.TYPING_START, { conversationId });
    }
  }

  emitTypingStop(conversationId: string): void {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.TYPING_STOP, { conversationId });
    }
  }

  // ===========================
  // Read Receipts
  // ===========================

  markAsRead(conversationId: string): void {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.MARK_AS_READ, { conversationId });
    }
  }

  // ===========================
  // Online Status
  // ===========================

  getOnlineUsers(): void {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.GET_ONLINE_USERS);
    }
  }

  // ===========================
  // Private: Socket Listeners
  // ===========================

  private setupSocketListeners(): void {
    // Receive new message
    this.socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, (message: IMessage) => {
      this.messageReceivedSubject.next(message);
    });

    // Typing indicators
    this.socket.on(SOCKET_EVENTS.TYPING_START, (data: ITypingEvent) => {
      this.typingSubject.next({ ...data, isTyping: true });
    });

    this.socket.on(SOCKET_EVENTS.TYPING_STOP, (data: ITypingEvent) => {
      this.typingSubject.next({ ...data, isTyping: false });
    });

    // Online/offline status
    this.socket.on(SOCKET_EVENTS.USER_ONLINE, (data: { userId: string }) => {
      const current = this.onlineUsersSubject.value;
      if (!current.includes(data.userId)) {
        this.onlineUsersSubject.next([...current, data.userId]);
      }
    });

    this.socket.on(SOCKET_EVENTS.USER_OFFLINE, (data: { userId: string }) => {
      const current = this.onlineUsersSubject.value;
      this.onlineUsersSubject.next(current.filter(id => id !== data.userId));
    });

    this.socket.on(SOCKET_EVENTS.ONLINE_USERS_LIST, (users: string[]) => {
      this.onlineUsersSubject.next(users);
    });

    // Read receipts
    this.socket.on(SOCKET_EVENTS.READ_RECEIPT, (data: { conversationId: string; userId: string }) => {
      this.readReceiptSubject.next(data);
    });

    // Notifications
    this.socket.on(SOCKET_EVENTS.NOTIFICATION, (notification: any) => {
      this.notificationSubject.next(notification);
    });

    // Connection events
    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected');
      this.getOnlineUsers();
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on(SOCKET_EVENTS.CONNECTION_ERROR, (error: any) => {
      console.error('Socket connection error:', error);
    });
  }
}
