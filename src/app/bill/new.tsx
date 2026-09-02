import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { AttachedDocumentCard } from '@/components/documents/AttachedDocumentCard';
import { BillForm } from '@/components/bills/BillForm';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useCategories } from '@/hooks/use-categories';
import { useCreateBill } from '@/hooks/use-bills';
import { useDocument } from '@/hooks/use-documents';
import { findOrCreateProvider } from '@/repositories/providers.repository';
import { useAuth } from '@/contexts/auth-context';
import type { BillFormValues } from '@/schemas/bill-form.schema';

export default function NewBillScreen() {
  const { user } = useAuth();
  const { documentId } = useLocalSearchParams<{ documentId?: string }>();
  const { data: categories = [] } = useCategories();
  const { data: attachedDocument } = useDocument(documentId);
  const createBill = useCreateBill();

  async function handleSubmit(values: BillFormValues) {
    try {
      const category = categories.find((c) => c.id === values.categoryId);
      const provider = await findOrCreateProvider(user!.id, values.providerName, category?.id ?? null);

      await createBill.mutateAsync({
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

      router.back();
    } catch (error) {
      Alert.alert('Could not save bill', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <ScreenContainer scroll>
      {attachedDocument ? <AttachedDocumentCard document={attachedDocument} /> : null}
      <BillForm onSubmit={handleSubmit} submitLabel="Add Bill" isSubmitting={createBill.isPending} />
    </ScreenContainer>
  );
}
