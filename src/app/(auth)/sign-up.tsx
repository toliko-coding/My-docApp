import { Link } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LogoMark } from '@/components/ui/LogoMark';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/i18n';

// TODO: swap for the policy's permanent hosted URL before submitting to the
// stores — this is a draft Claude Artifact link with placeholder content
// (contact address, effective date) still to be filled in.
const PRIVACY_POLICY_URL = 'https://claude.ai/code/artifact/a72040cc-0d69-4b58-9a16-85b8caee27d1';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { isConfigured, signUpWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
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
    setConfirmError(null);
    if (password !== confirmPassword) {
      setConfirmError(t('auth.passwordMismatch'));
      return;
    }
    setIsSubmitting(true);
    const { error: signUpError } = await signUpWithPassword(email.trim(), password);
    setIsSubmitting(false);
    if (signUpError) setError(signUpError);
  }

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <LogoMark size={36} />
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
        <TextField
          label={t('auth.confirmPassword')}
          secureTextEntry
          autoComplete="password-new"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={confirmError}
        />
        <Button label={t('auth.signUp')} onPress={handleSubmit} loading={isSubmitting} />
      </View>

      <View style={styles.policyRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('auth.agreeToPolicyPrefix')}
        </ThemedText>
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
          <ThemedText type="small" themeColor="primary">
            {' '}
            {t('auth.privacyPolicy')}
          </ThemedText>
        </Pressable>
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
  header: { marginTop: Spacing.five, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { fontSize: 32, lineHeight: 38 },
  form: { gap: Spacing.three },
  policyRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: Spacing.three },
  link: { alignSelf: 'center', marginTop: Spacing.three },
});
