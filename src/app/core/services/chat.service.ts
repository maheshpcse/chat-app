import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
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

  private subscriptions: Subscription[] = [];

  constructor(
    private socketService: SocketService,
    private messageService: MessageService,
    private conversationService: ConversationService,
    private authService: AuthService
  ) {
    this.setupSocketListeners();
  }

  // ===========================
  // Conversation Management
  // ===========================

  loadConversations(): void {
    this.conversationService.getConversations().subscribe(conversations => {
      this.conversationsSubject.next(conversations);
    });
  }

  /**
   * Start or open a private conversation with a user.
   * Calls POST /api/v1/conversations to create (or retrieve existing).
   * Then sets it as active conversation.
   */
  startPrivateConversation(participantId: string): Observable<IConversation> {
    return new Observable(observer => {
      // Check if conversation already exists locally
      const existing = this.conversationsSubject.value.find(conv =>
        conv.conversationType === ConversationType.PRIVATE &&
        conv.participantId === participantId
      );

      if (existing) {
        this.setActiveConversation(existing);
        observer.next(existing);
        observer.complete();
        return;
      }

      // Create new conversation via API
      this.conversationService.createConversation({
        participantId
      }).subscribe(
        (conversation) => {
          // Add to conversations list
          const current = this.conversationsSubject.value;
          this.conversationsSubject.next([conversation, ...current]);
          // Set as active
          this.setActiveConversation(conversation);
          observer.next(conversation);
          observer.complete();
        },
        (error) => {
          observer.error(error);
        }
      );
    });
  }

  /**
   * Get display name for a conversation.
   */
  getDisplayName(conversation: IConversation): string {
    return conversation.displayName || conversation.username || 'Unknown';
  }

  setActiveConversation(conversation: IConversation): void {
    // Leave previous conversation room
    const previous = this.activeConversationSubject.value;
    if (previous) {
      this.socketService.leaveConversation(previous.conversationId);
    }

    // Set new active conversation
    this.activeConversationSubject.next(conversation);
    this.messagesSubject.next([]); // Clear messages
    this.typingUsersSubject.next([]); // Clear typing indicators

    // Join new conversation room
    this.socketService.joinConversation(conversation.conversationId);

    // Load messages
    this.loadMessages(conversation.conversationId);

    // Mark as read
    this.messageService.markAsRead(conversation.conversationId).subscribe();
    this.socketService.markAsRead(conversation.conversationId);
  }

  // ===========================
  // Message Management
  // ===========================

  loadMessages(conversationId: string, page: number = 1): void {
    this.messageService.getMessages(conversationId, page).subscribe(messages => {
      if (page === 1) {
        this.messagesSubject.next(messages);
      } else {
        // Prepend older messages for pagination
        const current = this.messagesSubject.value;
        this.messagesSubject.next([...messages, ...current]);
      }
    });
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

    // Send via HTTP (persists to DB)
    this.messageService.sendMessage(messageData).subscribe(message => {
      // Also emit via socket for real-time delivery
      this.socketService.sendMessage(message);
      // Add to local messages
      const current = this.messagesSubject.value;
      this.messagesSubject.next([...current, message]);
    });
  }

  // ===========================
  // Typing Indicators
  // ===========================

  startTyping(): void {
    const conversation = this.activeConversationSubject.value;
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
    const msgSub = this.socketService.messageReceived$.subscribe(message => {
      const activeConv = this.activeConversationSubject.value;
      if (activeConv && message.conversationId === activeConv.conversationId) {
        const current = this.messagesSubject.value;
        // Deduplicate: don't add if messageId already exists (e.g. sender's own message added via HTTP response)
        const exists = current.some(m => m.messageId === message.messageId);
        if (!exists) {
          this.messagesSubject.next([...current, message]);
        }
      }
      // Update conversation list (last message)
      this.updateConversationLastMessage(message);
    });
    this.subscriptions.push(msgSub);

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
    if (event.isTyping) {
      if (!current.find(t => t.userId === event.userId)) {
        this.typingUsersSubject.next([...current, event]);
      }
    } else {
      this.typingUsersSubject.next(current.filter(t => t.userId !== event.userId));
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
