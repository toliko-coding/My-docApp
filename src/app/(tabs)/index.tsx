import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/i18n';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const displayName = user?.email?.split('@')[0] ?? '';

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.greeting}>
          {t('dashboard.greeting', { name: displayName })}
        </ThemedText>
      </View>

      {/* Outstanding balance, upcoming payments, and spending charts are wired
          to real data starting Phase 2 (bills) and Phase 5 (dashboard). Until
          bills exist, this screen must show a true empty state, not sample
          numbers. */}
      <EmptyState
        title={t('emptyStates.noBillsTitle')}
        subtitle={t('emptyStates.noBillsSubtitle')}
        actionLabel={t('emptyStates.scanBill')}
        onAction={() => router.push('/(tabs)/scan')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: Spacing.two },
  greeting: { fontSize: 26, lineHeight: 32 },
});
