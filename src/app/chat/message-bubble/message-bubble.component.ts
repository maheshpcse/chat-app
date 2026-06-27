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
}
