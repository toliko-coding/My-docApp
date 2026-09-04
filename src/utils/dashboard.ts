import type { BillWithRelations } from '@/types/database';
import { getEffectiveStatus } from '@/utils/bill-status';
import { todayIso } from '@/utils/date';

export interface CategorySpending {
  categoryId: string;
  icon: string | null;
  nameEn: string;
  nameHe: string;
  amount: number;
}

export interface DashboardStats {
  outstandingTotal: number;
  outstandingCount: number;
  paidThisMonthTotal: number;
  upcomingBills: BillWithRelations[];
  categorySpending: CategorySpending[];
}

/**
 * Derived purely from the same bill rows the Bills tab already fetches — no
 * separate aggregate query. Household bill volumes are small enough that
 * computing this client-side is simpler and fast enough, matching how
 * getEffectiveStatus already works.
 *
 * Note: amounts are summed regardless of currency (the schema allows a
 * per-bill currency, but the app has no exchange-rate conversion). This is
 * correct for the common single-currency (ILS) case; mixed-currency totals
 * would be misleading, but handling that is out of scope here.
 */
export function computeDashboardStats(bills: BillWithRelations[]): DashboardStats {
  const today = todayIso();
  const currentMonth = today.slice(0, 7); // 'YYYY-MM'

  let outstandingTotal = 0;
  let outstandingCount = 0;
  let paidThisMonthTotal = 0;
  const categoryTotals = new Map<string, CategorySpending>();

  for (const bill of bills) {
    if (getEffectiveStatus(bill) !== 'paid') {
      outstandingTotal += bill.amount;
      outstandingCount += 1;
    }

    if (bill.status === 'paid' && bill.paid_date?.startsWith(currentMonth)) {
      paidThisMonthTotal += bill.amount;
      if (bill.category) {
        const existing = categoryTotals.get(bill.category.id);
        if (existing) {
          existing.amount += bill.amount;
        } else {
          categoryTotals.set(bill.category.id, {
            categoryId: bill.category.id,
            icon: bill.category.icon,
            nameEn: bill.category.name_en,
            nameHe: bill.category.name_he,
            amount: bill.amount,
          });
        }
      }
    }
  }

  const upcomingBills = bills
    .filter((bill) => getEffectiveStatus(bill) === 'pending' && bill.due_date && bill.due_date >= today)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : a.due_date! > b.due_date! ? 1 : 0))
    .slice(0, 5);

  const categorySpending = Array.from(categoryTotals.values()).sort((a, b) => b.amount - a.amount);

  return { outstandingTotal, outstandingCount, paidThisMonthTotal, upcomingBills, categorySpending };
}
