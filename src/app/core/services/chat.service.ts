import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription, of } from 'rxjs';
import { switchMap, map, catchError, finalize } from 'rxjs/operators';
import { IMessage, ISendMessage, ITypingEvent, MessageType } from '../models/message.model';
import { IConversation, ConversationType } from '../models/conversation.model';
import { SocketService } from './socket.service';
import { MessageService } from './message.service';
import { ConversationService } from './conversation.service';
import { AuthService } from './auth.service';

/**
 * ChatService - Orchestrates chat state combining HTTP and Socket services.
 *
 * Angular Concepts Used:
 * - BehaviorSubject for active conversation and messages state
 * - Subject for events (new message received)
 * - Subscription management for cleanup
 * - Combining multiple services (composition pattern)
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {

  // Active conversation state
  private activeConversationSubject = new BehaviorSubject<IConversation | null>(null);
  public activeConversation$ = this.activeConversationSubject.asObservable();

  // Messages for active conversation
  private messagesSubject = new BehaviorSubject<IMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  // Conversations list
  private conversationsSubject = new BehaviorSubject<IConversation[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();

  // Typing users in active conversation
  private typingUsersSubject = new BehaviorSubject<ITypingEvent[]>([]);
  public typingUsers$ = this.typingUsersSubject.asObservable();

  // Message-history loading state (RxJS-driven; consumed by the chat window)
  private messagesLoadingSubject = new BehaviorSubject<boolean>(false);
  public messagesLoading$ = this.messagesLoadingSubject.asObservable();
  private olderLoadingSubject = new BehaviorSubject<boolean>(false);
  public olderLoading$ = this.olderLoadingSubject.asObservable();
  private loadRequestSubject = new Subject<{ conversationId: string; page: number }>();
  private activeRequestKey: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private socketService: SocketService,
    private messageService: MessageService,
    private conversationService: ConversationService,
    private authService: AuthService
  ) {
    this.setupSocketListeners();
    this.setupMessageLoading();
  }

  // ===========================
  // Conversation Management
  // ===========================

  loadConversations(): void {
    this.conversationService.getConversations().subscribe(
      conversations => this.conversationsSubject.next(
        (conversations || []).map(c => this.normalizeConversation(c))
      ),
      () => this.conversationsSubject.next(this.conversationsSubject.value) // re-emit so loading shimmers resolve
    );
  }

  /** Ensure ids + displayName filled (create/find often omit displayName). */
  private normalizeConversation(conv: IConversation, seed?: Partial<IConversation>): IConversation {
    if (!conv) { return conv; }
    const merged: IConversation = { ...conv, ...(seed || {}) };
    if (seed?.participantId && !merged.participantId) {
      merged.participantId = seed.participantId;
    }
    const participantId = merged.participantId != null && merged.participantId !== ''
      ? String(merged.participantId)
      : merged.participantId;

    const first = (merged.firstName || seed?.firstName || '').trim();
    const last = (merged.lastName || seed?.lastName || '').trim();
    const fromParts = [first, last].filter(Boolean).join(' ').trim();
    const rawName = (merged.displayName || seed?.displayName || fromParts || merged.username || seed?.username || '').trim();
    // Guard against literal "undefined" from bad string concat
    const safeName = rawName && !/^undefined(\s+undefined)?$/i.test(rawName)
      ? rawName
      : (fromParts || merged.username || seed?.username || 'Unknown');

    return {
      ...merged,
      conversationId: merged.conversationId != null ? String(merged.conversationId) : merged.conversationId,
      participantId,
      displayName: safeName,
      firstName: first || merged.firstName,
      lastName: last || merged.lastName,
      username: merged.username || seed?.username,
      avatarUrl: merged.avatarUrl || seed?.avatarUrl
    };
  }

  /**
   * Start or open a private conversation with a user.
   * Optional seed fills displayName/avatar when API find/create omits them.
   */
  startPrivateConversation(
    participantId: string,
    seed?: Partial<IConversation>
  ): Observable<IConversation> {
    const peerId = participantId != null ? String(participantId) : '';
    const seedNorm: Partial<IConversation> = {
      ...(seed || {}),
      participantId: peerId,
      conversationType: ConversationType.PRIVATE
    };

    return new Observable(observer => {
      // Check if conversation already exists locally
      const existing = this.conversationsSubject.value.find(conv =>
        conv.conversationType === ConversationType.PRIVATE &&
        String(conv.participantId || '') === peerId
      );

      if (existing) {
        const enriched = this.normalizeConversation(existing, seedNorm);
        this.patchConversationInList(enriched);
        this.setActiveConversation(enriched);
        observer.next(enriched);
        observer.complete();
        return;
      }

      // Create new conversation via API
      this.conversationService.createConversation({
        participantId: peerId
      }).subscribe(
        (conversation) => {
          const enriched = this.normalizeConversation(conversation, seedNorm);
          const current = this.conversationsSubject.value;
          const withoutDup = current.filter(c => c.conversationId !== enriched.conversationId);
          this.conversationsSubject.next([enriched, ...withoutDup]);
          this.setActiveConversation(enriched);
          observer.next(enriched);
          observer.complete();
        },
        (error) => {
          observer.error(error);
        }
      );
    });
  }

  private patchConversationInList(conversation: IConversation): void {
    const current = this.conversationsSubject.value;
    let found = false;
    const updated = current.map(c => {
      if (c.conversationId === conversation.conversationId) {
        found = true;
        return { ...c, ...conversation };
      }
      return c;
    });
    this.conversationsSubject.next(found ? updated : [conversation, ...current]);
  }

  /**
   * Get display name for a conversation.
   */
  getDisplayName(conversation: IConversation): string {
    if (!conversation) { return 'Unknown'; }
    const name = (conversation.displayName
      || [conversation.firstName, conversation.lastName].filter(Boolean).join(' ')
      || conversation.username
      || '').trim();
    if (!name || /^undefined/i.test(name)) { return 'Unknown'; }
    return name;
  }

  /**
   * Get the current active conversation synchronously.
   */
  getActiveConversation(): IConversation | null {
    return this.activeConversationSubject.value;
  }

  setActiveConversation(conversation: IConversation): void {
    // Leave previous conversation room
    const previous = this.activeConversationSubject.value;
    if (previous) {
      this.socketService.leaveConversation(previous.conversationId);
    }

    // Set new active conversation
    const active = this.normalizeConversation(conversation);
    this.activeConversationSubject.next(active);
    this.messagesSubject.next([]); // Clear messages
    this.typingUsersSubject.next([]); // Clear typing indicators
    this.messagesLoadingSubject.next(false);
    this.olderLoadingSubject.next(false);
    this.activeRequestKey = null;

    // Join new conversation room
    this.socketService.joinConversation(active.conversationId);

    // Refresh presence so Online/Offline is current for this peer
    this.socketService.getOnlineUsers();

    // Load messages
    this.loadMessages(active.conversationId);

    // Mark as read
    this.messageService.markAsRead(active.conversationId).subscribe();
    this.socketService.markAsRead(active.conversationId);
  }

  // ===========================
  // Message Management
  // ===========================

  loadMessages(conversationId: string, page: number = 1): void {
    const requestKey = `${conversationId}:${page}`;
    if (this.activeRequestKey === requestKey) {
      return;
    }

    this.activeRequestKey = requestKey;
    this.loadRequestSubject.next({ conversationId, page });
  }

  /**
   * RxJS pipeline for chat history fetching.
   * - switchMap: only the latest requested page/conversation wins
   * - catchError: a failed page never kills the stream
   * - finalize: loading flags always reset, success or error
   */
  private setupMessageLoading(): void {
    const loadSub = this.loadRequestSubject.pipe(
      switchMap(req => {
        const requestKey = `${req.conversationId}:${req.page}`;
        if (req.page === 1) {
          this.messagesLoadingSubject.next(true);
          this.olderLoadingSubject.next(false);
        } else {
          this.olderLoadingSubject.next(true);
          this.messagesLoadingSubject.next(false);
        }
        return this.messageService.getMessages(req.conversationId, req.page).pipe(
          map(messages => ({
            req,
            messages: (messages || []).map(m => this.enrichOwnSender(m))
          })),
          catchError(() => of({ req, messages: [] as IMessage[] })),
          finalize(() => {
            if (this.activeRequestKey === requestKey) {
              this.activeRequestKey = null;
            }
            if (req.page === 1) {
              this.messagesLoadingSubject.next(false);
            } else {
              this.olderLoadingSubject.next(false);
            }
          })
        );
      })
    ).subscribe(({ req, messages }) => {
      if (req.page === 1) {
        this.messagesSubject.next(messages);
      } else {
        // Prepend older messages for pagination
        const current = this.messagesSubject.value;
        this.messagesSubject.next([...messages, ...current]);
      }
    });
    this.subscriptions.push(loadSub);
  }

  /** Fill senderName/avatar for current user's messages when BE omits them. */
  private enrichOwnSender(message: IMessage): IMessage {
    if (!message) { return message; }
    const normalized = this.messageService.normalizeMessage(message);
    const me = this.authService.getCurrentUser();
    if (!me || String(normalized.senderId) !== String(me.id)) {
      return normalized;
    }
    const myName = (
      me.fullName ||
      [me.firstName, me.lastName].filter(Boolean).join(' ').trim() ||
      me.username ||
      ''
    ).trim();
    return {
      ...normalized,
      senderName: normalized.senderName || myName || undefined,
      senderAvatar: normalized.senderAvatar || me.avatarUrl || undefined
    };
  }

  sendMessage(content: string, messageType: MessageType = MessageType.TEXT, attachmentUrl?: string): void {
    const conversation = this.activeConversationSubject.value;
    if (!conversation) { return; }

    const messageData: ISendMessage = {
      conversationId: conversation.conversationId,
      content,
      messageType,
      attachmentUrl
    };

    // Send via HTTP (persists to DB). The backend now broadcasts the saved
    // message over the socket, so we do NOT re-emit it here (avoids duplicates).
    this.messageService.sendMessage(messageData).subscribe(
      message => {
        // Add own message locally; the echoed socket copy is de-duplicated by id.
        const enriched = this.enrichOwnSender(message);
        const current = this.messagesSubject.value;
        this.messagesSubject.next([...current, enriched]);
      },
      () => {
        // Surface a failed send so the bubble can show the error/retry state.
        // Stay in chat — ErrorInterceptor no longer navigates away on 4xx/5xx.
        const me = this.authService.getCurrentUser();
        const myName = me
          ? (me.fullName || [me.firstName, me.lastName].filter(Boolean).join(' ').trim() || me.username || '')
          : '';
        const failed: IMessage = {
          messageId: 'failed-' + Date.now(),
          conversationId: conversation.conversationId,
          senderId: me?.id,
          senderName: myName || undefined,
          senderAvatar: me?.avatarUrl,
          content,
          messageType,
          status: 'failed',
          createdAt: new Date(),
          updatedAt: new Date()
        } as IMessage;
        const current = this.messagesSubject.value;
        this.messagesSubject.next([...current, failed]);
      }
    );
  }

  /**
   * Applies a delivery/read status to a single message by id (immutable update).
   */
  private applyStatusToMessage(messageId: string, status: string): void {
    const messages = this.messagesSubject.value;
    let changed = false;
    const updated = messages.map(m => {
      if (m.messageId === messageId && m.status !== status) {
        changed = true;
        return { ...m, status };
      }
      return m;
    });
    if (changed) {
      this.messagesSubject.next(updated);
    }
  }

  // ===========================
  // Typing Indicators
  // ===========================

  startTyping(): void {    const conversation = this.activeConversationSubject.value;
    if (conversation) {
      this.socketService.emitTypingStart(conversation.conversationId);
    }
  }

  stopTyping(): void {
    const conversation = this.activeConversationSubject.value;
    if (conversation) {
      this.socketService.emitTypingStop(conversation.conversationId);
    }
  }

  // ===========================
  // Cleanup
  // ===========================

  clearActiveConversation(): void {
    const current = this.activeConversationSubject.value;
    if (current) {
      this.socketService.leaveConversation(current.conversationId);
    }
    this.activeConversationSubject.next(null);
    this.messagesSubject.next([]);
    this.typingUsersSubject.next([]);
  }

  // ===========================
  // Private Socket Listeners
  // ===========================

  private setupSocketListeners(): void {
    // Listen for incoming messages (with deduplication)
    const msgSub = this.socketService.messageReceived$.subscribe(rawMessage => {
      const message = this.enrichOwnSender(rawMessage);
      const currentUserId = this.authService.getCurrentUser()?.id;
      const activeConv = this.activeConversationSubject.value;
      if (activeConv && String(message.conversationId) === String(activeConv.conversationId)) {
        const current = this.messagesSubject.value;
        // Deduplicate: don't add if messageId already exists (e.g. sender's own message added via HTTP response)
        const exists = current.some(m => String(m.messageId) === String(message.messageId));
        if (!exists) {
          this.messagesSubject.next([...current, message]);
        }
        // Acknowledge delivery for messages from other users.
        if (String(message.senderId) !== String(currentUserId || '')) {
          this.socketService.markDelivered(message.messageId, message.conversationId);
        }
      }
      // Update conversation list (last message)
      this.updateConversationLastMessage(message);
    });
    this.subscriptions.push(msgSub);

    // Delivery receipts: advance our own sent messages to "delivered".
    const deliveredSub = this.socketService.deliveredReceipt$.subscribe(receipt => {
      this.applyStatusToMessage(receipt.messageId, receipt.status || 'delivered');
    });
    this.subscriptions.push(deliveredSub);

    // Read receipts: mark our sent messages in this conversation as "seen".
    const readSub = this.socketService.readReceipt$.subscribe(receipt => {
      if (receipt.messageIds && receipt.messageIds.length) {
        receipt.messageIds.forEach(id => this.applyStatusToMessage(id, 'seen'));
      } else if (receipt.conversationId) {
        // Fallback: mark all own sent messages in the conversation as seen.
        const currentUserId = this.authService.getCurrentUser()?.id;
        const updated = this.messagesSubject.value.map(m =>
          m.conversationId === receipt.conversationId && m.senderId === currentUserId
            ? { ...m, status: 'seen' }
            : m
        );
        this.messagesSubject.next(updated);
      }
    });
    this.subscriptions.push(readSub);

    // Listen for typing events
    const typingSub = this.socketService.typing$.subscribe(typingEvent => {
      const activeConv = this.activeConversationSubject.value;
      if (activeConv && typingEvent.conversationId === activeConv.conversationId) {
        this.handleTypingEvent(typingEvent);
      }
    });
    this.subscriptions.push(typingSub);
  }

  private handleTypingEvent(event: ITypingEvent): void {
    const current = this.typingUsersSubject.value;
    const userId = event?.userId != null ? String(event.userId) : '';
    if (!userId) { return; }

    // Prefer First+Last (displayName) over username / email local-part
    const active = this.activeConversationSubject.value;
    const fromEvent = (
      (event as any).displayName ||
      event.username ||
      (event as any).userName ||
      ''
    ).toString().trim();
    const looksLikeHandle = !!fromEvent && (
      fromEvent === 'Someone' ||
      fromEvent === 'Undefined' ||
      fromEvent.toLowerCase() === 'undefined' ||
      !fromEvent.includes(' ')
    );
    const fromActive =
      (active && String(active.participantId || '') === userId
        ? (active.displayName ||
          [active.firstName, active.lastName].filter(Boolean).join(' ').trim() ||
          '')
        : '') ||
      (active?.displayName || '') ||
      '';
    const username = (!looksLikeHandle && fromEvent
      ? fromEvent
      : (fromActive || fromEvent || 'Someone')).trim();

    const normalized: ITypingEvent = {
      ...event,
      userId,
      username,
      conversationId: event.conversationId,
      isTyping: !!event.isTyping
    };

    if (normalized.isTyping) {
      if (!current.find(t => String(t.userId) === userId)) {
        this.typingUsersSubject.next([...current, normalized]);
      } else {
        this.typingUsersSubject.next(
          current.map(t => String(t.userId) === userId ? { ...t, ...normalized } : t)
        );
      }
    } else {
      this.typingUsersSubject.next(current.filter(t => String(t.userId) !== userId));
    }
  }

  private updateConversationLastMessage(message: IMessage): void {
    const conversations = this.conversationsSubject.value;
    const updated = conversations.map(conv => {
      if (conv.conversationId === message.conversationId) {
        return {
          ...conv,
          lastMessageContent: message.content,
          lastMessageSender: message.senderId,
          lastMessageType: message.messageType,
          lastMessageAt: message.createdAt
        };
      }
      return conv;
    });
    // Sort by latest message
    updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    this.conversationsSubject.next(updated);
  }
}
