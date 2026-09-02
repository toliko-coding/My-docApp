import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Shown whenever a query actually failed — never silently falls through to
 * an EmptyState, which would misrepresent "we couldn't load your data" as
 * "you have no data".
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ThemedText style={styles.icon}>⚠️</ThemedText>
      <ThemedText type="subtitle" style={styles.title}>
        {t('common.error')}
      </ThemedText>
      {message ? (
        <ThemedText themeColor="textSecondary" style={styles.message}>
          {message}
        </ThemedText>
      ) : null}
      {onRetry ? (
        <View style={styles.action}>
          <Button label={t('common.retry')} onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.six, gap: Spacing.two },
  icon: { fontSize: 40 },
  title: { fontSize: 20, textAlign: 'center' },
  message: { textAlign: 'center', maxWidth: 280 },
  action: { marginTop: Spacing.three, alignSelf: 'stretch' },
});
