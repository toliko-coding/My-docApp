import { Platform } from 'react-native';

import type { NotificationType } from '@/types/database';
import { formatDate } from '@/utils/date';

type NotificationsModule = typeof import('expo-notifications');

const CHANNEL_ID = 'bill-reminders';

// undefined = not attempted yet; null = confirmed unavailable this session.
let cachedModule: NotificationsModule | null | undefined;

/**
 * expo-notifications throws as soon as it's touched when running inside
 * Expo Go on Android (SDK 53+ removed that functionality there — a
 * development build is required: https://docs.expo.dev/develop/development-builds/introduction/).
 * A *static* `import` can't be wrapped in try/catch (it's hoisted before any
 * of our code runs), so this loads it dynamically instead, letting every
 * function below degrade to a safe no-op in that environment rather than
 * crashing every screen that imports this file.
 */
async function loadNotificationsModule(): Promise<NotificationsModule | null> {
  if (cachedModule !== undefined) return cachedModule;

  try {
    const mod: NotificationsModule = await import('expo-notifications');
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    cachedModule = mod;
  } catch {
    cachedModule = null;
  }

  return cachedModule;
}

export async function isNotificationsAvailable(): Promise<boolean> {
  return (await loadNotificationsModule()) !== null;
}

async function ensureNotificationChannel(mod: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  await mod.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Bill reminders',
    importance: mod.AndroidImportance.DEFAULT,
  });
}

export async function getNotificationPermissionGranted(): Promise<boolean> {
  const mod = await loadNotificationsModule();
  if (!mod) return false;
  const { status } = await mod.getPermissionsAsync();
  return status === 'granted';
}

export async function requestNotificationPermission(): Promise<boolean> {
  const mod = await loadNotificationsModule();
  if (!mod) return false;
  const { status } = await mod.requestPermissionsAsync();
  return status === 'granted';
}

const DAYS_TO_TYPE: Partial<Record<number, NotificationType>> = {
  7: 'due_reminder_7d',
  3: 'due_reminder_3d',
  1: 'due_reminder_1d',
  0: 'due_today',
};

/** All identifiers a bill could ever have — cancelling this full set is always safe, even for offsets never actually scheduled. */
const ALL_DAYS_BEFORE = [7, 3, 1, 0];

function reminderIdentifier(billId: string, daysBefore: number): string {
  return `bill-reminder-${billId}-${daysBefore}`;
}

export interface ReminderPlan {
  identifier: string;
  type: NotificationType;
  daysBefore: number;
  triggerDate: Date;
}

/** Reminder trigger times (09:00 local) for a due date, skipping any that have already passed. */
export function computeReminderPlan(dueDateIso: string, billId: string, daysBeforeList: number[]): ReminderPlan[] {
  const [year, month, day] = dueDateIso.split('-').map(Number);
  const now = new Date();

  const plans: ReminderPlan[] = [];
  for (const daysBefore of daysBeforeList) {
    const type = DAYS_TO_TYPE[daysBefore];
    if (!type) continue;
    const triggerDate = new Date(year, month - 1, day - daysBefore, 9, 0, 0);
    if (triggerDate.getTime() <= now.getTime()) continue;
    plans.push({ identifier: reminderIdentifier(billId, daysBefore), type, daysBefore, triggerDate });
  }
  return plans;
}

/** Cancels every possible reminder identifier for a bill. Safe to call even if none were ever scheduled, or notifications are unavailable. */
export async function cancelReminders(billId: string): Promise<void> {
  const mod = await loadNotificationsModule();
  if (!mod) return;
  await Promise.all(
    ALL_DAYS_BEFORE.map((days) =>
      mod.cancelScheduledNotificationAsync(reminderIdentifier(billId, days)).catch(() => undefined),
    ),
  );
}

/**
 * Clears any existing reminders for a bill, then schedules fresh ones from
 * its current due date + the user's reminder preferences. Returns an empty
 * plan (having done nothing) if expo-notifications isn't available in this
 * environment — callers use the returned plan to mirror into the database,
 * so an empty plan there is the correct reflection of "nothing scheduled."
 */
export async function rescheduleReminders(
  billId: string,
  providerName: string,
  amountLabel: string,
  dueDateIso: string,
  daysBeforeList: number[],
): Promise<ReminderPlan[]> {
  await cancelReminders(billId);

  const mod = await loadNotificationsModule();
  if (!mod) return [];

  const plan = computeReminderPlan(dueDateIso, billId, daysBeforeList);
  if (plan.length === 0) return plan;

  await ensureNotificationChannel(mod);

  for (const item of plan) {
    await mod.scheduleNotificationAsync({
      identifier: item.identifier,
      content: {
        title:
          item.daysBefore === 0
            ? `${providerName} is due today`
            : `${providerName} is due in ${item.daysBefore} day${item.daysBefore === 1 ? '' : 's'}`,
        body: `${amountLabel} · due ${formatDate(dueDateIso)}`,
        data: { billId },
      },
      trigger: { type: mod.SchedulableTriggerInputTypes.DATE, date: item.triggerDate },
    });
  }

  return plan;
}
