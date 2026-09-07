import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
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
  const { t } = useTranslation();

  const title = t(flavor === 'bill_receipt' ? 'documentReview.matchBillReceiptTitle' : 'documentReview.matchDuplicateTitle');
  const primaryLabel = t(
    flavor === 'bill_receipt' ? 'documentReview.matchPrimaryBillReceipt' : 'documentReview.matchPrimaryDuplicate',
  );
  const dismissLabel = t(
    flavor === 'bill_receipt' ? 'documentReview.matchDismissBillReceipt' : 'documentReview.matchDismissDuplicate',
  );

  return (
    <Card style={[styles.card, { backgroundColor: theme.warningBg, borderColor: theme.warning }]}>
      <ThemedText type="smallBold" themeColor="warning">
        {title}
      </ThemedText>
      <View style={styles.billInfo}>
        <ThemedText numberOfLines={1}>{bill.provider?.name ?? t('common.unknownProvider')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatAmount(bill.amount, bill.currency)}
          {bill.due_date ? ` · ${t('dashboard.dueOn', { date: formatDate(bill.due_date) })}` : ''}
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
