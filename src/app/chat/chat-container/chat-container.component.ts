import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { IConversation } from '../../core/models/conversation.model';

/**
 * ChatContainerComponent - Main chat area container.
 * Shows either chat window or empty state.
 *
 * Angular Concepts Used:
 * - Subscription management
 * - Conditional rendering (*ngIf)
 * - Component composition
 */
@Component({
  selector: 'app-chat-container',
  templateUrl: './chat-container.component.html',
  styleUrls: ['./chat-container.component.scss']
})
export class ChatContainerComponent implements OnInit, OnDestroy {

  activeConversation: IConversation | null = null;
  private subscription: Subscription;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.subscription = this.chatService.activeConversation$.subscribe(conversation => {
      this.activeConversation = conversation;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.chatService.clearActiveConversation();
  }
}
