/**
 * Avatar / initials helpers.
 *
 * Produces up to two uppercase initials from a person's name so the UI can
 * render a consistent text avatar when no profile image is available.
 *
 * Examples:
 *   getInitials('Pachapalam Mahesh')      -> 'PM'
 *   getInitials('Siva Krishna')           -> 'SK'
 *   getInitials('madonna')                -> 'M'
 *   getInitials('', 'user@mail.com')      -> 'U'
 */
export function getInitials(name: string, fallback: string = ''): string {
  const source = (name || '').trim() || (fallback || '').trim();
  if (!source) {
    return '?';
  }

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return (first + last).toUpperCase();
}

/**
 * Deterministic background color for a text avatar, derived from a stable key
 * (e.g. userId or name) so the same user always gets the same color.
 */
export function getAvatarColor(key: string): string {
  const palette = [
    '#114C5A', '#FF9932', '#2E7D32', '#5E35B1',
    '#00838F', '#AD1457', '#3949AB', '#00695C'
  ];
  const source = key || '';
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = source.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}
