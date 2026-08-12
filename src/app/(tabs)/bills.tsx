import { router } from 'expo-router';

import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useTranslation } from '@/i18n';

// Bill list, filters, and search land in Phase 2 once the bills repository
// is wired to Supabase. For now there is truthfully no data to show.
export default function BillsScreen() {
  const { t } = useTranslation();

  return (
    <ScreenContainer>
      <EmptyState
        title={t('emptyStates.noBillsTitle')}
        subtitle={t('emptyStates.noBillsSubtitle')}
        actionLabel={t('emptyStates.scanBill')}
        onAction={() => router.push('/(tabs)/scan')}
      />
    </ScreenContainer>
  );
}
