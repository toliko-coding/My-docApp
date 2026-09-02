import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { BillListItem } from '@/components/bills/BillListItem';
import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Radii, Spacing } from '@/constants/theme';
import { useBills } from '@/hooks/use-bills';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import type { BillStatus } from '@/types/database';

const STATUS_FILTERS: { value: BillStatus | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'paid', label: 'Paid' },
  { value: 'partially_paid', label: 'Partial' },
];

export default function BillsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [statusFilter, setStatusFilter] = useState<BillStatus | null>(null);
  const [search, setSearch] = useState('');

  const { data: bills, isLoading, isError, error, refetch } = useBills({ status: statusFilter, search });

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
  list: { gap: Spacing.two, paddingBottom: Spacing.six },
  loading: { marginTop: Spacing.six },
});
