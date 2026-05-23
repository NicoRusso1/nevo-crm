/**
 * Tiny formatting helpers used across the UI.
 *
 * Intentionally dependency-free — we use `Intl.RelativeTimeFormat` and
 * `Intl.NumberFormat` from the platform.
 */

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** "2 minutes ago", "yesterday", "in 3 days", "just now". */
export function relativeTime(date: Date | string | number): string {
  const target = date instanceof Date ? date : new Date(date);
  const diffMs = target.getTime() - Date.now();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(diffMs / 60_000);
  const hr = Math.round(diffMs / 3_600_000);
  const day = Math.round(diffMs / 86_400_000);

  if (Math.abs(sec) < 30) return 'just now';
  if (Math.abs(min) < 60) return rtf.format(min, 'minute');
  if (Math.abs(hr) < 24) return rtf.format(hr, 'hour');
  if (Math.abs(day) < 7) return rtf.format(day, 'day');
  return rtf.format(Math.round(day / 7), 'week');
}

/** Compact number: 1_234 → "1.2k", 25_000_000 → "25M". */
export function compactNumber(n: number): string {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

/** USD string with two decimals. Accepts string (Decimal serialized) or number. */
export function formatMoney(value: number | string, currency = 'USD'): string {
  const n = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}
