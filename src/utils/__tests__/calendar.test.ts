import { makeBill } from '@/test-utils/fixtures';
import { groupBillsByDueMonth } from '@/utils/calendar';

describe('groupBillsByDueMonth', () => {
  it('excludes bills with no due date', () => {
    const bills = [makeBill({ id: '1', due_date: null })];
    expect(groupBillsByDueMonth(bills)).toEqual([]);
  });

  it('groups bills into month sections keyed by YYYY-MM', () => {
    const bills = [
      makeBill({ id: '1', due_date: '2026-09-04' }),
      makeBill({ id: '2', due_date: '2026-09-20' }),
      makeBill({ id: '3', due_date: '2026-10-01' }),
    ];
    const sections = groupBillsByDueMonth(bills);
    expect(sections.map((s) => s.key)).toEqual(['2026-09', '2026-10']);
    expect(sections[0].data.map((b) => b.id)).toEqual(['1', '2']);
    expect(sections[1].data.map((b) => b.id)).toEqual(['3']);
  });

  it('labels each section with a human-readable month and year', () => {
    const bills = [makeBill({ id: '1', due_date: '2026-09-04' })];
    expect(groupBillsByDueMonth(bills)[0].title).toBe('September 2026');
  });

  it('orders sections chronologically regardless of input order', () => {
    const bills = [
      makeBill({ id: 'later', due_date: '2027-01-05' }),
      makeBill({ id: 'earlier', due_date: '2026-06-01' }),
    ];
    const sections = groupBillsByDueMonth(bills);
    expect(sections.map((s) => s.key)).toEqual(['2026-06', '2027-01']);
  });

  it('sorts bills within a section by due date ascending', () => {
    const bills = [
      makeBill({ id: 'late', due_date: '2026-09-25' }),
      makeBill({ id: 'early', due_date: '2026-09-02' }),
      makeBill({ id: 'mid', due_date: '2026-09-14' }),
    ];
    const sections = groupBillsByDueMonth(bills);
    expect(sections[0].data.map((b) => b.id)).toEqual(['early', 'mid', 'late']);
  });

  it('returns an empty array for no bills', () => {
    expect(groupBillsByDueMonth([])).toEqual([]);
  });
});
