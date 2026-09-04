import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import type { BillWithRelations } from '@/types/database';
import { formatAmount } from '@/utils/currency';
import { formatDate } from '@/utils/date';

interface UpcomingPaymentsCardProps {
  bills: BillWithRelations[];
  onPressBill: (id: string) => void;
}

export function UpcomingPaymentsCard({ bills, onPressBill }: UpcomingPaymentsCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold">{t('dashboard.upcomingPayments')}</ThemedText>
      {bills.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Nothing due soon.
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {bills.map((bill) => (
            <Pressable
              key={bill.id}
              accessibilityRole="button"
              onPress={() => onPressBill(bill.id)}
              style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
                <CategoryIcon icon={bill.category?.icon} size={16} color={theme.text} />
              </View>
              <View style={styles.info}>
                <ThemedText numberOfLines={1}>{bill.provider?.name ?? 'Unknown provider'}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('dashboard.dueOn', { date: formatDate(bill.due_date) })}
                </ThemedText>
              </View>
              <ThemedText style={styles.amount}>{formatAmount(bill.amount, bill.currency)}</ThemedText>
            </Pressable>
          ))}
        </View>
      )}
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
