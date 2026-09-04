import { getCategoryName, normalizeProviderName } from '@/utils/category';

describe('getCategoryName', () => {
  const category = { name_en: 'Electricity', name_he: 'חשמל' };

  it('returns the Hebrew name for locale "he"', () => {
    expect(getCategoryName(category, 'he')).toBe('חשמל');
  });

  it('returns the English name for locale "en"', () => {
    expect(getCategoryName(category, 'en')).toBe('Electricity');
  });
});

describe('normalizeProviderName', () => {
  it('lowercases and trims', () => {
    expect(normalizeProviderName('  Electric Company  ')).toBe('electric company');
  });

  it('collapses internal whitespace runs to a single space', () => {
    expect(normalizeProviderName('Electric    Company')).toBe('electric company');
  });

  it('strips combining diacritics', () => {
    expect(normalizeProviderName('Café Électrique')).toBe('cafe electrique');
  });

  it('treats visually-equivalent names as equal after normalization', () => {
    expect(normalizeProviderName('  IEC ')).toBe(normalizeProviderName('iec'));
  });
});
