/**
 * Parse server timestamps consistently.
 * MySQL DATETIME often arrives as "YYYY-MM-DD HH:mm:ss" with no zone.
 * Browsers treat that as local time → wrong offsets vs true UTC storage.
 * If value has no Z/offset, treat as UTC.
 */
export function parseServerDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null || value === '') {
    return null;
  }
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  // Already has timezone (Z or ±HH:MM)
  if (/[zZ]$/.test(raw) || /[+-]\d{2}:\d{2}$/.test(raw) || /[+-]\d{4}$/.test(raw)) {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }

  // MySQL / SQL style without zone → UTC
  const sql = raw.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d{1,3})?$/
  );
  if (sql) {
    const d = new Date(`${sql[1]}T${sql[2]}${sql[3] || ''}Z`);
    return isNaN(d.getTime()) ? null : d;
  }

  // Date-only
  const dayOnly = raw.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (dayOnly) {
    const d = new Date(`${dayOnly[1]}T00:00:00Z`);
    return isNaN(d.getTime()) ? null : d;
  }

  const fallback = new Date(raw);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function toServerDateMs(value: Date | string | number | null | undefined): number {
  const d = parseServerDate(value);
  return d ? d.getTime() : 0;
}
