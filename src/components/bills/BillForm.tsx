import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProviderField } from '@/components/bills/ProviderField';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { CategoryPicker } from '@/components/ui/CategoryPicker';
import { DateField } from '@/components/ui/DateField';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/hooks/use-categories';
import { useTranslation, type TranslationKey } from '@/i18n';
import { billFormSchema, emptyBillFormValues, type BillFormValues } from '@/schemas/bill-form.schema';
import { SUPPORTED_CURRENCIES } from '@/utils/currency';
import { todayIso } from '@/utils/date';

interface BillFormProps {
  initialValues?: Partial<BillFormValues>;
  onSubmit: (values: BillFormValues) => Promise<void> | void;
  submitLabel: string;
  isSubmitting?: boolean;
}

// billFormSchema's Zod messages are internal identifiers, not display text —
// keeping the schema itself locale-agnostic means it can be unit-tested
// without an I18nProvider, and translation only happens here at the one
// place these errors are actually shown to a user.
const FIELD_ERROR_KEYS: Record<string, TranslationKey> = {
  'Provider is required': 'billForm.providerRequired',
  'Category is required': 'billForm.categoryRequired',
  'Amount is required': 'billForm.amountRequired',
  'Enter a valid amount': 'billForm.amountInvalid',
  'Billing period needs both a start and an end date': 'billForm.billingPeriodIncomplete',
  'Paid date is required when status is Paid': 'billForm.paidDateRequired',
};

export function BillForm({ initialValues, onSubmit, submitLabel, isSubmitting }: BillFormProps) {
  const { t } = useTranslation();
  const { data: categories = [], isError: categoriesError, refetch: refetchCategories } = useCategories();
  const [values, setValues] = useState<BillFormValues>({ ...emptyBillFormValues, ...initialValues });
  const [errors, setErrors] = useState<Partial<Record<keyof BillFormValues, string>>>({});

  function set<K extends keyof BillFormValues>(key: K, value: BillFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const result = billFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof BillFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof BillFormValues;
        const translationKey = FIELD_ERROR_KEYS[issue.message];
        if (!fieldErrors[key]) fieldErrors[key] = translationKey ? t(translationKey) : issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await onSubmit(result.data);
  }

  return (
    <View style={styles.form}>
      <ProviderField
        label={t('billFields.provider')}
        value={values.providerName}
        onChangeText={(text) => set('providerName', text)}
        onSelectProvider={(provider) => {
          set('providerName', provider.name);
          if (!values.categoryId && provider.default_category_id) {
            set('categoryId', provider.default_category_id);
          }
        }}
        error={errors.providerName}
      />

      <View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          {t('billFields.category')}
        </ThemedText>
        {categoriesError ? (
          <Pressable accessibilityRole="button" onPress={() => refetchCategories()}>
            <ThemedText type="small" themeColor="danger">
              {t('billFields.categoryLoadError')}
            </ThemedText>
          </Pressable>
        ) : (
          <CategoryPicker categories={categories} value={values.categoryId} onChange={(id) => set('categoryId', id)} />
        )}
        {errors.categoryId ? (
          <ThemedText type="small" themeColor="danger">
            {errors.categoryId}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.row}>
        <View style={styles.amountField}>
          <TextField
            label={t('billFields.amount')}
            value={values.amount}
            onChangeText={(text) => set('amount', text)}
            keyboardType="decimal-pad"
            error={errors.amount}
          />
        </View>
        <View style={styles.currencyField}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
            {t('billFields.currency')}
          </ThemedText>
          <SegmentedControl
            options={SUPPORTED_CURRENCIES.map((code) => ({ value: code, label: code }))}
            value={values.currency}
            onChange={(code) => set('currency', code)}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.flexItem}>
          <DateField
            label={t('billFields.issueDate')}
            value={values.issueDate ?? ''}
            onChange={(v) => set('issueDate', v)}
            onClear={() => set('issueDate', '')}
          />
        </View>
        <View style={styles.flexItem}>
          <DateField
            label={t('billFields.dueDate')}
            value={values.dueDate ?? ''}
            onChange={(v) => set('dueDate', v)}
            onClear={() => set('dueDate', '')}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.flexItem}>
          <DateField
            label={t('billFields.billingPeriodStart')}
            value={values.billingPeriodStart ?? ''}
            onChange={(v) => set('billingPeriodStart', v)}
            onClear={() => set('billingPeriodStart', '')}
            error={errors.billingPeriodEnd}
          />
        </View>
        <View style={styles.flexItem}>
          <DateField
            label={t('billFields.billingPeriodEnd')}
            value={values.billingPeriodEnd ?? ''}
            onChange={(v) => set('billingPeriodEnd', v)}
            onClear={() => set('billingPeriodEnd', '')}
          />
        </View>
      </View>

      <View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          {t('billFields.status')}
        </ThemedText>
        <SegmentedControl
          options={[
            { value: 'pending', label: t('status.pending') },
            { value: 'paid', label: t('status.paid') },
            { value: 'partially_paid', label: t('status.partially_paid') },
            { value: 'unknown', label: t('status.unknown') },
          ]}
          value={values.status}
          onChange={(status) => {
            setValues((prev) => ({
              ...prev,
              status,
              // The date field shows today as a default the instant Paid is
              // selected — that default must land in real form state too,
              // or a submit without ever touching the field fails validation
              // even though the field visibly already showed a date.
              paidDate: status === 'paid' && !prev.paidDate ? todayIso() : prev.paidDate,
            }));
          }}
        />
      </View>

      {values.status === 'paid' ? (
        <DateField
          label={t('billFields.paidDate')}
          value={values.paidDate ?? ''}
          onChange={(v) => set('paidDate', v)}
          error={errors.paidDate}
        />
      ) : null}

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        {t('billForm.additionalDetails')}
      </ThemedText>

      <View style={styles.row}>
        <TextField
          label={t('billFields.invoiceNumber')}
          value={values.invoiceNumber}
          onChangeText={(text) => set('invoiceNumber', text)}
        />
        <TextField
          label={t('billFields.customerNumber')}
          value={values.customerNumber}
          onChangeText={(text) => set('customerNumber', text)}
        />
      </View>

      <View style={styles.row}>
        <TextField
          label={t('billFields.paymentMethod')}
          value={values.paymentMethod}
          onChangeText={(text) => set('paymentMethod', text)}
        />
        <TextField
          label={t('billFields.referenceNumber')}
          value={values.referenceNumber}
          onChangeText={(text) => set('referenceNumber', text)}
        />
      </View>

      <TextField
        label={t('billFields.notes')}
        value={values.notes}
        onChangeText={(text) => set('notes', text)}
        multiline
        numberOfLines={3}
      />

      <Button label={submitLabel} onPress={handleSubmit} loading={isSubmitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three, paddingBottom: Spacing.six },
  row: { flexDirection: 'row', gap: Spacing.two },
  amountField: { flex: 1 },
  currencyField: { flex: 1, gap: 6 },
  flexItem: { flex: 1 },
  label: { marginBottom: 6 },
  sectionTitle: { marginTop: Spacing.two },
});
