import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { PresenceService } from '../../core/services/presence.service';
import { IMessage, ITypingEvent } from '../../core/models/message.model';
import { IConversation } from '../../core/models/conversation.model';

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
  showProfileSidebar: boolean = false;

  private subscriptions: Subscription[] = [];
  private shouldScroll = true;
  private isNearBottom = true;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private socketService: SocketService,
    private presenceService: PresenceService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id;

    const convSub = this.chatService.activeConversation$.subscribe(conv => {
      this.activeConversation = conv;
      this.shouldScroll = true;
    });
    this.subscriptions.push(convSub);

    const msgSub = this.chatService.messages$.subscribe(messages => {
      this.messages = [...messages].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      if (this.isNearBottom) {
        this.shouldScroll = true;
      }
    });
    this.subscriptions.push(msgSub);

    const typingSub = this.chatService.typingUsers$.subscribe(users => {
      this.typingUsers = users;
    });
    this.subscriptions.push(typingSub);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onScroll(): void {
    if (!this.messagesContainer) { return; }
    const el = this.messagesContainer.nativeElement;
    const threshold = 150;
    this.isNearBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) < threshold;
  }

  isOwnMessage(message: IMessage): boolean {
    return message.senderId === this.currentUserId;
  }

  trackByMessageId(index: number, message: IMessage): string {
    return message.messageId;
  }

  getOtherParticipantName(): string {
    if (!this.activeConversation) { return ''; }
    return this.activeConversation.displayName || 'Unknown';
  }

  isOtherParticipantOnline(): boolean {
    if (!this.activeConversation?.participantId) { return false; }
    return this.presenceService.isOnline(this.activeConversation.participantId);
  }

  toggleProfileSidebar(): void {
    this.showProfileSidebar = !this.showProfileSidebar;
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const el = this.messagesContainer.nativeElement;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    } catch (err) {}
  }
}
