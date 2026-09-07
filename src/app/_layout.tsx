import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import type { ReactNode } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/contexts/auth-context';
import { useColorSchemePreference } from '@/hooks/use-color-scheme-preference';
import { I18nProvider } from '@/i18n';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppNavigationTheme>
            <AnimatedSplashOverlay />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="bill" />
              <Stack.Screen name="document" />
            </Stack>
          </AppNavigationTheme>
        </AuthProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}

/**
 * Separate from the app's own Colors/useTheme system — this drives React
 * Navigation's native chrome (screen transitions, modal backgrounds). Reads
 * the same resolved light/dark preference so the two never disagree.
 */
function AppNavigationTheme({ children }: { children: ReactNode }) {
  const scheme = useColorSchemePreference();
  return <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>{children}</ThemeProvider>;
}
