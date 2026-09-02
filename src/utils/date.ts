/**
 * All dates are stored as ISO 'YYYY-MM-DD' strings (Postgres `date`).
 * Display defaults to Israel's DD/MM/YYYY convention (see project defaults);
 * a locale param is accepted so this can grow to other formats later.
 */

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = parseIsoDate(iso);
  return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

export function formatBillingPeriod(
  start: string | null | undefined,
  end: string | null | undefined,
): string | null {
  if (!start || !end) return null;
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  const startLabel = MONTH_SHORT[startDate.getMonth()];
  const endLabel = MONTH_SHORT[endDate.getMonth()];
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
