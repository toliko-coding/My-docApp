import type { BillWithRelations, Category, Provider } from '@/types/database';

export function makeProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: 'provider-1',
    user_id: 'user-1',
    name: 'Test Provider',
    normalized_name: 'test provider',
    default_category_id: null,
    country: null,
    aliases: [],
    logo_url: null,
    is_system: false,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'category-1',
    user_id: null,
    key: 'electricity',
    name_en: 'Electricity',
    name_he: 'חשמל',
    icon: 'zap',
    color: null,
    sort_order: 0,
    is_system: true,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeBill(overrides: Partial<BillWithRelations> = {}): BillWithRelations {
  return {
    id: 'bill-1',
    user_id: 'user-1',
    provider_id: 'provider-1',
    category_id: 'category-1',
    document_id: null,
    invoice_number: null,
    customer_number: null,
    amount: 100,
    currency: 'ILS',
    amount_before_vat: null,
    amount_after_vat: null,
    issue_date: null,
    due_date: null,
    billing_period_start: null,
    billing_period_end: null,
    status: 'pending',
    paid_date: null,
    payment_method: null,
    reference_number: null,
    notes: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    provider: makeProvider(),
    category: makeCategory(),
    ...overrides,
  };
}
