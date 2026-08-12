import * as Localization from 'expo-localization';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { I18nManager } from 'react-native';

import en from './translations/en';
import he from './translations/he';

export const SUPPORTED_LOCALES = ['he', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const RTL_LOCALES: readonly Locale[] = ['he'];

const dictionaries = { en, he } satisfies Record<Locale, typeof en>;

type Dictionary = typeof en;
type DotPath<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : DotPath<T[K], `${Prefix}${K}.`>;
}[keyof T & string];
export type TranslationKey = DotPath<Dictionary>;

function resolve(dict: Dictionary, path: string): string | undefined {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) return (acc as Record<string, unknown>)[key];
    return undefined;
  }, dict) as string | undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

/** Detects the best default locale from the device, falling back to Hebrew (primary market for v1). */
function detectDefaultLocale(): Locale {
  const deviceTag = Localization.getLocales()[0]?.languageCode;
  return deviceTag === 'he' ? 'he' : deviceTag === 'en' ? 'en' : 'he';
}

interface I18nContextValue {
  locale: Locale;
  isRTL: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number> & { count?: number }) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * React Native only fully applies RTL layout direction after a reload, since
 * I18nManager.forceRTL flips a native flag read at bootstrap. We set it as
 * early as possible (module scope) using the detected/stored locale so the
 * very first render is already correct; changing language later in Settings
 * must prompt the user to restart the app.
 */
const initialLocale = detectDefaultLocale();
const initialIsRTL = RTL_LOCALES.includes(initialLocale);
if (I18nManager.isRTL !== initialIsRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(initialIsRTL);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  const value = useMemo<I18nContextValue>(() => {
    const dict = dictionaries[locale];
    const isRTL = RTL_LOCALES.includes(locale);
    return {
      locale,
      isRTL,
      setLocale,
      t: (key, vars) => {
        const path = typeof vars?.count === 'number' ? pluralize(key, vars.count) : key;
        const template = resolve(dict, path) ?? resolve(dict, key) ?? key;
        return interpolate(template, vars as Record<string, string | number> | undefined);
      },
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function pluralize(key: string, count: number): string {
  return `${key}_${count === 1 ? 'one' : 'other'}`;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
