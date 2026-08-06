import { Component, Input } from '@angular/core';
import { IMessage, MessageType } from '../../core/models/message.model';

/**
 * MessageBubbleComponent - Individual message display bubble.
 *
 * Renders a professional sent/received bubble with:
 * - sender avatar/initials on both received and own messages
 * - dynamic width (min/max) with correct multiline wrapping
 * - timestamp
 * - delivery/read status icon for own messages
 *
 * Angular Concepts Used:
 * - @Input() for parent-child data flow
 * - ngClass for conditional styling
 * - Pipe usage in template (timeAgo)
 */
@Component({
  selector: 'app-message-bubble',
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss']
})
export class MessageBubbleComponent {

  @Input() message: IMessage;
  @Input() isOwn = false;
  @Input() isGroupChat = false;

  MessageType = MessageType; // Expose enum to template

  isImage(): boolean {
    return this.message.messageType === MessageType.IMAGE;
  }

  isFile(): boolean {
    return this.message.messageType === MessageType.FILE;
  }

  isText(): boolean {
    return this.message.messageType === MessageType.TEXT;
  }

  /** Show an avatar next to every bubble so sent and received rows stay visually balanced. */
  get showAvatar(): boolean {
    return true;
  }

  openImage(): void {
    if (this.message.attachmentUrl) {
      window.open(this.message.attachmentUrl, '_blank');
    }
  }

  /**
   * Material icon name for the current delivery/read status (own messages only).
   */
  get statusIcon(): string {
    switch (this.message.status) {
      case 'scheduled': return 'schedule';
      case 'sending':   return 'access_time';
      case 'sent':      return 'done';
      case 'delivered': return 'done_all';
      case 'seen':
      case 'read':      return 'done_all';
      case 'failed':    return 'error_outline';
      default:          return 'done';
    }
  }

  /** CSS modifier for the status icon (drives color). */
  get statusClass(): string {
    switch (this.message.status) {
      case 'seen':
      case 'read':   return 'status-seen';
      case 'failed': return 'status-failed';
      case 'sending':
      case 'scheduled': return 'status-pending';
      default:       return 'status-default';
    }
  }

  /** Generate a consistent color per sender for group chat sender names */
  getSenderColor(): string {
    if (!this.message.senderId) { return '#114C5A'; }
    const colors = ['#114C5A', '#FF9932', '#FFC801', '#2E7D32', '#5E35B1', '#C62828', '#00838F', '#AD1457'];
    let hash = 0;
    for (let i = 0; i < this.message.senderId.length; i++) {
      hash = this.message.senderId.charCodeAt(i) + Math.imul(hash, 31);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
