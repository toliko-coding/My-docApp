import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { BillWithRelations } from '@/types/database';
import { getEffectiveStatus } from '@/utils/bill-status';
import { formatAmount } from '@/utils/currency';
import { formatBillingPeriod, formatDate } from '@/utils/date';

export function BillListItem({ bill, onPress }: { bill: BillWithRelations; onPress: () => void }) {
  const theme = useTheme();
  const status = getEffectiveStatus(bill);
  const billingPeriod = formatBillingPeriod(bill.billing_period_start, bill.billing_period_end);

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
          <CategoryIcon icon={bill.category?.icon} size={20} color={theme.text} />
        </View>
        <View style={styles.middle}>
          <ThemedText numberOfLines={1}>{bill.provider?.name ?? 'Unknown provider'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {bill.due_date ? `Due ${formatDate(bill.due_date)}` : 'No due date'}
          </ThemedText>
          {billingPeriod ? (
            <ThemedText type="small" themeColor="textSecondary">
              {billingPeriod}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.right}>
          <ThemedText style={styles.amount}>{formatAmount(bill.amount, bill.currency)}</ThemedText>
          <StatusBadge status={status} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1, minWidth: 0, gap: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontWeight: '600' },
});
