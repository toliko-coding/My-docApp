import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: theme.card }]}>
            <ThemedText type="small" style={selected ? styles.selectedLabel : undefined}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Radii.md,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radii.sm,
  },
  selectedLabel: { fontWeight: '700' },
});
