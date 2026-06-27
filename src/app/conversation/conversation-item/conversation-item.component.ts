import { Component, Input } from '@angular/core';
import { IConversation, ConversationType } from '../../core/models/conversation.model';

/**
 * ConversationItemComponent - Individual conversation list item.
 *
 * Angular Concepts Used:
 * - @Input() for parent-child data binding
 * - ngClass for conditional CSS classes
 * - Pipe usage (timeAgo, truncate) in template
 * - Computed properties via methods
 */
@Component({
  selector: 'app-conversation-item',
  templateUrl: './conversation-item.component.html',
  styleUrls: ['./conversation-item.component.scss']
})
export class ConversationItemComponent {

  @Input() conversation: IConversation;
  @Input() isOnline: boolean = false;
  @Input() currentUserId: string;

  getDisplayName(): string {
    return this.conversation.displayName || 'Unknown User';
  }

  getAvatar(): string {
    return this.conversation.avatarUrl || '';
  }

  getLastMessagePreview(): string {
    if (!this.conversation.lastMessageContent) {
      return 'No messages yet';
    }
    const prefix = this.conversation.lastMessageSender === this.currentUserId ? 'You: ' : '';
    return prefix + this.conversation.lastMessageContent;
  }

  isGroupChat(): boolean {
    return this.conversation.conversationType === ConversationType.GROUP;
  }
}
