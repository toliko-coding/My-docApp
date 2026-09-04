import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { formatAmount } from '@/utils/currency';

interface OverdueBannerProps {
  count: number;
  total: number;
  onPress: () => void;
}

export function OverdueBanner({ count, total, onPress }: OverdueBannerProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card style={[styles.card, { backgroundColor: theme.dangerBg, borderColor: theme.danger }]}>
        <View style={styles.info}>
          <ThemedText type="smallBold" themeColor="danger">
            {t('dashboard.overdueBills', { count })}
          </ThemedText>
          <ThemedText type="small" themeColor="danger">
            {formatAmount(total, 'ILS')}
          </ThemedText>
        </View>
        <ThemedText themeColor="danger">›</ThemedText>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { gap: 2 },
});
