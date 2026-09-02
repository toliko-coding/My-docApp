import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {label ? (
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      ) : null}
      <TextInput
        placeholderTextColor={theme.textMuted}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: error ? theme.danger : theme.border,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
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
  },
});
