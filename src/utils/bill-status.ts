import type { Bill, BillStatus } from '@/types/database';
import { isPastDue } from '@/utils/date';

/**
 * The stored `status` only changes on an explicit write (mark paid, edit,
 * or — later, Phase 6 — an automated job). For display we derive whether a
 * still-pending bill has actually gone overdue purely from its due date, so
 * the badge is always correct without needing a background job in Phase 2.
 */
export function getEffectiveStatus(bill: Pick<Bill, 'status' | 'due_date'>): BillStatus {
  if (bill.status === 'pending' && isPastDue(bill.due_date)) return 'overdue';
  return bill.status;
}
