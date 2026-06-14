import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { SocketService } from '../../core/services/socket.service';
import { AuthService } from '../../core/services/auth.service';
import { IConversation } from '../../core/models/conversation.model';

/**
 * ConversationListComponent - Full-page conversation list view.
 * Used as a route component (unlike sidebar which is always visible).
 *
 * Angular Concepts Used:
 * - OnInit/OnDestroy lifecycle hooks
 * - Subscription array pattern for cleanup
 * - trackBy for ngFor performance optimization
 * - Router navigation
 * - BehaviorSubject consumption via subscribe
 */
@Component({
  selector: 'app-conversation-list',
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss']
})
export class ConversationListComponent implements OnInit, OnDestroy {

  conversations: IConversation[] = [];
  onlineUsers: string[] = [];
  isLoading: boolean = true;
  currentUserId: string;
  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private socketService: SocketService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id;
    this.chatService.loadConversations();

    const convSub = this.chatService.conversations$.subscribe(conversations => {
      this.conversations = conversations;
      this.isLoading = false;
    });
    this.subscriptions.push(convSub);

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
    this.router.navigate(['/chat']);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.includes(userId);
  }

  getOtherParticipant(conversation: IConversation): any {
    return conversation.participants.find(p => p.userId !== this.currentUserId)
      || conversation.participants[0];
  }

  trackByConversationId(index: number, conversation: IConversation): string {
    return conversation.id;
  }
}
