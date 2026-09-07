import type { BillWithRelations } from '@/types/database';
import { formatMonthYear, monthKey } from '@/utils/date';

export interface BillMonthSection {
  key: string;
  title: string;
  data: BillWithRelations[];
}

/**
 * Bills grouped into month sections by due date, chronological, for the
 * Calendar tab's payment-schedule view. Bills without a due date have no
 * place on a due-date timeline, so they're left out entirely rather than
 * dumped into an "undated" bucket.
 */
export function groupBillsByDueMonth(bills: BillWithRelations[]): BillMonthSection[] {
  const groups = new Map<string, BillWithRelations[]>();

  for (const bill of bills) {
    if (!bill.due_date) continue;
    const key = monthKey(bill.due_date);
    const list = groups.get(key);
    if (list) list.push(bill);
    else groups.set(key, [bill]);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, data]) => ({
      key,
      title: formatMonthYear(key),
      data: [...data].sort((a, b) => (a.due_date! < b.due_date! ? -1 : a.due_date! > b.due_date! ? 1 : 0)),
    }));
}
