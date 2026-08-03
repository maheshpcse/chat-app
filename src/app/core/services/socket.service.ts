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
  private presenceHeartbeatTimer: any = null;

  // Subjects for different event streams
  private messageReceivedSubject = new Subject<IMessage>();
  private typingSubject = new Subject<ITypingEvent>();
  private onlineUsersSubject = new BehaviorSubject<string[]>([]);
  private connectedSubject = new BehaviorSubject<boolean>(false);
  private notificationSubject = new Subject<any>();
  private readReceiptSubject = new Subject<{ conversationId: string; userId?: string; seenBy?: string; messageIds?: string[] }>();
  private deliveredReceiptSubject = new Subject<{ messageId: string; conversationId: string; status: string; deliveredTo: string }>();
  private contactRequestSubject = new Subject<any>();
  private contactAcceptedSubject = new Subject<any>();
  private contactRejectedSubject = new Subject<any>();
  private contactListUpdatedSubject = new Subject<any>();
  private userOnlineSubject = new Subject<{ userId: string; timestamp: number }>();
  private userOfflineSubject = new Subject<{ userId: string; timestamp: number }>();

  // Public observables for components to subscribe
  public messageReceived$ = this.messageReceivedSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public onlineUsers$ = this.onlineUsersSubject.asObservable();
  public connected$ = this.connectedSubject.asObservable();
  public notification$ = this.notificationSubject.asObservable();
  public readReceipt$ = this.readReceiptSubject.asObservable();
  public deliveredReceipt$ = this.deliveredReceiptSubject.asObservable();
  public contactRequest$ = this.contactRequestSubject.asObservable();
  public contactAccepted$ = this.contactAcceptedSubject.asObservable();
  public contactRejected$ = this.contactRejectedSubject.asObservable();
  public contactListUpdated$ = this.contactListUpdatedSubject.asObservable();
  public userOnline$ = this.userOnlineSubject.asObservable();
  public userOffline$ = this.userOfflineSubject.asObservable();

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

    // auth.token preferred (Socket.IO v3/v4); query kept for older servers
    this.socket = io.connect(environment.socketUrl, {
      auth: { token },
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
    this.stopPresenceHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectedSubject.next(false);
    this.onlineUsersSubject.next([]);
  }

  /**
   * Check if socket is currently connected.
   */
  isConnected(): boolean {
    return !!(this.socket && this.socket.connected);
  }

  /** Snapshot of known online user ids (string-normalized). */
  getOnlineUserIdsSnapshot(): string[] {
    return this.onlineUsersSubject.value.map(String);
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

  /**
   * Acknowledge delivery of a received message so the sender's UI can advance
   * from "sent" to "delivered".
   */
  markDelivered(messageId: string, conversationId: string): void {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.MESSAGE_DELIVERED, { messageId, conversationId });
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

  /** Keep server Redis online TTL alive while any page open (TTL 1h; pulse every 60s). */
  private startPresenceHeartbeat(): void {
    this.stopPresenceHeartbeat();
    if (!this.socket) { return; }
    this.socket.emit('presence_heartbeat');
    this.getOnlineUsers();
    this.presenceHeartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('presence_heartbeat');
      }
    }, 60000);
  }

  private stopPresenceHeartbeat(): void {
    if (this.presenceHeartbeatTimer) {
      clearInterval(this.presenceHeartbeatTimer);
      this.presenceHeartbeatTimer = null;
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

    // Online/offline status (normalize ids to string for Set/includes match)
    this.socket.on(SOCKET_EVENTS.USER_ONLINE, (data: { userId: string; timestamp?: number }) => {
      if (!data?.userId) { return; }
      const userId = String(data.userId);
      const current = this.onlineUsersSubject.value.map(String);
      if (!current.includes(userId)) {
        this.onlineUsersSubject.next([...current, userId]);
      }
      this.userOnlineSubject.next({
        userId,
        timestamp: data.timestamp || Date.now()
      });
    });

    this.socket.on(SOCKET_EVENTS.USER_OFFLINE, (data: { userId: string; timestamp?: number; lastSeen?: string }) => {
      if (!data?.userId) { return; }
      const userId = String(data.userId);
      const current = this.onlineUsersSubject.value.map(String);
      this.onlineUsersSubject.next(current.filter(id => id !== userId));
      this.userOfflineSubject.next({
        userId,
        timestamp: data.timestamp || (data.lastSeen ? Date.parse(data.lastSeen) : Date.now())
      });
    });

    this.socket.on(SOCKET_EVENTS.ONLINE_USERS_LIST, (users: string[]) => {
      const list = Array.isArray(users) ? users.map(u => String(u)) : [];
      this.onlineUsersSubject.next(list);
    });

    // Read receipts
    this.socket.on(SOCKET_EVENTS.READ_RECEIPT, (data: { conversationId: string; userId: string }) => {
      this.readReceiptSubject.next(data);
    });

    // Delivery receipts
    this.socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, (data: { messageId: string; conversationId: string; status: string; deliveredTo: string }) => {
      this.deliveredReceiptSubject.next(data);
    });

    // Notifications
    this.socket.on(SOCKET_EVENTS.NOTIFICATION, (notification: any) => {
      this.notificationSubject.next(notification);
    });

    // Contact events
    this.socket.on(SOCKET_EVENTS.CONTACT_REQUEST_RECEIVED, (data: any) => {
      this.contactRequestSubject.next(data);
    });

    this.socket.on(SOCKET_EVENTS.CONTACT_REQUEST_ACCEPTED, (data: any) => {
      this.contactAcceptedSubject.next(data);
    });

    this.socket.on(SOCKET_EVENTS.CONTACT_REQUEST_REJECTED, (data: any) => {
      this.contactRejectedSubject.next(data);
    });

    this.socket.on(SOCKET_EVENTS.CONTACT_LIST_UPDATED, (data: any) => {
      this.contactListUpdatedSubject.next(data);
    });

    // Connection events
    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected');
      this.connectedSubject.next(true);
      this.getOnlineUsers();
      this.startPresenceHeartbeat();
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
      console.log('Socket disconnected:', reason);
      this.connectedSubject.next(false);
      this.stopPresenceHeartbeat();
    });

    this.socket.on(SOCKET_EVENTS.CONNECTION_ERROR, (error: any) => {
      console.error('Socket connection error:', error);
    });
  }
}
