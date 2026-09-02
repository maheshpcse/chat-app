import { Pipe, PipeTransform } from '@angular/core';
import { parseServerDate } from '../../core/utilities/date-parse.utility';

/**
 * TimeAgoPipe - Transforms a date into relative time string.
 * Uses parseServerDate so MySQL DATETIME (no zone) is treated as UTC.
 */
@Pipe({
  name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {

  transform(value: Date | string | number): string {
    const past = parseServerDate(value);
    if (!past) { return ''; }

    const now = new Date();
    const diffMs = now.getTime() - past.getTime();
    // Future clock skew / zone glitch → show local clock time, not negative ago
    if (diffMs < -60000) {
      return past.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    const diffSec = Math.floor(Math.max(0, diffMs) / 1000);
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
