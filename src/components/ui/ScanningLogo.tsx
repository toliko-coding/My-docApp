import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { LogoMark } from '@/components/ui/LogoMark';
import { useTheme } from '@/hooks/use-theme';

const BOX_SIZE = 96;
const FRAME_SIZE = BOX_SIZE - 16;
const MARK_SIZE = 60;
const SWEEP_RANGE = FRAME_SIZE / 2 - 4;

/**
 * Loops for as long as it's mounted — shown while a document is being read
 * by the AI extraction call, which can take a few seconds with no other
 * progress signal to show.
 */
export function ScanningLogo() {
  const theme = useTheme();
  const sweep = useSharedValue(-SWEEP_RANGE);
  const ring = useSharedValue(0);

  useEffect(() => {
    sweep.value = withRepeat(
      withSequence(
        withTiming(SWEEP_RANGE, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
        withTiming(-SWEEP_RANGE, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    ring.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }), -1, false);
  }, [sweep, ring]);

  const sweepStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sweep.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 1 - ring.value,
    transform: [{ scale: 0.82 + ring.value * 0.5 }],
  }));

  return (
    <View style={styles.box}>
      <Animated.View style={[styles.ring, { borderColor: theme.primary }, ringStyle]} />
      <View style={[styles.frame, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <LogoMark size={MARK_SIZE} color={theme.primary} />
        <Animated.View
          style={[
            styles.sweep,
            sweepStyle,
            { experimental_backgroundImage: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: BOX_SIZE, height: BOX_SIZE, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: BOX_SIZE / 2,
    borderWidth: 1.5,
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sweep: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 22,
    opacity: 0.6,
  },
});
