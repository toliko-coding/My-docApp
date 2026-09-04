import { billFormSchema, emptyBillFormValues } from '@/schemas/bill-form.schema';

function valid(overrides: Partial<typeof emptyBillFormValues> = {}) {
  return {
    ...emptyBillFormValues,
    providerName: 'Electric Co',
    categoryId: 'cat-1',
    amount: '150.50',
    currency: 'ILS',
    ...overrides,
  };
}

describe('billFormSchema', () => {
  it('accepts a minimal valid bill', () => {
    expect(billFormSchema.safeParse(valid()).success).toBe(true);
  });

  it('rejects a missing provider name', () => {
    const result = billFormSchema.safeParse(valid({ providerName: '  ' }));
    expect(result.success).toBe(false);
  });

  it('rejects a missing category', () => {
    const result = billFormSchema.safeParse(valid({ categoryId: '' }));
    expect(result.success).toBe(false);
  });

  it.each(['abc', '0', '-5', ''])('rejects an invalid amount %p', (amount) => {
    expect(billFormSchema.safeParse(valid({ amount })).success).toBe(false);
  });

  it('accepts a positive decimal amount', () => {
    expect(billFormSchema.safeParse(valid({ amount: '0.01' })).success).toBe(true);
  });

  it('requires paidDate when status is paid', () => {
    const result = billFormSchema.safeParse(valid({ status: 'paid', paidDate: '' }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('paidDate'))).toBe(true);
    }
  });

  it('accepts status paid when paidDate is set', () => {
    const result = billFormSchema.safeParse(valid({ status: 'paid', paidDate: '2026-09-04' }));
    expect(result.success).toBe(true);
  });

  it('does not require paidDate for non-paid statuses', () => {
    for (const status of ['pending', 'partially_paid', 'unknown'] as const) {
      expect(billFormSchema.safeParse(valid({ status, paidDate: '' })).success).toBe(true);
    }
  });

  it('rejects a billing period with only a start date', () => {
    const result = billFormSchema.safeParse(valid({ billingPeriodStart: '2026-09-01', billingPeriodEnd: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects a billing period with only an end date', () => {
    const result = billFormSchema.safeParse(valid({ billingPeriodStart: '', billingPeriodEnd: '2026-09-30' }));
    expect(result.success).toBe(false);
  });

  it('accepts a billing period with both dates, or neither', () => {
    expect(
      billFormSchema.safeParse(valid({ billingPeriodStart: '2026-09-01', billingPeriodEnd: '2026-09-30' })).success,
    ).toBe(true);
    expect(billFormSchema.safeParse(valid({ billingPeriodStart: '', billingPeriodEnd: '' })).success).toBe(true);
  });

  it('rejects a malformed date string', () => {
    expect(billFormSchema.safeParse(valid({ dueDate: '09/04/2026' })).success).toBe(false);
  });
});
