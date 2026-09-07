import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Spacing } from '@/constants/theme';
import { SUPPORTED_LOCALES, useTranslation, type Locale } from '@/i18n';
import { SUPPORTED_CURRENCIES, type CurrencyCode } from '@/utils/currency';

const LOCALE_LABELS: Record<Locale, string> = { he: 'עברית', en: 'English' };

interface PreferencesCardProps {
  locale: Locale;
  onChangeLocale: (locale: Locale) => void;
  currency: CurrencyCode;
  onChangeCurrency: (currency: CurrencyCode) => void;
}

export function PreferencesCard({ locale, onChangeLocale, currency, onChangeCurrency }: PreferencesCardProps) {
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <ThemedText themeColor="textSecondary" type="small" style={styles.label}>
          {t('profile.language')}
        </ThemedText>
        <View style={styles.localeRow}>
          {SUPPORTED_LOCALES.map((code) => (
            <Button
              key={code}
              label={LOCALE_LABELS[code]}
              variant={code === locale ? 'primary' : 'secondary'}
              onPress={() => onChangeLocale(code)}
            />
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <ThemedText themeColor="textSecondary" type="small" style={styles.label}>
          {t('profile.defaultCurrency')}
        </ThemedText>
        <SegmentedControl
          options={SUPPORTED_CURRENCIES.map((code) => ({ value: code, label: code }))}
          value={currency}
          onChange={onChangeCurrency}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  row: { gap: Spacing.one },
  label: { marginBottom: 2 },
  localeRow: { flexDirection: 'row', gap: Spacing.two },
});
