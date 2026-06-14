import { Pipe, PipeTransform } from '@angular/core';

/**
 * TimeAgoPipe - Transforms a date into relative time string.
 *
 * Angular Concepts Used:
 * - @Pipe decorator with name
 * - PipeTransform interface
 * - Usage in templates: {{ message.createdAt | timeAgo }}
 *
 * Example:
 *   <span>{{ conversation.lastMessage.createdAt | timeAgo }}</span>
 *   Output: "5 min ago", "2 hours ago", "Yesterday"
 */
@Pipe({
  name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {

  transform(value: Date | string): string {
    if (!value) { return ''; }

    const now = new Date();
    const past = new Date(value);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return 'Just now';
    } else if (diffMin < 60) {
      return `${diffMin} min ago`;
    } else if (diffHour < 24) {
      return `${diffHour}h ago`;
    } else if (diffDay === 1) {
      return 'Yesterday';
    } else if (diffDay < 7) {
      return `${diffDay}d ago`;
    } else {
      return past.toLocaleDateString();
    }
  }
}
