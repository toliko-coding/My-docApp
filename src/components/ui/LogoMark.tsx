import Svg, { Path } from 'react-native-svg';

interface LogoMarkProps {
  size?: number;
  color?: string;
  checkColor?: string;
}

// Same torn-receipt-and-checkmark path data as the app icon (see
// assets/expo.icon/Assets/docapp-mark.svg), on a 100-unit grid so it scales
// cleanly at any size used inside the app itself.
const CARD_PATH =
  'M18 22 Q18 12 28 12 L72 12 Q82 12 82 22 L82 74 L74 84 L66 74 L58 84 L50 74 L42 84 L34 74 L26 84 L18 74 Z';
const CHECK_PATH = 'M34 46 L46 58 L68 34';

/** The app's brand mark: a torn receipt with a checkmark. */
export function LogoMark({ size = 32, color = '#3B5BFD', checkColor = '#FFFFFF' }: LogoMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path d={CARD_PATH} fill={color} />
      <Path d={CHECK_PATH} stroke={checkColor} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
