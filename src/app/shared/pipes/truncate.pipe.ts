import { Pipe, PipeTransform } from '@angular/core';

/**
 * TruncatePipe - Truncates text to specified length with ellipsis.
 *
 * Angular Concepts Used:
 * - Pipe with parameters
 * - Usage: {{ text | truncate:50 }}
 *
 * Example in conversation list:
 *   <p>{{ conversation.lastMessage.content | truncate:40 }}</p>
 *   Output: "Hey, are you coming to the meeting t..."
 */
@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {

  transform(value: string, limit: number = 30, trail: string = '...'): string {
    if (!value) { return ''; }
    if (value.length <= limit) { return value; }
    return value.substring(0, limit) + trail;
  }
}
