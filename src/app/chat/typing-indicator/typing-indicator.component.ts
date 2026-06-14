import { Component, Input } from '@angular/core';
import { ITypingEvent } from '../../core/models/message.model';

/**
 * TypingIndicatorComponent - Shows animated typing dots with username.
 *
 * Angular Concepts Used:
 * - @Input() binding from parent
 * - CSS animation for typing dots
 * - ngFor for multiple typing users
 */
@Component({
  selector: 'app-typing-indicator',
  templateUrl: './typing-indicator.component.html',
  styleUrls: ['./typing-indicator.component.scss']
})
export class TypingIndicatorComponent {

  @Input() typingUsers: ITypingEvent[] = [];

  getTypingText(): string {
    if (this.typingUsers.length === 1) {
      return `${this.typingUsers[0].username} is typing`;
    } else if (this.typingUsers.length === 2) {
      return `${this.typingUsers[0].username} and ${this.typingUsers[1].username} are typing`;
    } else if (this.typingUsers.length > 2) {
      return 'Several people are typing';
    }
    return '';
  }
}
