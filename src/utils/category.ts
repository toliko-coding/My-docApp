import type { Locale } from '@/i18n';
import type { Category } from '@/types/database';

export function getCategoryName(category: Pick<Category, 'name_en' | 'name_he'>, locale: Locale): string {
  return locale === 'he' ? category.name_he : category.name_en;
}

/** Lowercased, diacritics/whitespace-normalized — used to match a typed provider name against existing providers. */
export function normalizeProviderName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}
