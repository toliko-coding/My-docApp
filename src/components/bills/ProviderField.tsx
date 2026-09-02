import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { TextField } from '@/components/ui/TextField';
import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useProviderSearch } from '@/hooks/use-providers';
import type { Provider } from '@/types/database';

interface ProviderFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectProvider: (provider: Provider) => void;
  error?: string | null;
}

export function ProviderField({ label, value, onChangeText, onSelectProvider, error }: ProviderFieldProps) {
  const theme = useTheme();
  const { data: suggestions } = useProviderSearch(value);
  const showSuggestions = Boolean(suggestions?.length) && value.trim().length > 0;

  return (
    <View>
      <TextField label={label} value={value} onChangeText={onChangeText} error={error} autoCorrect={false} />
      {showSuggestions ? (
        <View style={[styles.suggestions, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {suggestions!.map((provider) => (
            <Pressable
              key={provider.id}
              accessibilityRole="button"
              onPress={() => onSelectProvider(provider)}
              hitSlop={8}
              style={styles.suggestionRow}>
              <ThemedText>{provider.name}</ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  suggestions: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
});
