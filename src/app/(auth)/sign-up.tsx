import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/i18n';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { isConfigured, signUpWithPassword } = useAuth();
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
    const { error: signUpError } = await signUpWithPassword(email.trim(), password);
    setIsSubmitting(false);
    if (signUpError) setError(signUpError);
  }

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          {t('auth.signUp')}
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
          autoComplete="password-new"
          value={password}
          onChangeText={setPassword}
          error={error}
        />
        <Button label={t('auth.signUp')} onPress={handleSubmit} loading={isSubmitting} />
      </View>

      <Link href="/(auth)/sign-in" style={styles.link}>
        <ThemedText type="link" themeColor="textSecondary">
          {t('auth.haveAccount')} {t('auth.signIn')}
        </ThemedText>
      </Link>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: Spacing.five },
  title: { fontSize: 32, lineHeight: 38 },
  form: { gap: Spacing.three },
  link: { alignSelf: 'center', marginTop: Spacing.three },
});
