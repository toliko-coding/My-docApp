import {
  cancelScheduledNotifications,
  replaceScheduledNotifications,
} from '@/repositories/notifications.repository';
import { clearBillReminders, syncBillReminders } from '@/services/bill-reminders';
import { cancelReminders, rescheduleReminders } from '@/services/notifications';
import type { ReminderPlan } from '@/services/notifications';

jest.mock('@/repositories/notifications.repository', () => ({
  cancelScheduledNotifications: jest.fn().mockResolvedValue(undefined),
  replaceScheduledNotifications: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/notifications', () => ({
  cancelReminders: jest.fn().mockResolvedValue(undefined),
  rescheduleReminders: jest.fn().mockResolvedValue([]),
}));

const mockCancelReminders = cancelReminders as jest.Mock;
const mockRescheduleReminders = rescheduleReminders as jest.Mock;
const mockCancelScheduledNotifications = cancelScheduledNotifications as jest.Mock;
const mockReplaceScheduledNotifications = replaceScheduledNotifications as jest.Mock;

const baseInput = {
  userId: 'user-1',
  billId: 'bill-1',
  providerName: 'Electric Co',
  amount: 150,
  currency: 'ILS',
  dueDate: '2026-09-20',
  status: 'pending' as const,
  notificationsEnabled: true,
  reminderDaysBefore: [7, 3, 1, 0],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(new Date(2026, 8, 4, 8, 0, 0)); // 2026-09-04
});

afterEach(() => {
  jest.useRealTimers();
});

describe('syncBillReminders', () => {
  it('cancels on-device and DB reminders instead of scheduling when notifications are disabled', async () => {
    await syncBillReminders({ ...baseInput, notificationsEnabled: false });
    expect(mockCancelReminders).toHaveBeenCalledWith('bill-1');
    expect(mockCancelScheduledNotifications).toHaveBeenCalledWith('bill-1');
    expect(mockRescheduleReminders).not.toHaveBeenCalled();
    expect(mockReplaceScheduledNotifications).not.toHaveBeenCalled();
  });

  it('cancels instead of scheduling when there is no due date', async () => {
    await syncBillReminders({ ...baseInput, dueDate: null });
    expect(mockCancelReminders).toHaveBeenCalledWith('bill-1');
    expect(mockRescheduleReminders).not.toHaveBeenCalled();
  });

  it('cancels instead of scheduling once a bill is marked paid', async () => {
    await syncBillReminders({ ...baseInput, status: 'paid' });
    expect(mockCancelReminders).toHaveBeenCalledWith('bill-1');
    expect(mockRescheduleReminders).not.toHaveBeenCalled();
  });

  it('still schedules for a pending bill that is already overdue (effective status, not stored status)', async () => {
    await syncBillReminders({ ...baseInput, dueDate: '2026-01-01' });
    expect(mockCancelReminders).not.toHaveBeenCalled();
    expect(mockRescheduleReminders).toHaveBeenCalled();
  });

  it('reschedules and mirrors the resulting plan into the database', async () => {
    const plan: ReminderPlan[] = [
      {
        identifier: 'bill-reminder-bill-1-7',
        type: 'due_reminder_7d',
        daysBefore: 7,
        triggerDate: new Date(2026, 8, 13, 9, 0, 0),
      },
    ];
    mockRescheduleReminders.mockResolvedValueOnce(plan);

    await syncBillReminders(baseInput);

    expect(mockRescheduleReminders).toHaveBeenCalledWith(
      'bill-1',
      'Electric Co',
      '₪150.00',
      '2026-09-20',
      [7, 3, 1, 0],
    );
    expect(mockReplaceScheduledNotifications).toHaveBeenCalledWith('user-1', 'bill-1', [
      { type: 'due_reminder_7d', scheduledFor: plan[0].triggerDate.toISOString() },
    ]);
  });
});

describe('clearBillReminders', () => {
  it('cancels only the on-device schedule (DB rows cascade-delete with the bill)', async () => {
    await clearBillReminders('bill-1');
    expect(mockCancelReminders).toHaveBeenCalledWith('bill-1');
    expect(mockCancelScheduledNotifications).not.toHaveBeenCalled();
  });
});
