import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import { AuthProvider } from '@/contexts/auth-context';
import { I18nProvider } from '@/i18n';

/**
 * Wraps a component with the same provider stack it gets in the real app
 * (see src/app/_layout.tsx) — needed because useTheme() reads user_settings
 * via React Query + auth context, so anything rendering themed UI
 * (ThemedText, Card, Button, ...) needs these even if the test itself never
 * touches auth or the network. In the Jest process EXPO_PUBLIC_SUPABASE_*
 * env vars are never loaded, so isSupabaseConfigured is false and
 * AuthProvider stays a safe no-op (no session, no network calls) rather
 * than needing to be mocked per test.
 */
function AllProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react-native';
