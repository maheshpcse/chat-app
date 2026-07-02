import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'messageTime'
})
export class MessageTimePipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) { return ''; }

    const date = new Date(value);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (isToday) { return time; }
    if (isYesterday) { return `Yesterday ${time}`; }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + time;
  }
}
