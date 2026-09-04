import type { BillWithRelations } from '@/types/database';

export interface RecurringProvider {
  providerId: string;
  providerName: string;
  categoryIcon: string | null;
  averageAmount: number;
  occurrences: number;
  averageIntervalDays: number;
}

/** The date a bill is anchored to for recurrence purposes — when it was issued, falling back to when it was created. */
function anchorDate(bill: BillWithRelations): string {
  return bill.issue_date ?? bill.created_at.slice(0, 10);
}

/**
 * Providers with 2+ bills on record, purely a computed insight (no stored
 * "recurring" flag on the schema) — every household bill is naturally
 * recurring once there's enough history to see the pattern, so this just
 * surfaces what's already there rather than requiring the user to mark
 * anything.
 */
export function detectRecurringProviders(bills: BillWithRelations[]): RecurringProvider[] {
  const byProvider = new Map<string, BillWithRelations[]>();
  for (const bill of bills) {
    if (!bill.provider) continue;
    const list = byProvider.get(bill.provider.id);
    if (list) list.push(bill);
    else byProvider.set(bill.provider.id, [bill]);
  }

  const recurring: RecurringProvider[] = [];
  for (const [providerId, providerBills] of byProvider) {
    if (providerBills.length < 2) continue;

    const sorted = [...providerBills].sort((a, b) => (anchorDate(a) < anchorDate(b) ? -1 : 1));
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const days = daysBetween(anchorDate(sorted[i - 1]), anchorDate(sorted[i]));
      if (days > 0) intervals.push(days);
    }
    if (intervals.length === 0) continue;

    const averageIntervalDays = Math.round(intervals.reduce((sum, d) => sum + d, 0) / intervals.length);
    const averageAmount = providerBills.reduce((sum, b) => sum + b.amount, 0) / providerBills.length;

    recurring.push({
      providerId,
      providerName: sorted[0].provider!.name,
      categoryIcon: sorted[0].category?.icon ?? null,
      averageAmount,
      occurrences: providerBills.length,
      averageIntervalDays,
    });
  }

  return recurring.sort((a, b) => b.occurrences - a.occurrences);
}

function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
