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
    if (this.conversation.type === ConversationType.GROUP) {
      return 'Group Chat'; // Group name would come from group data
    }
    const other = this.conversation.participants.find(p => p.userId !== this.currentUserId);
    return other ? other.fullName : 'Unknown User';
  }

  getAvatar(): string {
    const other = this.conversation.participants.find(p => p.userId !== this.currentUserId);
    return other?.avatar || '';
  }

  getLastMessagePreview(): string {
    if (!this.conversation.lastMessage) {
      return 'No messages yet';
    }
    const prefix = this.conversation.lastMessage.senderId === this.currentUserId ? 'You: ' : '';
    return prefix + this.conversation.lastMessage.content;
  }

  isGroupChat(): boolean {
    return this.conversation.type === ConversationType.GROUP;
  }
}
