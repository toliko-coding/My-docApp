import { computeReminderPlan } from '@/services/notifications';

describe('computeReminderPlan', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 4, 8, 0, 0)); // 2026-09-04 08:00
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('builds one plan entry per requested offset, each at 09:00 local', () => {
    const plan = computeReminderPlan('2026-09-20', 'bill-1', [7, 3, 1, 0]);
    expect(plan).toHaveLength(4);
    expect(plan.map((p) => p.daysBefore)).toEqual([7, 3, 1, 0]);
    expect(plan.map((p) => p.type)).toEqual(['due_reminder_7d', 'due_reminder_3d', 'due_reminder_1d', 'due_today']);
    expect(plan[0].triggerDate).toEqual(new Date(2026, 8, 13, 9, 0, 0));
    expect(plan[3].triggerDate).toEqual(new Date(2026, 8, 20, 9, 0, 0));
  });

  it('gives every entry a stable, bill- and offset-specific identifier', () => {
    const plan = computeReminderPlan('2026-09-20', 'bill-1', [7, 0]);
    expect(plan.map((p) => p.identifier)).toEqual(['bill-reminder-bill-1-7', 'bill-reminder-bill-1-0']);
  });

  it('skips offsets whose trigger time has already passed', () => {
    // "now" is 2026-09-04 08:00; a due date of 2026-09-04 means the 0-days-before
    // trigger (09:00 the same day) is still ahead, but the 7-days-before trigger
    // (2026-08-28 09:00) is long past.
    const plan = computeReminderPlan('2026-09-04', 'bill-1', [7, 0]);
    expect(plan.map((p) => p.daysBefore)).toEqual([0]);
  });

  it('returns an empty plan when every offset has already passed', () => {
    const plan = computeReminderPlan('2026-01-01', 'bill-1', [7, 3, 1, 0]);
    expect(plan).toEqual([]);
  });

  it('ignores an offset with no known notification type', () => {
    const plan = computeReminderPlan('2026-09-20', 'bill-1', [7, 5]);
    expect(plan.map((p) => p.daysBefore)).toEqual([7]);
  });
});
