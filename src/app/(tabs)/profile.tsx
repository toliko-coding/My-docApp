import Constants from 'expo-constants';
import { ActivityIndicator, Alert, StyleSheet } from 'react-native';

import { AppearanceCard } from '@/components/profile/AppearanceCard';
import { NotificationSettingsCard } from '@/components/profile/NotificationSettingsCard';
import { PreferencesCard } from '@/components/profile/PreferencesCard';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { useUpdateUserSettings, useUserSettings } from '@/hooks/use-user-settings';
import { useTranslation, type Locale } from '@/i18n';
import type { ThemePreference } from '@/types/database';
import type { CurrencyCode } from '@/utils/currency';

const LOCALE_LABELS: Record<Locale, string> = { he: 'עברית', en: 'English' };

export default function ProfileScreen() {
  const { t, locale, setLocale } = useTranslation();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: isLoadingProfile, isError, error, refetch } = useProfile();
  const { data: settings } = useUserSettings();
  const updateProfile = useUpdateProfile();
  const updateSettings = useUpdateUserSettings();

  function handleLocaleChange(next: Locale) {
    if (next === locale) return;
    setLocale(next);
    Alert.alert(LOCALE_LABELS[next], t('profile.localeRestartMessage'));
  }

  return (
    <ScreenContainer scroll>
      <ThemedText type="title" style={styles.title}>
        {t('tabs.profile')}
      </ThemedText>

      {isLoadingProfile || !user ? (
        <ActivityIndicator style={styles.loading} />
      ) : isError ? (
        <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />
      ) : profile ? (
        <>
          <ProfileHeader
            email={user.email ?? ''}
            fullName={profile.full_name}
            isSaving={updateProfile.isPending}
            onSaveName={(name) => updateProfile.mutate({ full_name: name || null })}
          />

          <PreferencesCard
            locale={locale}
            onChangeLocale={handleLocaleChange}
            currency={profile.currency as CurrencyCode}
            onChangeCurrency={(currency) => updateProfile.mutate({ currency })}
          />

          <AppearanceCard
            value={settings?.theme ?? 'system'}
            onChange={(theme: ThemePreference) => updateSettings.mutate({ theme })}
          />

          <NotificationSettingsCard />

          <Button label={t('auth.signOut')} variant="ghost" onPress={signOut} />

          <ThemedText type="small" themeColor="textMuted" style={styles.about}>
            {t('profile.aboutVersion', { version: Constants.expoConfig?.version ?? '1.0.0' })}
          </ThemedText>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, lineHeight: 32, marginTop: Spacing.two },
  loading: { marginTop: Spacing.six },
  about: { textAlign: 'center', marginTop: Spacing.two },
});
