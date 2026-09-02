import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import type { Category } from '@/types/database';
import { getCategoryName } from '@/utils/category';

interface CategoryPickerProps {
  categories: Category[];
  value: string | null;
  onChange: (categoryId: string) => void;
}

export function CategoryPicker({ categories, value, onChange }: CategoryPickerProps) {
  const theme = useTheme();
  const { locale } = useTranslation();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {categories.map((category) => {
        const selected = category.id === value;
        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(category.id)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? theme.primary : theme.backgroundElement,
                borderColor: selected ? theme.primary : theme.border,
              },
            ]}>
            <CategoryIcon icon={category.icon} size={16} color={selected ? theme.primaryText : theme.text} />
            <ThemedText type="small" style={{ color: selected ? theme.primaryText : theme.text }}>
              {getCategoryName(category, locale)}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.two, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
});
