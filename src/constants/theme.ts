/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B0D12',
    textSecondary: '#60646C',
    textMuted: '#8A8F98',
    background: '#ffffff',
    backgroundElement: '#F5F6F8',
    backgroundSelected: '#E9EBEF',
    border: '#E3E5EA',
    card: '#ffffff',
    tint: '#3B5BFD',
    primary: '#3B5BFD',
    primaryText: '#ffffff',
    success: '#1AA467',
    successBg: '#E7F7EF',
    danger: '#E14B4B',
    dangerBg: '#FBEAEA',
    warning: '#B8860B',
    warningBg: '#FBF3DF',
    unknown: '#8A8F98',
    unknownBg: '#F0F0F3',
  },
  dark: {
    text: '#F2F3F5',
    textSecondary: '#B0B4BA',
    textMuted: '#7C818A',
    background: '#0B0D12',
    backgroundElement: '#181A20',
    backgroundSelected: '#22252C',
    border: '#2A2D34',
    card: '#151720',
    tint: '#6C86FF',
    primary: '#6C86FF',
    primaryText: '#0B0D12',
    success: '#3DD68C',
    successBg: '#123626',
    danger: '#FF6B6B',
    dangerBg: '#3A1616',
    warning: '#E4B94B',
    warningBg: '#3A2F10',
    unknown: '#9AA0A8',
    unknownBg: '#1F2128',
  },
} as const;

/** Semantic color per bill status, resolved against the active theme's colors. */
export const StatusColors = {
  pending: { fg: 'warning', bg: 'warningBg' },
  paid: { fg: 'success', bg: 'successBg' },
  overdue: { fg: 'danger', bg: 'dangerBg' },
  partially_paid: { fg: 'warning', bg: 'warningBg' },
  unknown: { fg: 'unknown', bg: 'unknownBg' },
} as const satisfies Record<string, { fg: ThemeColorKey; bg: ThemeColorKey }>;

type ThemeColorKey = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const Typography = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
