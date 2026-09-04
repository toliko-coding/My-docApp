import { cancelScheduledNotifications, replaceScheduledNotifications } from '@/repositories/notifications.repository';
import { cancelReminders, rescheduleReminders } from '@/services/notifications';
import type { BillStatus, BillWithRelations } from '@/types/database';
import { getEffectiveStatus } from '@/utils/bill-status';
import { formatAmount } from '@/utils/currency';

export interface SyncBillRemindersInput {
  userId: string;
  billId: string;
  providerName: string;
  amount: number;
  currency: string;
  dueDate: string | null;
  status: BillStatus;
  notificationsEnabled: boolean;
  reminderDaysBefore: number[];
}

/**
 * The single place bill screens call after any mutation that could change
 * whether/when a reminder should fire: create, edit, mark paid/unpaid.
 * Handles both the on-device schedule (services/notifications.ts) and its
 * database mirror (repositories/notifications.repository.ts) together, so
 * callers never have to remember to do both.
 */
export async function syncBillReminders(input: SyncBillRemindersInput): Promise<void> {
  const effectiveStatus = getEffectiveStatus({ status: input.status, due_date: input.dueDate });
  const shouldSchedule = input.notificationsEnabled && Boolean(input.dueDate) && effectiveStatus !== 'paid';

  if (!shouldSchedule) {
    await cancelReminders(input.billId);
    await cancelScheduledNotifications(input.billId);
    return;
  }

  const plan = await rescheduleReminders(
    input.billId,
    input.providerName,
    formatAmount(input.amount, input.currency),
    input.dueDate!,
    input.reminderDaysBefore,
  );

  await replaceScheduledNotifications(
    input.userId,
    input.billId,
    plan.map((item) => ({ type: item.type, scheduledFor: item.triggerDate.toISOString() })),
  );
}

/** Only the on-device schedule needs clearing on delete — the DB rows cascade-delete with the bill itself. */
export async function clearBillReminders(billId: string): Promise<void> {
  await cancelReminders(billId);
}

/**
 * Called after notification settings change (enabled toggle, or which day
 * offsets) — every existing bill's on-device schedule was set up under the
 * *old* settings, so each one needs redoing under the new ones or it'll
 * keep firing at the wrong offsets (or firing at all, if just disabled).
 */
export async function resyncAllReminders(
  userId: string,
  bills: BillWithRelations[],
  notificationsEnabled: boolean,
  reminderDaysBefore: number[],
): Promise<void> {
  await Promise.all(
    bills.map((bill) =>
      syncBillReminders({
        userId,
        billId: bill.id,
        providerName: bill.provider?.name ?? '',
        amount: bill.amount,
        currency: bill.currency,
        dueDate: bill.due_date,
        status: bill.status,
        notificationsEnabled,
        reminderDaysBefore,
      }),
    ),
  );
}
