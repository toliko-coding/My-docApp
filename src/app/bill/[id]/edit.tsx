import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert } from 'react-native';

import { BillForm } from '@/components/bills/BillForm';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useBill, useUpdateBill } from '@/hooks/use-bills';
import { useUserSettings } from '@/hooks/use-user-settings';
import { findOrCreateProvider } from '@/repositories/providers.repository';
import { useAuth } from '@/contexts/auth-context';
import type { BillFormValues } from '@/schemas/bill-form.schema';
import { syncBillReminders } from '@/services/bill-reminders';

export default function EditBillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: bill, isLoading, isError, error, refetch } = useBill(id);
  const { data: settings } = useUserSettings();
  const updateBill = useUpdateBill(id!);

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

  async function handleSubmit(values: BillFormValues) {
    try {
      const provider = await findOrCreateProvider(user!.id, values.providerName, values.categoryId || null);

      const updated = await updateBill.mutateAsync({
        provider_id: provider.id,
        category_id: values.categoryId || null,
        invoice_number: values.invoiceNumber || null,
        customer_number: values.customerNumber || null,
        amount: Number(values.amount),
        currency: values.currency,
        issue_date: values.issueDate || null,
        due_date: values.dueDate || null,
        billing_period_start: values.billingPeriodStart || null,
        billing_period_end: values.billingPeriodEnd || null,
        status: values.status,
        paid_date: values.status === 'paid' ? values.paidDate || null : null,
        payment_method: values.paymentMethod || null,
        reference_number: values.referenceNumber || null,
        notes: values.notes || null,
      });

      if (settings) {
        await syncBillReminders({
          userId: user!.id,
          billId: updated.id,
          providerName: values.providerName,
          amount: updated.amount,
          currency: updated.currency,
          dueDate: updated.due_date,
          status: updated.status,
          notificationsEnabled: settings.notifications_enabled,
          reminderDaysBefore: settings.reminder_days_before,
        });
      }

      router.back();
    } catch (error) {
      Alert.alert('Could not save bill', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <ScreenContainer scroll>
      <BillForm
        initialValues={{
          providerName: bill.provider?.name ?? '',
          categoryId: bill.category_id ?? '',
          amount: String(bill.amount),
          currency: bill.currency,
          issueDate: bill.issue_date ?? '',
          dueDate: bill.due_date ?? '',
          billingPeriodStart: bill.billing_period_start ?? '',
          billingPeriodEnd: bill.billing_period_end ?? '',
          status: bill.status === 'overdue' ? 'pending' : bill.status,
          paidDate: bill.paid_date ?? '',
          invoiceNumber: bill.invoice_number ?? '',
          customerNumber: bill.customer_number ?? '',
          referenceNumber: bill.reference_number ?? '',
          paymentMethod: bill.payment_method ?? '',
          notes: bill.notes ?? '',
        }}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        isSubmitting={updateBill.isPending}
      />
    </ScreenContainer>
  );
}
