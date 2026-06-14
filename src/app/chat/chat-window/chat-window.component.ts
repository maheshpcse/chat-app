import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { IMessage, ITypingEvent } from '../../core/models/message.model';
import { IConversation } from '../../core/models/conversation.model';

/**
 * ChatWindowComponent - Displays messages, typing indicator, and message input.
 *
 * Angular Concepts Used:
 * - @ViewChild for DOM reference (scroll to bottom)
 * - AfterViewChecked lifecycle hook
 * - Multiple subscriptions with cleanup
 * - Component communication via services
 * - trackBy for ngFor optimization
 */
@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('messagesContainer') private messagesContainer: ElementRef;

  messages: IMessage[] = [];
  activeConversation: IConversation | null = null;
  typingUsers: ITypingEvent[] = [];
  currentUserId: string;
  private subscriptions: Subscription[] = [];
  private shouldScroll = true;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id;

    const convSub = this.chatService.activeConversation$.subscribe(conv => {
      this.activeConversation = conv;
      this.shouldScroll = true;
    });
    this.subscriptions.push(convSub);

    const msgSub = this.chatService.messages$.subscribe(messages => {
      this.messages = messages;
      this.shouldScroll = true;
    });
    this.subscriptions.push(msgSub);

    const typingSub = this.chatService.typingUsers$.subscribe(users => {
      this.typingUsers = users;
    });
    this.subscriptions.push(typingSub);
  }

  // Lifecycle Hook: AfterViewChecked - runs after view updates
  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  isOwnMessage(message: IMessage): boolean {
    return message.senderId === this.currentUserId;
  }

  trackByMessageId(index: number, message: IMessage): string {
    return message.id;
  }

  getOtherParticipantName(): string {
    if (!this.activeConversation) { return ''; }
    const other = this.activeConversation.participants.find(p => p.userId !== this.currentUserId);
    return other ? other.fullName : 'Unknown';
  }

  isOtherParticipantOnline(): boolean {
    if (!this.activeConversation) { return false; }
    const other = this.activeConversation.participants.find(p => p.userId !== this.currentUserId);
    return other ? other.isOnline : false;
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }
}
