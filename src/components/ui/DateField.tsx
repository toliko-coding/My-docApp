import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, toIsoDate } from '@/utils/date';

interface DateFieldProps {
  label: string;
  value: string; // ISO 'YYYY-MM-DD' or ''
  onChange: (value: string) => void;
  error?: string | null;
  onClear?: () => void;
}

export function DateField({ label, value, onChange, error, onClear }: DateFieldProps) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={() => setIsOpen(true)}
        style={[
          styles.input,
          { backgroundColor: theme.backgroundElement, borderColor: error ? theme.danger : theme.border },
        ]}>
        <ThemedText themeColor={value ? 'text' : 'textMuted'}>
          {value ? formatDate(value) : 'Select date'}
        </ThemedText>
        {value && onClear ? (
          <Pressable accessibilityRole="button" onPress={onClear} hitSlop={8}>
            <ThemedText themeColor="textMuted">✕</ThemedText>
          </Pressable>
        ) : null}
      </Pressable>
      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
      {isOpen ? (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onValueChange={(_event, date) => {
            setIsOpen(Platform.OS === 'ios');
            onChange(toIsoDate(date));
          }}
          onDismiss={() => setIsOpen(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  input: {
    minHeight: 48,
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: Typography.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
