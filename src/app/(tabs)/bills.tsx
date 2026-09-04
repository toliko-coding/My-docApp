import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BillListItem } from '@/components/bills/BillListItem';
import { ThemedText } from '@/components/themed-text';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Radii, Spacing } from '@/constants/theme';
import { useBills } from '@/hooks/use-bills';
import { useCategories } from '@/hooks/use-categories';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { getCategoryName } from '@/utils/category';
import type { BillStatus } from '@/types/database';

const STATUS_FILTERS: { value: BillStatus | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'paid', label: 'Paid' },
  { value: 'partially_paid', label: 'Partial' },
];

export default function BillsScreen() {
  const { t, locale } = useTranslation();
  const theme = useTheme();
  const [statusFilter, setStatusFilter] = useState<BillStatus | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: categories = [] } = useCategories();
  const { data: bills, isLoading, isError, error, refetch } = useBills({
    status: statusFilter,
    categoryId: categoryFilter,
    search,
  });

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          {t('tabs.bills')}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/bill/new')}
          style={[styles.addButton, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={22} color={theme.primaryText} />
        </Pressable>
      </View>

      <TextField placeholder="Search bills…" value={search} onChangeText={setSearch} style={styles.search} />

      <View style={styles.filters}>
        {STATUS_FILTERS.map((filter) => {
          const selected = filter.value === statusFilter;
          return (
            <Pressable
              key={filter.label}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setStatusFilter(filter.value)}
              style={[
                styles.filterChip,
                { backgroundColor: selected ? theme.primary : theme.backgroundElement, borderColor: theme.border },
              ]}>
              <ThemedText type="small" style={{ color: selected ? theme.primaryText : theme.text }}>
                {filter.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFiltersScroll}
        contentContainerStyle={styles.categoryFilters}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: categoryFilter === null }}
          onPress={() => setCategoryFilter(null)}
          style={[
            styles.filterChip,
            styles.categoryChip,
            { backgroundColor: categoryFilter === null ? theme.primary : theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="small" style={{ color: categoryFilter === null ? theme.primaryText : theme.text }}>
            All categories
          </ThemedText>
        </Pressable>
        {categories.map((category) => {
          const selected = category.id === categoryFilter;
          return (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setCategoryFilter(category.id)}
              style={[
                styles.filterChip,
                styles.categoryChip,
                { backgroundColor: selected ? theme.primary : theme.backgroundElement, borderColor: theme.border },
              ]}>
              <CategoryIcon icon={category.icon} size={14} color={selected ? theme.primaryText : theme.text} />
              <ThemedText type="small" style={{ color: selected ? theme.primaryText : theme.text }}>
                {getCategoryName(category, locale)}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : isError ? (
        <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />
      ) : bills && bills.length > 0 ? (
        <FlatList
          data={bills}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <BillListItem bill={item} onPress={() => router.push(`/bill/${item.id}`)} />}
        />
      ) : (
        <EmptyState
          title={t('emptyStates.noBillsTitle')}
          subtitle={t('emptyStates.noBillsSubtitle')}
          actionLabel="Add Bill"
          onAction={() => router.push('/bill/new')}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 26, lineHeight: 32 },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: { marginTop: Spacing.one },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  categoryFiltersScroll: { flexGrow: 0 },
  categoryFilters: { gap: Spacing.one, paddingVertical: 2, alignItems: 'center' },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  list: { gap: Spacing.two, paddingBottom: Spacing.six },
  loading: { marginTop: Spacing.six },
});
