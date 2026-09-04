import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { Spacing } from '@/constants/theme';
import { formatAmount } from '@/utils/currency';

interface StatCardProps {
  label: string;
  amount: number;
  currency?: string;
  subtitle?: string;
}

export function StatCard({ label, amount, currency = 'ILS', subtitle }: StatCardProps) {
  return (
    <Card style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
        {formatAmount(amount, currency)}
      </ThemedText>
      {subtitle ? (
        <ThemedText type="small" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      ) : null}
    </Card>
  );
}

export function StatCardRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: 4 },
  amount: { fontSize: 24, fontWeight: '700' },
  row: { flexDirection: 'row', gap: Spacing.two },
});
