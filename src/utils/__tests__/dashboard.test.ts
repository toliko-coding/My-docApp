import { makeBill, makeCategory } from '@/test-utils/fixtures';
import { computeDashboardStats } from '@/utils/dashboard';

describe('computeDashboardStats', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 4, 12, 0, 0)); // 2026-09-04
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sums outstanding amount/count for every non-paid bill', () => {
    const bills = [
      makeBill({ id: '1', status: 'pending', amount: 100, due_date: '2026-09-10' }),
      makeBill({ id: '2', status: 'unknown', amount: 50, due_date: null }),
      makeBill({ id: '3', status: 'paid', amount: 999, due_date: '2026-01-01' }),
    ];
    const stats = computeDashboardStats(bills);
    expect(stats.outstandingCount).toBe(2);
    expect(stats.outstandingTotal).toBe(150);
  });

  it('counts a pending bill past its due date as overdue, in both overdue and outstanding totals', () => {
    const bills = [makeBill({ id: '1', status: 'pending', amount: 200, due_date: '2026-09-01' })];
    const stats = computeDashboardStats(bills);
    expect(stats.overdueCount).toBe(1);
    expect(stats.overdueTotal).toBe(200);
    expect(stats.outstandingCount).toBe(1);
    expect(stats.outstandingTotal).toBe(200);
  });

  it('only counts a bill as paid-this-month when status is paid and paid_date falls in the current month', () => {
    const bills = [
      makeBill({ id: '1', status: 'paid', amount: 100, paid_date: '2026-09-02' }),
      makeBill({ id: '2', status: 'paid', amount: 100, paid_date: '2026-08-30' }),
      makeBill({ id: '3', status: 'pending', amount: 100, paid_date: null }),
    ];
    const stats = computeDashboardStats(bills);
    expect(stats.paidThisMonthTotal).toBe(100);
  });

  it('aggregates paid-this-month spending by category', () => {
    const electricity = makeCategory({ id: 'cat-e', name_en: 'Electricity' });
    const water = makeCategory({ id: 'cat-w', name_en: 'Water' });
    const bills = [
      makeBill({ id: '1', status: 'paid', amount: 100, paid_date: '2026-09-01', category: electricity }),
      makeBill({ id: '2', status: 'paid', amount: 40, paid_date: '2026-09-02', category: electricity }),
      makeBill({ id: '3', status: 'paid', amount: 60, paid_date: '2026-09-03', category: water }),
    ];
    const stats = computeDashboardStats(bills);
    expect(stats.categorySpending).toEqual([
      expect.objectContaining({ categoryId: 'cat-e', amount: 140 }),
      expect.objectContaining({ categoryId: 'cat-w', amount: 60 }),
    ]);
  });

  it('excludes a paid-this-month bill with no category from categorySpending without dropping the total', () => {
    const bills = [makeBill({ id: '1', status: 'paid', amount: 75, paid_date: '2026-09-01', category: null })];
    const stats = computeDashboardStats(bills);
    expect(stats.paidThisMonthTotal).toBe(75);
    expect(stats.categorySpending).toEqual([]);
  });

  it('lists upcoming bills sorted by due date, excluding overdue/paid, capped at 5', () => {
    const bills = [
      makeBill({ id: 'overdue', status: 'pending', due_date: '2026-09-01' }),
      makeBill({ id: 'paid', status: 'paid', due_date: '2026-09-05' }),
      makeBill({ id: 'far', status: 'pending', due_date: '2026-09-20' }),
      makeBill({ id: 'near', status: 'pending', due_date: '2026-09-06' }),
      makeBill({ id: 'today', status: 'pending', due_date: '2026-09-04' }),
      makeBill({ id: 'a', status: 'pending', due_date: '2026-09-07' }),
      makeBill({ id: 'b', status: 'pending', due_date: '2026-09-08' }),
      makeBill({ id: 'c', status: 'pending', due_date: '2026-09-09' }),
    ];
    const stats = computeDashboardStats(bills);
    expect(stats.upcomingBills.map((b) => b.id)).toEqual(['today', 'near', 'a', 'b', 'c']);
  });

  it('returns zeroed stats for an empty bill list', () => {
    const stats = computeDashboardStats([]);
    expect(stats).toEqual({
      outstandingTotal: 0,
      outstandingCount: 0,
      overdueTotal: 0,
      overdueCount: 0,
      paidThisMonthTotal: 0,
      upcomingBills: [],
      categorySpending: [],
    });
  });
});
