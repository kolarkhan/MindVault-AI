/**
 * MindVault AI design system tokens.
 *
 * Visual direction: deep navy/charcoal foundation, soft neutral surfaces, restrained
 * accent gradients, premium typography, rounded cards, clear hierarchy. Same structure
 * for light and dark so every screen only ever reads from `theme.colors.*` — never a
 * hardcoded hex — which is what makes the light/dark switch free.
 */
import { Platform } from "react-native";

export const palette = {
  navy900: "#0B1220",
  navy800: "#111A2E",
  navy700: "#182339",
  navy600: "#212F49",
  indigo500: "#6C7CF5",
  indigo400: "#8B9CF7",
  violet400: "#AF52DE",
  teal400: "#32D6C4",
  amber400: "#FFB020",
  rose400: "#FF6B6B",
  green400: "#34C759",
  white: "#FFFFFF",
  slate50: "#F7F8FC",
  slate100: "#EEF0F7",
  slate200: "#E1E4EE",
  slate300: "#C7CCDD",
  slate400: "#9AA1B8",
  slate500: "#6E7691",
  slate600: "#4C536B",
  slate700: "#333A50",
  black: "#000000",
};

export type ThemeColors = typeof lightColors;

const lightColors = {
  background: palette.slate50,
  surface: palette.white,
  surfaceRaised: palette.white,
  surfaceMuted: palette.slate100,
  border: palette.slate200,
  textPrimary: palette.navy900,
  textSecondary: palette.slate600,
  textMuted: palette.slate400,
  textInverted: palette.white,
  accent: palette.indigo500,
  accentSoft: "#E7E9FD",
  success: palette.green400,
  warning: palette.amber400,
  danger: palette.rose400,
  tabBarBackground: palette.white,
  tint: palette.indigo500,
};

const darkColors = {
  background: palette.navy900,
  surface: palette.navy800,
  surfaceRaised: palette.navy700,
  surfaceMuted: palette.navy700,
  border: palette.navy600,
  textPrimary: palette.slate50,
  textSecondary: palette.slate300,
  textMuted: palette.slate400,
  textInverted: palette.navy900,
  accent: palette.indigo400,
  accentSoft: "#232B4D",
  success: palette.green400,
  warning: palette.amber400,
  danger: palette.rose400,
  tabBarBackground: palette.navy800,
  tint: palette.indigo400,
};

export const themes = {
  light: lightColors,
  dark: darkColors,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const typography = {
  fontFamily: Platform.select({ ios: "System", android: "sans-serif", default: "System" }),
  displayLg: { fontSize: 32, fontWeight: "700" as const, letterSpacing: -0.5 },
  displayMd: { fontSize: 26, fontWeight: "700" as const, letterSpacing: -0.3 },
  title: { fontSize: 20, fontWeight: "600" as const },
  subtitle: { fontSize: 16, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  bodySmall: { fontSize: 13, fontWeight: "400" as const },
  caption: { fontSize: 12, fontWeight: "500" as const },
};

export const shadow = {
  card: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
};
