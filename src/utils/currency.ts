export const SUPPORTED_CURRENCIES = ['ILS', 'USD', 'EUR'] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

const CURRENCY_SYMBOLS: Record<string, string> = {
  ILS: '₪',
  USD: '$',
  EUR: '€',
};

export function formatAmount(amount: number, currency: string = 'ILS'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}
