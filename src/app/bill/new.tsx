import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert } from 'react-native';

import { AttachedDocumentCard } from '@/components/documents/AttachedDocumentCard';
import { BillForm } from '@/components/bills/BillForm';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useCategories } from '@/hooks/use-categories';
import { useCreateBill } from '@/hooks/use-bills';
import { useDocument } from '@/hooks/use-documents';
import { useDocumentExtraction } from '@/hooks/use-document-extraction';
import { useProfile } from '@/hooks/use-profile';
import { useUserSettings } from '@/hooks/use-user-settings';
import { findOrCreateProvider } from '@/repositories/providers.repository';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/i18n';
import { emptyBillFormValues, type BillFormValues } from '@/schemas/bill-form.schema';
import { syncBillReminders } from '@/services/bill-reminders';

export default function NewBillScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { documentId } = useLocalSearchParams<{ documentId?: string }>();
  const { data: categories = [] } = useCategories();
  const { data: attachedDocument } = useDocument(documentId);
  const { data: extraction, isLoading: isLoadingExtraction } = useDocumentExtraction(documentId);
  const { data: settings } = useUserSettings();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const createBill = useCreateBill();

  // BillForm seeds its local state from initialValues only once, on mount —
  // so we must know whether a confirmed AI extraction exists (and the
  // user's default currency) *before* rendering it, the same way edit.tsx
  // waits for the bill to load first.
  if ((documentId && isLoadingExtraction) || isLoadingProfile) {
    return (
      <ScreenContainer>
        <ActivityIndicator />
      </ScreenContainer>
    );
  }

  // Only prefill from a confirmed AI review — a pending/unreviewed extraction
  // (e.g. the user tapped "Enter manually instead") is never shown as fact.
  const confirmed = extraction?.review_status === 'confirmed' ? extraction : null;
  const defaultCurrency = profile?.currency ?? emptyBillFormValues.currency;
  const initialValues: Partial<BillFormValues> | undefined = confirmed
    ? {
        providerName: confirmed.provider_name_raw ?? emptyBillFormValues.providerName,
        categoryId: confirmed.category_id ?? emptyBillFormValues.categoryId,
        amount: confirmed.amount != null ? String(confirmed.amount) : emptyBillFormValues.amount,
        currency: confirmed.currency ?? defaultCurrency,
        issueDate: confirmed.issue_date ?? emptyBillFormValues.issueDate,
        dueDate: confirmed.due_date ?? emptyBillFormValues.dueDate,
        billingPeriodStart: confirmed.billing_period_start ?? emptyBillFormValues.billingPeriodStart,
        billingPeriodEnd: confirmed.billing_period_end ?? emptyBillFormValues.billingPeriodEnd,
        invoiceNumber: confirmed.invoice_number ?? emptyBillFormValues.invoiceNumber,
        customerNumber: confirmed.customer_number ?? emptyBillFormValues.customerNumber,
        referenceNumber: confirmed.reference_number ?? emptyBillFormValues.referenceNumber,
        paymentMethod: confirmed.payment_method ?? emptyBillFormValues.paymentMethod,
      }
    : { currency: defaultCurrency };

  async function handleSubmit(values: BillFormValues) {
    try {
      const category = categories.find((c) => c.id === values.categoryId);
      const provider = await findOrCreateProvider(user!.id, values.providerName, category?.id ?? null);

      const bill = await createBill.mutateAsync({
        provider_id: provider.id,
        category_id: values.categoryId || null,
        document_id: documentId ?? null,
        invoice_number: values.invoiceNumber || null,
        customer_number: values.customerNumber || null,
        amount: Number(values.amount),
        currency: values.currency,
        amount_before_vat: null,
        amount_after_vat: null,
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
          billId: bill.id,
          providerName: values.providerName,
          amount: bill.amount,
          currency: bill.currency,
          dueDate: bill.due_date,
          status: bill.status,
          notificationsEnabled: settings.notifications_enabled,
          reminderDaysBefore: settings.reminder_days_before,
        });
      }

      // Not router.back(): when reached via Scan -> AI review -> here, back()
      // would land on the (now-stale) review screen instead of the bill list.
      router.dismissTo('/(tabs)/bills');
    } catch (error) {
      Alert.alert(t('billForm.saveErrorTitle'), error instanceof Error ? error.message : t('billForm.tryAgain'));
    }
  }

  return (
    <ScreenContainer scroll>
      {attachedDocument ? <AttachedDocumentCard document={attachedDocument} /> : null}
      <BillForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel={t('billForm.addBillTitle')}
        isSubmitting={createBill.isPending}
      />
    </ScreenContainer>
  );
}
