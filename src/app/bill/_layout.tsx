import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';

export default function BillLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { session, isLoading, isConfigured } = useAuth();

  if (!isLoading && isConfigured && !session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="new" options={{ title: t('billForm.addBillTitle') }} />
      <Stack.Screen name="[id]/index" options={{ title: t('billDetail.title') }} />
      <Stack.Screen name="[id]/edit" options={{ title: t('billForm.editBillTitle') }} />
    </Stack>
  );
}
