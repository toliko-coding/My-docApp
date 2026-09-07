import type { Locale } from '@/i18n';

/**
 * All dates are stored as ISO 'YYYY-MM-DD' strings (Postgres `date`).
 * Numeric formatting (formatDate) always uses Israel's DD/MM/YYYY
 * convention regardless of locale; functions that spell out a month name
 * take a `locale` param (defaulting to 'en') so they read correctly for
 * Hebrew-only users too.
 */

const MONTH_SHORT: Record<Locale, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  he: ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יונ׳', 'יול׳', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'],
};

const MONTH_LONG: Record<Locale, string[]> = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  he: [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
  ],
};

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function formatShortDate(iso: string | null | undefined, locale: Locale = 'en'): string {
  if (!iso) return '—';
  const date = parseIsoDate(iso);
  return `${MONTH_SHORT[locale][date.getMonth()]} ${date.getDate()}`;
}

export function formatBillingPeriod(
  start: string | null | undefined,
  end: string | null | undefined,
  locale: Locale = 'en',
): string | null {
  if (!start || !end) return null;
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  const startLabel = MONTH_SHORT[locale][startDate.getMonth()];
  const endLabel = MONTH_SHORT[locale][endDate.getMonth()];
  if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${startLabel}–${endLabel} ${endDate.getFullYear()}`;
  }
  return `${startLabel} ${startDate.getFullYear()} – ${endLabel} ${endDate.getFullYear()}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isPastDue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  return dueDate < todayIso();
}

/** 'YYYY-MM' key for grouping dates by calendar month, independent of day. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** e.g. "September 2026" — the section-header label for a month grouping. */
export function formatMonthYear(key: string, locale: Locale = 'en'): string {
  const [year, month] = key.split('-').map(Number);
  return `${MONTH_LONG[locale][month - 1]} ${year}`;
}
