import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import type { RecurringProvider } from '@/utils/recurring';
import { formatAmount } from '@/utils/currency';

interface RecurringBillsCardProps {
  providers: RecurringProvider[];
}

export function RecurringBillsCard({ providers }: RecurringBillsCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (providers.length === 0) return null;

  return (
    <Card style={styles.card}>
      <View>
        <ThemedText type="smallBold">{t('dashboard.recurringBills')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('dashboard.recurringBillsSubtitle')}
        </ThemedText>
      </View>
      <View style={styles.list}>
        {providers.map((provider) => (
          <View key={provider.providerId} style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
              <CategoryIcon icon={provider.categoryIcon} size={16} color={theme.text} />
            </View>
            <View style={styles.info}>
              <ThemedText numberOfLines={1}>{provider.providerName}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t('dashboard.aboutEveryMonth', { days: provider.averageIntervalDays })}
              </ThemedText>
            </View>
            <ThemedText style={styles.amount}>{formatAmount(provider.averageAmount, 'ILS')}</ThemedText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  list: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  amount: { fontWeight: '600' },
});
