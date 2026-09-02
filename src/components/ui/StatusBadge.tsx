import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, StatusColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import type { BillStatus } from '@/types/database';

export function StatusBadge({ status }: { status: BillStatus }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colors = StatusColors[status];

  return (
    <View style={[styles.badge, { backgroundColor: theme[colors.bg] }]}>
      <ThemedText type="small" style={{ color: theme[colors.fg] }}>
        {t(`status.${status}`)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    alignSelf: 'flex-start',
  },
});
