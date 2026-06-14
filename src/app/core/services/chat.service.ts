import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { IMessage, ISendMessage, ITypingEvent, MessageType } from '../models/message.model';
import { IConversation } from '../models/conversation.model';
import { SocketService } from './socket.service';
import { MessageService } from './message.service';
import { ConversationService } from './conversation.service';

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
    private conversationService: ConversationService
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

  setActiveConversation(conversation: IConversation): void {
    // Leave previous conversation room
    const previous = this.activeConversationSubject.value;
    if (previous) {
      this.socketService.leaveConversation(previous.id);
    }

    // Set new active conversation
    this.activeConversationSubject.next(conversation);
    this.messagesSubject.next([]); // Clear messages
    this.typingUsersSubject.next([]); // Clear typing indicators

    // Join new conversation room
    this.socketService.joinConversation(conversation.id);

    // Load messages
    this.loadMessages(conversation.id);

    // Mark as read
    this.messageService.markAsRead(conversation.id).subscribe();
    this.socketService.markAsRead(conversation.id);
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

  sendMessage(content: string, type: MessageType = MessageType.TEXT, fileUrl?: string, fileName?: string, fileSize?: number): void {
    const conversation = this.activeConversationSubject.value;
    if (!conversation) { return; }

    const messageData: ISendMessage = {
      conversationId: conversation.id,
      content,
      type,
      fileUrl,
      fileName,
      fileSize
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
      this.socketService.emitTypingStart(conversation.id);
    }
  }

  stopTyping(): void {
    const conversation = this.activeConversationSubject.value;
    if (conversation) {
      this.socketService.emitTypingStop(conversation.id);
    }
  }

  // ===========================
  // Cleanup
  // ===========================

  clearActiveConversation(): void {
    const current = this.activeConversationSubject.value;
    if (current) {
      this.socketService.leaveConversation(current.id);
    }
    this.activeConversationSubject.next(null);
    this.messagesSubject.next([]);
    this.typingUsersSubject.next([]);
  }

  // ===========================
  // Private Socket Listeners
  // ===========================

  private setupSocketListeners(): void {
    // Listen for incoming messages
    const msgSub = this.socketService.messageReceived$.subscribe(message => {
      const activeConv = this.activeConversationSubject.value;
      if (activeConv && message.conversationId === activeConv.id) {
        const current = this.messagesSubject.value;
        this.messagesSubject.next([...current, message]);
      }
      // Update conversation list (last message)
      this.updateConversationLastMessage(message);
    });
    this.subscriptions.push(msgSub);

    // Listen for typing events
    const typingSub = this.socketService.typing$.subscribe(typingEvent => {
      const activeConv = this.activeConversationSubject.value;
      if (activeConv && typingEvent.conversationId === activeConv.id) {
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
      if (conv.id === message.conversationId) {
        return {
          ...conv,
          lastMessage: {
            content: message.content,
            senderId: message.senderId,
            senderName: message.senderName,
            createdAt: message.createdAt,
            type: message.type
          },
          updatedAt: message.createdAt
        };
      }
      return conv;
    });
    // Sort by latest message
    updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    this.conversationsSubject.next(updated);
  }
}
