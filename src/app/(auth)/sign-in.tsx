import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/i18n';

export default function SignInScreen() {
  const { t } = useTranslation();
  const { isConfigured, signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isConfigured) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="🔌"
          title={t('emptyStates.notConfiguredTitle')}
          subtitle={t('emptyStates.notConfiguredSubtitle')}
        />
      </ScreenContainer>
    );
  }

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    const { error: signInError } = await signInWithPassword(email.trim(), password);
    setIsSubmitting(false);
    if (signInError) setError(t('auth.signInError'));
  }

  function socialSignInComingSoon(providerName: string) {
    Alert.alert(providerName, 'OAuth setup for this provider is not connected yet.');
  }

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          {t('auth.signIn')}
        </ThemedText>
      </View>

      <View style={styles.form}>
        <TextField
          label={t('auth.email')}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label={t('auth.password')}
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          error={error}
        />
        <Button label={t('auth.signIn')} onPress={handleSubmit} loading={isSubmitting} />
      </View>

      <View style={styles.socialSection}>
        <Button
          label={t('auth.continueWithGoogle')}
          variant="secondary"
          onPress={() => socialSignInComingSoon('Google')}
        />
        <Button
          label={t('auth.continueWithApple')}
          variant="secondary"
          onPress={() => socialSignInComingSoon('Apple')}
        />
      </View>

      <Link href="/(auth)/sign-up" style={styles.link}>
        <ThemedText type="link" themeColor="textSecondary">
          {t('auth.noAccount')} {t('auth.signUp')}
        </ThemedText>
      </Link>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: Spacing.five },
  title: { fontSize: 32, lineHeight: 38 },
  form: { gap: Spacing.three },
  socialSection: { gap: Spacing.two, marginTop: Spacing.two },
  link: { alignSelf: 'center', marginTop: Spacing.three },
});
