import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import type { Locale } from '@/i18n';
import type { CategorySpending } from '@/utils/dashboard';
import { formatAmount } from '@/utils/currency';

interface CategorySpendingCardProps {
  categories: CategorySpending[];
}

export function CategorySpendingCard({ categories }: CategorySpendingCardProps) {
  const theme = useTheme();
  const { t, locale } = useTranslation();

  const maxAmount = Math.max(...categories.map((c) => c.amount), 1);

  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold">{t('dashboard.monthlySpending')}</ThemedText>
      {categories.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No payments recorded this month yet.
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {categories.map((category) => (
            <View key={category.categoryId} style={styles.row}>
              <CategoryIcon icon={category.icon} size={16} color={theme.textSecondary} />
              <View style={styles.barColumn}>
                <View style={styles.labelRow}>
                  <ThemedText type="small" numberOfLines={1} style={styles.name}>
                    {localizedCategoryName(category, locale)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatAmount(category.amount, 'ILS')}
                  </ThemedText>
                </View>
                <View style={[styles.barTrack, { backgroundColor: theme.backgroundElement }]}>
                  <View
                    style={[
                      styles.barFill,
                      { backgroundColor: theme.primary, width: `${(category.amount / maxAmount) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function localizedCategoryName(category: CategorySpending, locale: Locale): string {
  return locale === 'he' ? category.nameHe : category.nameEn;
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  list: { gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  barColumn: { flex: 1, gap: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  name: { flex: 1 },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
});
