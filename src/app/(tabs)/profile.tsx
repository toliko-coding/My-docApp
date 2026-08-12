import { Alert, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { SUPPORTED_LOCALES, useTranslation, type Locale } from '@/i18n';

const LOCALE_LABELS: Record<Locale, string> = { he: 'עברית', en: 'English' };

export default function ProfileScreen() {
  const { t, locale, setLocale } = useTranslation();
  const { user, signOut } = useAuth();

  function handleLocaleChange(next: Locale) {
    if (next === locale) return;
    setLocale(next);
    Alert.alert(
      LOCALE_LABELS[next],
      'Restart the app to fully apply the new text direction (RTL/LTR).',
    );
  }

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        {t('tabs.profile')}
      </ThemedText>

      <Card style={styles.card}>
        <ThemedText themeColor="textSecondary" type="small">
          {t('auth.email')}
        </ThemedText>
        <ThemedText>{user?.email ?? '—'}</ThemedText>
      </Card>

      <Card style={styles.card}>
        <ThemedText themeColor="textSecondary" type="small">
          Language
        </ThemedText>
        <View style={styles.localeRow}>
          {SUPPORTED_LOCALES.map((code) => (
            <Button
              key={code}
              label={LOCALE_LABELS[code]}
              variant={code === locale ? 'primary' : 'secondary'}
              onPress={() => handleLocaleChange(code)}
            />
          ))}
        </View>
      </Card>

      <Button label={t('auth.signOut')} variant="ghost" onPress={signOut} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, lineHeight: 32, marginTop: Spacing.two },
  card: { gap: Spacing.one },
  localeRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
});
