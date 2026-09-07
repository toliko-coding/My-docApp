import { useUserSettings } from '@/hooks/use-user-settings';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * The resolved light/dark scheme: the user's explicit Light/Dark choice
 * (`user_settings.theme`) if they made one, otherwise whatever the OS
 * reports. Falls back to the OS scheme (or light, if that's unavailable
 * too) before settings have loaded or when signed out — never blocks
 * rendering on this.
 */
export function useColorSchemePreference(): 'light' | 'dark' {
  const osScheme = useColorScheme();
  const { data: settings } = useUserSettings();
  const preference = settings?.theme ?? 'system';

  if (preference === 'system') return osScheme === 'dark' ? 'dark' : 'light';
  return preference;
}
