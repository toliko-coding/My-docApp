import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { AttachedDocumentCard } from '@/components/documents/AttachedDocumentCard';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spacing } from '@/constants/theme';
import { useBill, useDeleteBill, useMarkBillPaid, useMarkBillUnpaid } from '@/hooks/use-bills';
import { useDocument } from '@/hooks/use-documents';
import { useTranslation } from '@/i18n';
import { getEffectiveStatus } from '@/utils/bill-status';
import { getCategoryName } from '@/utils/category';
import { formatAmount } from '@/utils/currency';
import { formatBillingPeriod, formatDate, todayIso } from '@/utils/date';

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useTranslation();
  const { data: bill, isLoading } = useBill(id);
  const { data: document } = useDocument(bill?.document_id ?? undefined);
  const markPaid = useMarkBillPaid();
  const markUnpaid = useMarkBillUnpaid();
  const deleteBill = useDeleteBill();

  if (isLoading || !bill) {
    return (
      <ScreenContainer>
        <ActivityIndicator />
      </ScreenContainer>
    );
  }

  const status = getEffectiveStatus(bill);
  const billingPeriod = formatBillingPeriod(bill.billing_period_start, bill.billing_period_end);

  function handleTogglePaid() {
    if (status === 'paid') {
      markUnpaid.mutate(bill!.id);
    } else {
      markPaid.mutate({ id: bill!.id, paidDate: todayIso() });
    }
  }

  function handleDelete() {
    Alert.alert('Delete bill', 'This removes the bill record. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteBill.mutateAsync(bill!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <CategoryIcon icon={bill.category?.icon} size={22} />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="title" style={styles.providerName} numberOfLines={2}>
            {bill.provider?.name ?? 'Unknown provider'}
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            {bill.category ? getCategoryName(bill.category, locale) : '—'}
          </ThemedText>
        </View>
        <StatusBadge status={status} />
      </View>

      <Card style={styles.amountCard}>
        <ThemedText themeColor="textSecondary" type="small">
          Amount
        </ThemedText>
        <ThemedText style={styles.amount}>{formatAmount(bill.amount, bill.currency)}</ThemedText>
      </Card>

      <Card style={styles.detailsCard}>
        <DetailRow label="Issue date" value={formatDate(bill.issue_date)} />
        <DetailRow label="Due date" value={formatDate(bill.due_date)} />
        {billingPeriod ? <DetailRow label="Billing period" value={billingPeriod} /> : null}
        {bill.paid_date ? <DetailRow label="Paid date" value={formatDate(bill.paid_date)} /> : null}
        {bill.payment_method ? <DetailRow label="Payment method" value={bill.payment_method} /> : null}
        {bill.invoice_number ? <DetailRow label="Invoice number" value={bill.invoice_number} /> : null}
        {bill.customer_number ? <DetailRow label="Customer number" value={bill.customer_number} /> : null}
        {bill.reference_number ? <DetailRow label="Reference number" value={bill.reference_number} /> : null}
      </Card>

      {document ? (
        <AttachedDocumentCard document={document} onPress={() => router.push(`/document/${document.id}`)} />
      ) : null}

      {bill.notes ? (
        <Card>
          <ThemedText themeColor="textSecondary" type="small">
            Notes
          </ThemedText>
          <ThemedText style={styles.notes}>{bill.notes}</ThemedText>
        </Card>
      ) : null}

      <View style={styles.actions}>
        <Button
          label={status === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
          onPress={handleTogglePaid}
          loading={markPaid.isPending || markUnpaid.isPending}
        />
        <Button label="Edit" variant="secondary" onPress={() => router.push(`/bill/${bill.id}/edit`)} />
        <Button label="Delete" variant="ghost" onPress={handleDelete} />
      </View>
    </ScreenContainer>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText themeColor="textSecondary">{label}</ThemedText>
      <ThemedText>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, minWidth: 0 },
  providerName: { fontSize: 22, lineHeight: 28 },
  amountCard: { gap: 4 },
  amount: { fontSize: 32, fontWeight: '700' },
  detailsCard: { gap: Spacing.two },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  notes: { marginTop: 4 },
  actions: { gap: Spacing.two, marginTop: Spacing.two },
});
