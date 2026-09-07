import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { AttachedDocumentCard } from '@/components/documents/AttachedDocumentCard';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useBill, useDeleteBill, useMarkBillPaid, useMarkBillUnpaid } from '@/hooks/use-bills';
import { useDocument } from '@/hooks/use-documents';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useTranslation, type TranslationKey } from '@/i18n';
import { clearBillReminders, syncBillReminders } from '@/services/bill-reminders';
import { getEffectiveStatus } from '@/utils/bill-status';
import { getCategoryName } from '@/utils/category';
import { formatAmount } from '@/utils/currency';
import { formatBillingPeriod, formatDate, todayIso } from '@/utils/date';

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const { data: bill, isLoading, isError, error, refetch } = useBill(id);
  const { data: document } = useDocument(bill?.document_id ?? undefined);
  const { data: settings } = useUserSettings();
  const markPaid = useMarkBillPaid();
  const markUnpaid = useMarkBillUnpaid();
  const deleteBill = useDeleteBill();

  if (isLoading || !bill) {
    return (
      <ScreenContainer>
        {isError ? (
          <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />
        ) : (
          <ActivityIndicator />
        )}
      </ScreenContainer>
    );
  }

  const status = getEffectiveStatus(bill);
  const billingPeriod = formatBillingPeriod(bill.billing_period_start, bill.billing_period_end, locale);

  async function handleTogglePaid() {
    if (!settings) return;
    const updated =
      status === 'paid'
        ? await markUnpaid.mutateAsync(bill!.id)
        : await markPaid.mutateAsync({ id: bill!.id, paidDate: todayIso() });

    await syncBillReminders({
      userId: user!.id,
      billId: updated.id,
      providerName: bill!.provider?.name ?? '',
      amount: updated.amount,
      currency: updated.currency,
      dueDate: updated.due_date,
      status: updated.status,
      notificationsEnabled: settings.notifications_enabled,
      reminderDaysBefore: settings.reminder_days_before,
    });
  }

  function handleDelete() {
    Alert.alert(t('billDetail.deleteConfirmTitle'), t('billDetail.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteBill.mutateAsync(bill!.id);
          await clearBillReminders(bill!.id);
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
            {bill.provider?.name ?? t('common.unknownProvider')}
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            {bill.category ? getCategoryName(bill.category, locale) : '—'}
          </ThemedText>
        </View>
        <StatusBadge status={status} />
      </View>

      <Card style={styles.amountCard}>
        <ThemedText themeColor="textSecondary" type="small">
          {t('billFields.amount')}
        </ThemedText>
        <ThemedText style={styles.amount}>{formatAmount(bill.amount, bill.currency)}</ThemedText>
      </Card>

      <Card style={styles.detailsCard}>
        <DetailRow labelKey="billFields.issueDate" value={formatDate(bill.issue_date)} />
        <DetailRow labelKey="billFields.dueDate" value={formatDate(bill.due_date)} />
        {billingPeriod ? <DetailRow labelKey="billFields.billingPeriod" value={billingPeriod} /> : null}
        {bill.paid_date ? <DetailRow labelKey="billFields.paidDate" value={formatDate(bill.paid_date)} /> : null}
        {bill.payment_method ? <DetailRow labelKey="billFields.paymentMethod" value={bill.payment_method} /> : null}
        {bill.invoice_number ? <DetailRow labelKey="billFields.invoiceNumber" value={bill.invoice_number} /> : null}
        {bill.customer_number ? (
          <DetailRow labelKey="billFields.customerNumber" value={bill.customer_number} />
        ) : null}
        {bill.reference_number ? (
          <DetailRow labelKey="billFields.referenceNumber" value={bill.reference_number} />
        ) : null}
      </Card>

      {document ? (
        <AttachedDocumentCard document={document} onPress={() => router.push(`/document/${document.id}`)} />
      ) : null}

      {bill.notes ? (
        <Card>
          <ThemedText themeColor="textSecondary" type="small">
            {t('billFields.notes')}
          </ThemedText>
          <ThemedText style={styles.notes}>{bill.notes}</ThemedText>
        </Card>
      ) : null}

      <View style={styles.actions}>
        <Button
          label={status === 'paid' ? t('billDetail.markAsUnpaid') : t('billDetail.markAsPaid')}
          onPress={handleTogglePaid}
          loading={markPaid.isPending || markUnpaid.isPending}
        />
        <Button label={t('common.edit')} variant="secondary" onPress={() => router.push(`/bill/${bill.id}/edit`)} />
        <Button label={t('common.delete')} variant="ghost" onPress={handleDelete} />
      </View>
    </ScreenContainer>
  );
}

function DetailRow({ labelKey, value }: { labelKey: TranslationKey; value: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.detailRow}>
      <ThemedText themeColor="textSecondary">{t(labelKey)}</ThemedText>
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
