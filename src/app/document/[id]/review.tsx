import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AttachedDocumentCard } from '@/components/documents/AttachedDocumentCard';
import { ProviderField } from '@/components/bills/ProviderField';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { CategoryPicker } from '@/components/ui/CategoryPicker';
import { DateField } from '@/components/ui/DateField';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/hooks/use-categories';
import { useDocument } from '@/hooks/use-documents';
import { useConfirmExtraction, useDocumentExtraction, useProcessDocument } from '@/hooks/use-document-extraction';
import { CONFIDENCE_THRESHOLD } from '@/schemas/document-extraction.schema';
import { SUPPORTED_CURRENCIES } from '@/utils/currency';
import type { DocumentExtraction } from '@/types/database';

interface ReviewValues {
  providerName: string;
  providerId: string | null;
  categoryId: string;
  amount: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}

function valuesFromExtraction(extraction: DocumentExtraction): ReviewValues {
  return {
    providerName: extraction.provider_name_raw ?? '',
    providerId: extraction.provider_id,
    categoryId: extraction.category_id ?? '',
    amount: extraction.amount != null ? String(extraction.amount) : '',
    currency: extraction.currency ?? 'ILS',
    issueDate: extraction.issue_date ?? '',
    dueDate: extraction.due_date ?? '',
    billingPeriodStart: extraction.billing_period_start ?? '',
    billingPeriodEnd: extraction.billing_period_end ?? '',
  };
}

/** True when the field has a value but the AI wasn't confident about it. */
function isLowConfidence(hasValue: boolean, confidence: number | undefined): boolean {
  return hasValue && (confidence ?? 0) < CONFIDENCE_THRESHOLD;
}

function ConfidenceHint() {
  return (
    <ThemedText type="small" themeColor="warning">
      AI wasn&apos;t sure about this — please check it.
    </ThemedText>
  );
}

