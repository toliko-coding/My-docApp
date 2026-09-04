import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { BillWithRelations } from '@/types/database';
import { formatAmount } from '@/utils/currency';
import { formatDate } from '@/utils/date';

interface MatchSuggestionCardProps {
  bill: BillWithRelations;
  /** 'bill_receipt': this document looks like proof of payment for the bill below. 'duplicate': this document looks like the same bill you already have. */
  flavor: 'bill_receipt' | 'duplicate';
  onPrimaryAction: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

export function MatchSuggestionCard({ bill, flavor, onPrimaryAction, onDismiss, isLoading }: MatchSuggestionCardProps) {
  const theme = useTheme();

  const title =
    flavor === 'bill_receipt' ? 'Looks like a payment for an existing bill' : 'This might already be in your bills';
  const primaryLabel = flavor === 'bill_receipt' ? 'Mark existing bill as paid' : 'View existing bill';
  const dismissLabel = flavor === 'bill_receipt' ? "It's not the same bill" : "It's a different bill";

  return (
    <Card style={[styles.card, { backgroundColor: theme.warningBg, borderColor: theme.warning }]}>
      <ThemedText type="smallBold" themeColor="warning">
        {title}
      </ThemedText>
      <View style={styles.billInfo}>
        <ThemedText numberOfLines={1}>{bill.provider?.name ?? 'Unknown provider'}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatAmount(bill.amount, bill.currency)}
          {bill.due_date ? ` · Due ${formatDate(bill.due_date)}` : ''}
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <Button label={primaryLabel} onPress={onPrimaryAction} loading={isLoading} />
        <Button label={dismissLabel} variant="ghost" onPress={onDismiss} disabled={isLoading} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  billInfo: { gap: 2 },
  actions: { gap: Spacing.two, marginTop: Spacing.one },
});
