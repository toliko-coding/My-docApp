import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import type { ThemePreference } from '@/types/database';

interface AppearanceCardProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}

export function AppearanceCard({ value, onChange }: AppearanceCardProps) {
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <ThemedText themeColor="textSecondary" type="small">
        {t('profile.appearance')}
      </ThemedText>
      <SegmentedControl
        options={[
          { value: 'light', label: t('profile.themeLight') },
          { value: 'dark', label: t('profile.themeDark') },
          { value: 'system', label: t('profile.themeSystem') },
        ]}
        value={value}
        onChange={onChange}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.one },
});
