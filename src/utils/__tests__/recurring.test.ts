import { makeBill, makeProvider } from '@/test-utils/fixtures';
import { detectRecurringProviders } from '@/utils/recurring';

describe('detectRecurringProviders', () => {
  it('ignores providers with fewer than 2 bills', () => {
    const bills = [makeBill({ id: '1', issue_date: '2026-01-01' })];
    expect(detectRecurringProviders(bills)).toEqual([]);
  });

  it('ignores bills with no linked provider', () => {
    const bills = [
      makeBill({ id: '1', provider: null, issue_date: '2026-01-01' }),
      makeBill({ id: '2', provider: null, issue_date: '2026-02-01' }),
    ];
    expect(detectRecurringProviders(bills)).toEqual([]);
  });

  it('computes average amount and average interval across a provider’s bills', () => {
    const provider = makeProvider({ id: 'p1', name: 'Electric Co' });
    const bills = [
      makeBill({ id: '1', provider, amount: 100, issue_date: '2026-01-01' }),
      makeBill({ id: '2', provider, amount: 120, issue_date: '2026-02-01' }),
      makeBill({ id: '3', provider, amount: 110, issue_date: '2026-03-03' }),
    ];
    const [result] = detectRecurringProviders(bills);
    expect(result.providerId).toBe('p1');
    expect(result.providerName).toBe('Electric Co');
    expect(result.occurrences).toBe(3);
    expect(result.averageAmount).toBeCloseTo(110);
    // Jan 1 -> Feb 1 = 31 days, Feb 1 -> Mar 3 = 30 days -> average 30.5 -> rounds to 31 (round-half-up)
    expect(result.averageIntervalDays).toBe(31);
  });

  it('falls back to created_at when issue_date is missing', () => {
    const provider = makeProvider({ id: 'p1' });
    const bills = [
      makeBill({ id: '1', provider, issue_date: null, created_at: '2026-01-01T00:00:00.000Z' }),
      makeBill({ id: '2', provider, issue_date: null, created_at: '2026-02-01T00:00:00.000Z' }),
    ];
    const [result] = detectRecurringProviders(bills);
    expect(result.averageIntervalDays).toBe(31);
  });

  it('sorts results by occurrence count, descending', () => {
    const frequent = makeProvider({ id: 'frequent', name: 'Frequent' });
    const rare = makeProvider({ id: 'rare', name: 'Rare' });
    const bills = [
      makeBill({ id: '1', provider: rare, issue_date: '2026-01-01' }),
      makeBill({ id: '2', provider: rare, issue_date: '2026-04-01' }),
      makeBill({ id: '3', provider: frequent, issue_date: '2026-01-01' }),
      makeBill({ id: '4', provider: frequent, issue_date: '2026-02-01' }),
      makeBill({ id: '5', provider: frequent, issue_date: '2026-03-01' }),
    ];
    const results = detectRecurringProviders(bills);
    expect(results.map((r) => r.providerId)).toEqual(['frequent', 'rare']);
  });

  it('skips a same-day repeat (zero-day interval) rather than dragging the average to zero', () => {
    const provider = makeProvider({ id: 'p1' });
    const bills = [
      makeBill({ id: '1', provider, issue_date: '2026-01-01' }),
      makeBill({ id: '2', provider, issue_date: '2026-01-01' }),
      makeBill({ id: '3', provider, issue_date: '2026-02-01' }),
    ];
    const [result] = detectRecurringProviders(bills);
    // Only the 31-day gap counts; the 0-day gap is dropped.
    expect(result.averageIntervalDays).toBe(31);
  });
});
