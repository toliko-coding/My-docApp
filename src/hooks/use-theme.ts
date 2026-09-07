import { Colors } from '@/constants/theme';
import { useColorSchemePreference } from '@/hooks/use-color-scheme-preference';

export function useTheme() {
  return Colors[useColorSchemePreference()];
}
