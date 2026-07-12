import { Component, Input } from '@angular/core';
import { IMessage, MessageType } from '../../core/models/message.model';

/**
 * MessageBubbleComponent - Individual message display bubble.
 *
 * Angular Concepts Used:
 * - @Input() for parent-child data flow
 * - ngClass for conditional styling
 * - Pipe usage in template (timeAgo, fileSize)
 * - ngSwitch for message type rendering
 */
@Component({
  selector: 'app-message-bubble',
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss']
})
export class MessageBubbleComponent {

  @Input() message: IMessage;
  @Input() isOwn: boolean = false;
  @Input() isGroupChat: boolean = false;

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

  openImage(): void {
    if (this.message.attachmentUrl) {
      window.open(this.message.attachmentUrl, '_blank');
    }
  }

  /** Generate a consistent color per sender for group chat sender names */
  getSenderColor(): string {
    if (!this.message.senderId) { return '#114C5A'; }
    const colors = ['#114C5A', '#FF9932', '#FFC801', '#2E7D32', '#5E35B1', '#C62828', '#00838F', '#AD1457'];
    let hash = 0;
    for (let i = 0; i < this.message.senderId.length; i++) {
      hash = this.message.senderId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
