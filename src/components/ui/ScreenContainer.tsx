import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View, type ViewProps } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ScreenContainerProps extends ViewProps {
  scroll?: boolean;
}

export function ScreenContainer({ scroll, style, children, ...rest }: ScreenContainerProps) {
  const theme = useTheme();
  const Wrapper = scroll ? ScrollView : View;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <Wrapper
        style={scroll ? undefined : [styles.content, style]}
        contentContainerStyle={scroll ? [styles.content, style] : undefined}
        {...rest}>
        {children}
      </Wrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, padding: Spacing.three, gap: Spacing.four },
});
