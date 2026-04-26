/**
 * BodyOrthox – Design Tokens (v2)
 * Source : design_handoff_bodyorthox/README.md
 *
 * Adaptation React Native :
 * - les gradients sont stockés sous forme de tuples [from, to, ...] et
 *   rendus via le composant <Gradient> (SVG) ou via une vue plate.
 * - les ombres CSS multi-couches sont décomposées en (iOS shadow*)
 *   + (Android elevation).
 */
import { Platform, type ViewStyle, type TextStyle } from "react-native";

export const colors = {
  // Backgrounds
  bg: "#F4F7FB",
  bgCard: "#FFFFFF",
  bgSubtle: "#EDF1F7",
  bgHover: "#F0F4FA",

  // Borders
  border: "rgba(15,40,80,0.10)",
  borderMid: "rgba(15,40,80,0.16)",

  // Brand — deep navy primary
  navy: "#0C2340",
  navyMid: "#1A4FD6",
  navyLight: "#EAF0FE",
  navySoft: "#D4E2FD",

  // Accent — clinical teal
  teal: "#0D9080",
  tealLight: "#E0F5F3",
  tealSoft: "#B2E8E2",

  // Semantic
  amber: "#92510A",
  amberLight: "#FEF3C7",
  amberSoft: "#FDE68A",
  red: "#B91C1C",
  redLight: "#FEE2E2",
  green: "#0A6E52",
  greenLight: "#DCFCE7",

  // Text
  textPrimary: "#0C1F35",
  textSecond: "#3D5470",
  textMuted: "#7F96B2",
  textInverse: "#FFFFFF",

  white: "#FFFFFF",
  black: "#000000",

  // Capture screen
  captureBg: "#08111E",
  captureViewfinderFrom: "#0E1C2F",
  captureViewfinderTo: "#162840",

  // Whites with alpha (for overlays on navy)
  white06: "rgba(255,255,255,0.06)",
  white07: "rgba(255,255,255,0.07)",
  white08: "rgba(255,255,255,0.08)",
  white12: "rgba(255,255,255,0.12)",
  white20: "rgba(255,255,255,0.20)",
  white35: "rgba(255,255,255,0.35)",
  white40: "rgba(255,255,255,0.40)",
  white50: "rgba(255,255,255,0.50)",
  white55: "rgba(255,255,255,0.55)",
  white60: "rgba(255,255,255,0.60)",
  white70: "rgba(255,255,255,0.70)",
} as const;

/**
 * Gradients — stockés en tuples [angle, ...stops].
 * `<Gradient>` (composant) sait rendre cette structure via react-native-svg.
 */
export type GradientStop = readonly [color: string, offset: number];
export interface Gradient {
  readonly angle: number; // degrés CSS (135deg, 160deg, etc.)
  readonly stops: readonly GradientStop[];
}

export const gradients = {
  primaryBtn: {
    angle: 135,
    stops: [
      ["#1A4FD6", 0],
      ["#1240B8", 1],
    ],
  } satisfies Gradient,
  tealBtn: {
    angle: 135,
    stops: [
      ["#0D9080", 0],
      ["#0A7870", 1],
    ],
  } satisfies Gradient,
  hero: {
    angle: 160,
    stops: [
      ["#0C2340", 0],
      ["#0A2550", 0.6],
      ["#0B2E5E", 1],
    ],
  } satisfies Gradient,
  tipBanner: {
    angle: 120,
    stops: [
      ["#EAF0FE", 0],
      ["#E0F5F3", 1],
    ],
  } satisfies Gradient,
  reportHeader: {
    angle: 120,
    stops: [
      ["#0C2340", 0],
      ["#0A2550", 0.6],
      ["#0B2E5E", 1],
    ],
  } satisfies Gradient,
  viewfinder: {
    angle: 160,
    stops: [
      ["#0E1C2F", 0],
      ["#162840", 1],
    ],
  } satisfies Gradient,
} as const;

/**
 * Shadows — décomposition iOS (shadow*) + Android (elevation).
 * Sur iOS on garde la couche la plus marquée des shadows multiples du mock.
 */
export const shadows: Record<
  "sm" | "md" | "lg" | "primary" | "teal" | "actionBar",
  ViewStyle
