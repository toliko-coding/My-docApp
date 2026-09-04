import { formatBillingPeriod, formatDate, formatShortDate, isPastDue, toIsoDate, todayIso } from '@/utils/date';

describe('formatDate', () => {
  it('converts an ISO date to DD/MM/YYYY', () => {
    expect(formatDate('2026-09-04')).toBe('04/09/2026');
  });

  it('returns an em dash for missing dates', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
  });
});

describe('formatShortDate', () => {
  it('formats as "Mon D"', () => {
    expect(formatShortDate('2026-09-04')).toBe('Sep 4');
  });

  it('returns an em dash for missing dates', () => {
    expect(formatShortDate(null)).toBe('—');
  });
});

describe('formatBillingPeriod', () => {
  it('returns null when either bound is missing', () => {
    expect(formatBillingPeriod(null, '2026-09-30')).toBeNull();
    expect(formatBillingPeriod('2026-09-01', null)).toBeNull();
    expect(formatBillingPeriod(null, null)).toBeNull();
  });

  it('collapses to one year when start and end share a year', () => {
    expect(formatBillingPeriod('2026-09-01', '2026-10-31')).toBe('Sep–Oct 2026');
  });

  it('shows both years when the period spans a year boundary', () => {
    expect(formatBillingPeriod('2026-12-01', '2027-01-31')).toBe('Dec 2026 – Jan 2027');
  });
});

describe('toIsoDate / todayIso', () => {
  it('pads month and day to two digits', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('todayIso matches toIsoDate(new Date()) under a fixed clock', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 4, 12, 0, 0));
    expect(todayIso()).toBe('2026-09-04');
    jest.useRealTimers();
  });
});

describe('isPastDue', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 4, 12, 0, 0)); // 2026-09-04
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('is false when there is no due date', () => {
    expect(isPastDue(null)).toBe(false);
    expect(isPastDue(undefined)).toBe(false);
  });

  it('is false for a due date today or in the future', () => {
    expect(isPastDue('2026-09-04')).toBe(false);
    expect(isPastDue('2026-09-05')).toBe(false);
  });

  it('is true for a due date before today', () => {
    expect(isPastDue('2026-09-03')).toBe(true);
  });
});
