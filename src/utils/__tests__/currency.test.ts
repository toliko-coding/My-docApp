import { formatAmount } from '@/utils/currency';

describe('formatAmount', () => {
  it('formats known currency codes with their symbol', () => {
    expect(formatAmount(150, 'ILS')).toBe('₪150.00');
    expect(formatAmount(150, 'USD')).toBe('$150.00');
    expect(formatAmount(150, 'EUR')).toBe('€150.00');
  });

  it('defaults to ILS when no currency is given', () => {
    expect(formatAmount(150)).toBe('₪150.00');
  });

  it('falls back to the raw code for an unknown currency', () => {
    expect(formatAmount(150, 'XYZ')).toBe('XYZ150.00');
  });

  it('always shows exactly two decimal places', () => {
    expect(formatAmount(150.5, 'ILS')).toBe('₪150.50');
    expect(formatAmount(150.999, 'ILS')).toBe('₪151.00');
  });

  it('adds thousands separators', () => {
    expect(formatAmount(1234567, 'ILS')).toBe('₪1,234,567.00');
  });
});
