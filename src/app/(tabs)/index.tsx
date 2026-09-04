import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { CategorySpendingCard } from '@/components/dashboard/CategorySpendingCard';
import { OverdueBanner } from '@/components/dashboard/OverdueBanner';
import { RecurringBillsCard } from '@/components/dashboard/RecurringBillsCard';
import { StatCard, StatCardRow } from '@/components/dashboard/StatCard';
import { UpcomingPaymentsCard } from '@/components/dashboard/UpcomingPaymentsCard';
import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useBills } from '@/hooks/use-bills';
import { useTranslation } from '@/i18n';
import { computeDashboardStats } from '@/utils/dashboard';
import { detectRecurringProviders } from '@/utils/recurring';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const displayName = user?.email?.split('@')[0] ?? '';

  const { data: bills, isLoading, isError, error, refetch } = useBills();
  const stats = useMemo(() => computeDashboardStats(bills ?? []), [bills]);
  const recurringProviders = useMemo(() => detectRecurringProviders(bills ?? []), [bills]);

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.greeting}>
          {t('dashboard.greeting', { name: displayName })}
        </ThemedText>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : isError ? (
        <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />
      ) : !bills || bills.length === 0 ? (
        <EmptyState
          title={t('emptyStates.noBillsTitle')}
          subtitle={t('emptyStates.noBillsSubtitle')}
          actionLabel={t('emptyStates.scanBill')}
          onAction={() => router.push('/(tabs)/scan')}
        />
      ) : (
        <View style={styles.content}>
          {stats.overdueCount > 0 ? (
            <OverdueBanner
              count={stats.overdueCount}
              total={stats.overdueTotal}
              onPress={() => router.push('/(tabs)/bills')}
            />
          ) : null}

          <StatCardRow>
            <StatCard
              label={t('dashboard.outstandingBalance')}
              amount={stats.outstandingTotal}
              subtitle={t('dashboard.billsRemaining', { count: stats.outstandingCount })}
            />
            <StatCard label={t('dashboard.paidThisMonth')} amount={stats.paidThisMonthTotal} />
          </StatCardRow>

          <UpcomingPaymentsCard bills={stats.upcomingBills} onPressBill={(id) => router.push(`/bill/${id}`)} />

          <CategorySpendingCard categories={stats.categorySpending} />

          <RecurringBillsCard providers={recurringProviders} />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: Spacing.two },
  greeting: { fontSize: 26, lineHeight: 32 },
  content: { gap: Spacing.three, marginTop: Spacing.three, paddingBottom: Spacing.six },
  loading: { marginTop: Spacing.six },
});
