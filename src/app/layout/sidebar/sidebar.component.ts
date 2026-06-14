import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { SocketService } from '../../core/services/socket.service';
import { IConversation } from '../../core/models/conversation.model';

/**
 * SidebarComponent - Conversation list sidebar with search and online users.
 *
 * Angular Concepts Used:
 * - BehaviorSubject subscription for conversations list
 * - OnInit (load data), OnDestroy (cleanup)
 * - Event emitter pattern (select conversation)
 * - ngFor with trackBy for performance
 */
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {

  conversations: IConversation[] = [];
  onlineUsers: string[] = [];
  searchQuery: string = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    // Load conversations
    this.chatService.loadConversations();

    // Subscribe to conversations list
    const convSub = this.chatService.conversations$.subscribe(conversations => {
      this.conversations = conversations;
    });
    this.subscriptions.push(convSub);

    // Subscribe to online users
    const onlineSub = this.socketService.onlineUsers$.subscribe(users => {
      this.onlineUsers = users;
    });
    this.subscriptions.push(onlineSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  selectConversation(conversation: IConversation): void {
    this.chatService.setActiveConversation(conversation);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.includes(userId);
  }

  // TrackBy function for ngFor performance
  trackByConversationId(index: number, conversation: IConversation): string {
    return conversation.id;
  }

  filterConversations(): IConversation[] {
    if (!this.searchQuery.trim()) {
      return this.conversations;
    }
    const query = this.searchQuery.toLowerCase();
    return this.conversations.filter(conv =>
      conv.participants.some(p =>
        p.fullName.toLowerCase().includes(query) ||
        p.username.toLowerCase().includes(query)
      )
    );
  }
}
