import { supabase } from '@/lib/supabase';
import type { AppNotification, NotificationType } from '@/types/database';

/**
 * Mirrors what's actually scheduled on-device (see src/services/notifications.ts)
 * into the `notifications` table — not itself the delivery mechanism, but a
 * queryable record of what reminders exist for a bill, and the only way to
 * inspect that from outside the device.
 */
export async function replaceScheduledNotifications(
  userId: string,
  billId: string,
  reminders: { type: NotificationType; scheduledFor: string }[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('notifications')
    .delete()
    .eq('bill_id', billId)
    .eq('status', 'scheduled');
  if (deleteError) throw deleteError;

  if (reminders.length === 0) return;

  const { error: insertError } = await supabase.from('notifications').insert(
    reminders.map((reminder) => ({
      user_id: userId,
      bill_id: billId,
      type: reminder.type,
      scheduled_for: reminder.scheduledFor,
      status: 'scheduled' as const,
    })),
  );
  if (insertError) throw insertError;
}

export async function cancelScheduledNotifications(billId: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('bill_id', billId).eq('status', 'scheduled');
  if (error) throw error;
}

export async function listUpcomingNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('status', 'scheduled')
    .order('scheduled_for', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