export default function DocumentReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: document } = useDocument(id);
  const { data: categories = [] } = useCategories();
  const { data: extraction, isLoading: isLoadingExtraction } = useDocumentExtraction(id);
  const processDocument = useProcessDocument();
  const confirmExtraction = useConfirmExtraction();
  const triggeredRef = useRef(false);

  const [values, setValues] = useState<ReviewValues | null>(null);
  // Tracks which extraction `values` was last seeded from, so a freshly-loaded
  // extraction resets the editable form exactly once — set during render
  // (React's documented pattern for "adjusting state when a value changes"),
  // not in an effect, so it doesn't cause an extra committed render.
  const [seededExtractionId, setSeededExtractionId] = useState<string | null>(null);

  useEffect(() => {
    if (!id || isLoadingExtraction || triggeredRef.current || extraction) return;
    triggeredRef.current = true;
    processDocument.mutate(id);
  }, [id, isLoadingExtraction, extraction, processDocument]);

  if (extraction && extraction.id !== seededExtractionId) {
    setSeededExtractionId(extraction.id);
    setValues(valuesFromExtraction(extraction));
  }

  function handleRetry() {
    if (!id) return;
    processDocument.mutate(id);
  }

  function handleSkipToManual() {
    router.push({ pathname: '/bill/new', params: { documentId: id } });
  }

  async function handleConfirm() {
    if (!extraction || !values) return;
    await confirmExtraction.mutateAsync({
      id: extraction.id,
      patch: {
        provider_name_raw: values.providerName.trim() || null,
        provider_id: values.providerId,
        category_id: values.categoryId || null,
        amount: values.amount.trim() ? Number(values.amount) : null,
        currency: values.currency,
        issue_date: values.issueDate || null,
        due_date: values.dueDate || null,
        billing_period_start: values.billingPeriodStart || null,
        billing_period_end: values.billingPeriodEnd || null,
      },
    });
    router.push({ pathname: '/bill/new', params: { documentId: id } });
  }

  if (processDocument.isError) {
    return (
      <ScreenContainer>
        <ErrorState
          message={processDocument.error instanceof Error ? processDocument.error.message : 'Could not read this document.'}
          onRetry={handleRetry}
        />
        <Button label="Enter details manually instead" variant="ghost" onPress={handleSkipToManual} />
      </ScreenContainer>
    );
  }

  if (!extraction || !values) {
    return (
      <ScreenContainer>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" />
          <ThemedText type="subtitle" style={styles.loadingTitle}>
            Reading your document…
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.loadingSubtitle}>
            AI is picking out the provider, amount, and dates. This takes a few seconds.
          </ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  const confidence = extraction.confidence;

  return (
    <ScreenContainer scroll>
      <ThemedText type="title" style={styles.title}>
        Review the details
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        Here&apos;s what the AI found. Fix anything that looks wrong before saving.
      </ThemedText>

      {document ? <AttachedDocumentCard document={document} /> : null}

      <View>
        <ProviderField
          label="Provider"
          value={values.providerName}
          onChangeText={(text) => setValues((v) => (v ? { ...v, providerName: text, providerId: null } : v))}
          onSelectProvider={(provider) =>
            setValues((v) => (v ? { ...v, providerName: provider.name, providerId: provider.id } : v))
          }
        />
        {isLowConfidence(Boolean(values.providerName), confidence.provider) ? <ConfidenceHint /> : null}
      </View>

      <View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          Category
        </ThemedText>
        <CategoryPicker
          categories={categories}
          value={values.categoryId}
          onChange={(categoryId) => setValues((v) => (v ? { ...v, categoryId } : v))}
        />
        {isLowConfidence(Boolean(values.categoryId), confidence.category) ? <ConfidenceHint /> : null}
      </View>

      <View style={styles.row}>
        <View style={styles.amountField}>
          <TextField
            label="Amount"
            value={values.amount}
            onChangeText={(text) => setValues((v) => (v ? { ...v, amount: text } : v))}
            keyboardType="decimal-pad"
          />
          {isLowConfidence(Boolean(values.amount), confidence.amount) ? <ConfidenceHint /> : null}
        </View>
        <View style={styles.currencyField}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
            Currency
          </ThemedText>
          <SegmentedControl
            options={SUPPORTED_CURRENCIES.map((code) => ({ value: code, label: code }))}
            value={values.currency}
            onChange={(code) => setValues((v) => (v ? { ...v, currency: code } : v))}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.flexItem}>
          <DateField
            label="Issue date"
            value={values.issueDate}
            onChange={(v) => setValues((prev) => (prev ? { ...prev, issueDate: v } : prev))}
            onClear={() => setValues((prev) => (prev ? { ...prev, issueDate: '' } : prev))}
          />
          {isLowConfidence(Boolean(values.issueDate), confidence.issueDate) ? <ConfidenceHint /> : null}
        </View>
        <View style={styles.flexItem}>
          <DateField
            label="Due date"
            value={values.dueDate}
            onChange={(v) => setValues((prev) => (prev ? { ...prev, dueDate: v } : prev))}
            onClear={() => setValues((prev) => (prev ? { ...prev, dueDate: '' } : prev))}
          />
          {isLowConfidence(Boolean(values.dueDate), confidence.dueDate) ? <ConfidenceHint /> : null}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.flexItem}>
          <DateField
            label="Billing period start"
            value={values.billingPeriodStart}
            onChange={(v) => setValues((prev) => (prev ? { ...prev, billingPeriodStart: v } : prev))}
            onClear={() => setValues((prev) => (prev ? { ...prev, billingPeriodStart: '' } : prev))}
          />
        </View>
        <View style={styles.flexItem}>
          <DateField
            label="Billing period end"
            value={values.billingPeriodEnd}
            onChange={(v) => setValues((prev) => (prev ? { ...prev, billingPeriodEnd: v } : prev))}
            onClear={() => setValues((prev) => (prev ? { ...prev, billingPeriodEnd: '' } : prev))}
          />
        </View>
      </View>
      {isLowConfidence(Boolean(values.billingPeriodStart && values.billingPeriodEnd), confidence.billingPeriod) ? (
        <ConfidenceHint />
      ) : null}

      <View style={styles.actions}>
        <Button label="Use these details" onPress={handleConfirm} loading={confirmExtraction.isPending} />
        <Button label="Enter manually instead" variant="ghost" onPress={handleSkipToManual} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, lineHeight: 32, marginTop: Spacing.two },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingTop: Spacing.six },
  loadingTitle: { marginTop: Spacing.two },
  loadingSubtitle: { textAlign: 'center', maxWidth: 280 },
  row: { flexDirection: 'row', gap: Spacing.two },
  amountField: { flex: 1 },
  currencyField: { flex: 1, gap: 6 },
  flexItem: { flex: 1 },
  label: { marginBottom: 6 },
  actions: { gap: Spacing.two, marginTop: Spacing.two, marginBottom: Spacing.four },
});
