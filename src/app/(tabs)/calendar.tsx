import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, SectionList, StyleSheet } from 'react-native';

import { BillListItem } from '@/components/bills/BillListItem';
import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Spacing } from '@/constants/theme';
import { useBills } from '@/hooks/use-bills';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { groupBillsByDueMonth } from '@/utils/calendar';

export default function CalendarScreen() {
  const { t, locale } = useTranslation();
  const theme = useTheme();
  const { data: bills, isLoading, isError, error, refetch } = useBills();
  const sections = useMemo(() => groupBillsByDueMonth(bills ?? [], locale), [bills, locale]);

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        {t('tabs.calendar')}
      </ThemedText>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : isError ? (
        <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />
      ) : sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <ThemedText
              type="smallBold"
              themeColor="textSecondary"
              style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
              {section.title}
            </ThemedText>
          )}
          renderItem={({ item }) => <BillListItem bill={item} onPress={() => router.push(`/bill/${item.id}`)} />}
        />
      ) : (
        <EmptyState icon="🗓️" title={t('calendar.emptyTitle')} subtitle={t('calendar.emptySubtitle')} />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, lineHeight: 32 },
  loading: { marginTop: Spacing.six },
  list: { gap: Spacing.two, paddingBottom: Spacing.six },
  sectionHeader: { paddingVertical: Spacing.two },
});
