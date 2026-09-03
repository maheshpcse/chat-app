import { environment } from '../../../environments/environment';

/**
 * Resolve stored media paths (avatars, group photos, uploads) to a browser-usable URL.
 * DB / API often return relative paths like `/uploads/abc.jpg`.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (url == null) {
    return '';
  }
  const raw = String(url).trim();
  if (!raw) {
    return '';
  }
  if (
    raw.startsWith('http://') ||
    raw.startsWith('https://') ||
    raw.startsWith('blob:') ||
    raw.startsWith('data:')
  ) {
    return raw;
  }
  const base = (environment.socketUrl || '').replace(/\/$/, '');
  if (raw.startsWith('/')) {
    return base + raw;
  }
  return base + '/' + raw;
}
