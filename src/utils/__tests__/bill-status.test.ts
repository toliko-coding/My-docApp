import { getEffectiveStatus } from '@/utils/bill-status';

describe('getEffectiveStatus', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 4, 12, 0, 0)); // 2026-09-04
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('derives overdue from a pending bill past its due date', () => {
    expect(getEffectiveStatus({ status: 'pending', due_date: '2026-09-01' })).toBe('overdue');
  });

  it('keeps a pending bill pending when the due date has not passed', () => {
    expect(getEffectiveStatus({ status: 'pending', due_date: '2026-09-10' })).toBe('pending');
  });

  it('keeps a pending bill pending when there is no due date', () => {
    expect(getEffectiveStatus({ status: 'pending', due_date: null })).toBe('pending');
  });

  it('never overrides an explicit paid status, even past the due date', () => {
    expect(getEffectiveStatus({ status: 'paid', due_date: '2026-01-01' })).toBe('paid');
  });

  it('passes through statuses it does not derive (partially_paid, unknown)', () => {
    expect(getEffectiveStatus({ status: 'partially_paid', due_date: '2026-01-01' })).toBe('partially_paid');
    expect(getEffectiveStatus({ status: 'unknown', due_date: '2026-01-01' })).toBe('unknown');
  });
});
