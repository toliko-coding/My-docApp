import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function BillLayout() {
  const theme = useTheme();
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
      <Stack.Screen name="new" options={{ title: 'Add Bill' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Bill Details' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit Bill' }} />
    </Stack>
  );
}