> = {
  sm: Platform.select({
    ios: {
      shadowColor: "#0C2340",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  md: Platform.select({
    ios: {
      shadowColor: "#0C2340",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
    },
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle,
  lg: Platform.select({
    ios: {
      shadowColor: "#0C2340",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.14,
      shadowRadius: 40,
    },
    android: { elevation: 8 },
    default: {},
  }) as ViewStyle,
  primary: Platform.select({
    ios: {
      shadowColor: "#1A4FD6",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle,
  teal: Platform.select({
    ios: {
      shadowColor: "#0D9080",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle,
  actionBar: Platform.select({
    ios: {
      shadowColor: "#0C2340",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
    },
    android: { elevation: 6 },
    default: {},
  }) as ViewStyle,
};

/**
 * Typographie — DM Sans / DM Mono.
 *
 * Web : Google Fonts chargées via `<link>` dans `web/index.html`. On utilise
 *       les noms CSS standard, qui acceptent tous les poids sur une même
 *       famille (font-weight: 400/500/600/700/800).
 * Native : à embarquer dans `assets/fonts/` + `react-native.config.js`.
 *          En attendant, on retombe sur la police système.
 */
export const fonts = {
  sans: Platform.select({
    web: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    ios: "DMSans-Regular",
    android: "DMSans-Regular",
    default: "System",
  }) as string,
  mono: Platform.select({
    web: '"DM Mono", "SF Mono", Menlo, Consolas, monospace',
    ios: "DMMono-Regular",
    android: "DMMono-Regular",
    default: "Menlo",
  }) as string,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
  extraBold: "800",
} as const satisfies Record<string, TextStyle["fontWeight"]>;

/** Tailles de texte du handoff (rôles → px). */
export const fontSize = {
  // Page H1 (Patients title)
  h1: 22,
  // Hero name (greeting, patient name)
  hero: 20,
  // Section H2
  h2: 22,
  // NavBar title
  navTitle: 16,
  // List item primary
  listPrimary: 14,
  // Body / button
  body: 14,
  bodyLg: 15,
  // Stat values
  statLg: 30,
  statMd: 26,
  statSm: 14,
  // Caption / meta
  caption: 12,
  captionXs: 11,
  // Section label / Field label (eyebrow)
  eyebrow: 11,
  // Tiny mono (IDs, live readouts)
  monoSm: 10,
  monoMd: 12,
} as const;

/** Espacements ad-hoc utilisés par le handoff. */
export const spacing = {
  s4: 4,
  s6: 6,
  s8: 8,
  s9: 9,
  s10: 10,
  s11: 11,
  s12: 12,
  s13: 13,
  s14: 14,
  s16: 16,
  s18: 18,
  s20: 20,
  s22: 22,
  s24: 24,
  s28: 28,
  // Insets fréquents
  screenH: 16,
  screenHWide: 18,
  cardPadV: 12,
  cardPadH: 14,
  heroPadH: 20,
  heroPadV: 18,
} as const;

/** Border radius par rôle. */
export const radius = {
  button: 13,
  field: 12,
  iconSm: 12,
  cardSm: 14,
  cardLg: 16,
  cardXl: 18,
  pill: 20,
  chip: 20,
  avatarLg: 18,
  shutterInner: 28,
  shutterOuter: 36,
} as const;

/** Tailles de composant (hauteurs, etc.). */
export const sizes = {
  btnPrimary: 50,
  btnSmall: 38,
  field: 48,
  search: 44,
  navBar: 54,
  bottomTab: 66,
  bottomTabSafePad: 6,
  chip: 30,
  tap: 44,
} as const;

export type Tokens = {
  colors: typeof colors;
  gradients: typeof gradients;
  shadows: typeof shadows;
  fonts: typeof fonts;
  fontWeight: typeof fontWeight;
  fontSize: typeof fontSize;
  spacing: typeof spacing;
  radius: typeof radius;
  sizes: typeof sizes;
};

export const tokens: Tokens = {
  colors,
  gradients,
  shadows,
  fonts,
  fontWeight,
  fontSize,
  spacing,
  radius,
  sizes,
};
