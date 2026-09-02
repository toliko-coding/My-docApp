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
import { billFormSchema, emptyBillFormValues, type BillFormValues } from '@/schemas/bill-form.schema';
import { SUPPORTED_CURRENCIES } from '@/utils/currency';
import { todayIso } from '@/utils/date';

interface BillFormProps {
  initialValues?: Partial<BillFormValues>;
  onSubmit: (values: BillFormValues) => Promise<void> | void;
  submitLabel: string;
  isSubmitting?: boolean;
}

export function BillForm({ initialValues, onSubmit, submitLabel, isSubmitting }: BillFormProps) {
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
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
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
        label="Provider"
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
          Category
        </ThemedText>
        {categoriesError ? (
          <Pressable accessibilityRole="button" onPress={() => refetchCategories()}>
            <ThemedText type="small" themeColor="danger">
              Couldn&rsquo;t load categories — tap to retry
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
            label="Amount"
            value={values.amount}
            onChangeText={(text) => set('amount', text)}
            keyboardType="decimal-pad"
            error={errors.amount}
          />
        </View>
        <View style={styles.currencyField}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
            Currency
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
          <DateField label="Issue date" value={values.issueDate ?? ''} onChange={(v) => set('issueDate', v)} onClear={() => set('issueDate', '')} />
        </View>
        <View style={styles.flexItem}>
          <DateField label="Due date" value={values.dueDate ?? ''} onChange={(v) => set('dueDate', v)} onClear={() => set('dueDate', '')} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.flexItem}>
          <DateField
            label="Billing period start"
            value={values.billingPeriodStart ?? ''}
            onChange={(v) => set('billingPeriodStart', v)}
            onClear={() => set('billingPeriodStart', '')}
            error={errors.billingPeriodEnd}
          />
        </View>
        <View style={styles.flexItem}>
          <DateField
            label="Billing period end"
            value={values.billingPeriodEnd ?? ''}
            onChange={(v) => set('billingPeriodEnd', v)}
            onClear={() => set('billingPeriodEnd', '')}
          />
        </View>
      </View>

      <View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          Status
        </ThemedText>
        <SegmentedControl
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'paid', label: 'Paid' },
            { value: 'partially_paid', label: 'Partial' },
            { value: 'unknown', label: 'Unknown' },
          ]}
          value={values.status}
          onChange={(status) => set('status', status)}
        />
      </View>

      {values.status === 'paid' ? (
        <DateField
          label="Paid date"
          value={values.paidDate || todayIso()}
          onChange={(v) => set('paidDate', v)}
          error={errors.paidDate}
        />
      ) : null}

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Additional details
      </ThemedText>

      <View style={styles.row}>
        <TextField
          label="Invoice number"
          value={values.invoiceNumber}
          onChangeText={(text) => set('invoiceNumber', text)}
        />
        <TextField
          label="Customer number"
          value={values.customerNumber}
          onChangeText={(text) => set('customerNumber', text)}
        />
      </View>

      <View style={styles.row}>
        <TextField
          label="Payment method"
          value={values.paymentMethod}
          onChangeText={(text) => set('paymentMethod', text)}
        />
        <TextField
          label="Reference number"
          value={values.referenceNumber}
          onChangeText={(text) => set('referenceNumber', text)}
        />
      </View>

      <TextField
        label="Notes"
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
