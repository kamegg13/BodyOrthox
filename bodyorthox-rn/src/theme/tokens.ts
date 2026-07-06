/**
 * BodyOrthox – Design Tokens (v3 « Instrument »)
 * Source : DESIGN_DIRECTION.md (direction artistique).
 *
 * Identité : instrument de mesure numérique — fond papier, encre, hairlines,
 * un seul accent cyan chirurgical, données en monospace. Plat et tracé.
 *
 * Adaptation React Native :
 * - les gradients historiques sont conservés en API mais rendus quasi plats ;
 * - les ombres sont réduites au minimum (hiérarchie par le trait, pas l'ombre).
 *
 * Clés legacy (navy, navyMid, teal…) : ALIAS vers les valeurs Instrument pour
 * la rétro-compatibilité — ne pas les utiliser dans du code nouveau.
 */
import { Platform, type ViewStyle, type TextStyle } from "react-native";

// Valeurs canoniques « Instrument »
const INK = "#101012";
const INK_SOFT = "#16161B";
const ACCENT = "#0891B2";
const ACCENT_DEEP = "#0E7490";
const ACCENT_LIGHT = "#E0F2F7";
const ACCENT_SOFT = "#BAE6F0";

export const colors = {
  // Backgrounds — papier chaud
  bg: "#FAFAF8",
  bgCard: "#FFFFFF",
  bgSubtle: "#F3F2EE",
  bgHover: "#F0EFEA",

  // Borders — hairlines encre
  border: "rgba(16,16,18,0.14)",
  borderMid: "rgba(16,16,18,0.26)",

  // Encre & accent (canoniques)
  ink: INK,
  inkSoft: INK_SOFT,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  accentLight: ACCENT_LIGHT,
  accentSoft: ACCENT_SOFT,

  // Legacy « navy » → encre/accent (alias rétro-compat)
  navy: INK,
  navyMid: ACCENT,
  navyLight: ACCENT_LIGHT,
  navySoft: ACCENT_SOFT,

  // Legacy « teal » → accent unique (alias rétro-compat)
  teal: ACCENT,
  tealLight: ACCENT_LIGHT,
  tealSoft: ACCENT_SOFT,

  // Semantic — mesures (jamais portées par la couleur seule)
  amber: "#92510A",
  // Écart léger (mild) : ambre plus clair que `amber` (réservé à modéré),
  // AA sur fond clair (4.6:1 sur #FFFFFF).
  amberMid: "#B45309",
  amberLight: "#FEF3C7",
  amberSoft: "#FDE68A",
  red: "#B91C1C",
  redLight: "#FEE2E2",
  green: "#047857",
  greenLight: "#ECFDF5",

  // Text — encre sur papier
  textPrimary: INK,
  textSecond: "#46464F",
  // AA : 4.9:1 sur blanc, 4.7:1 sur bg #FAFAF8.
  textMuted: "#6E6E78",
  textInverse: "#FFFFFF",

  white: "#FFFFFF",
  black: "#000000",

  // Capture screen — noir instrument, hairlines blanches
  captureBg: "#0C0C0E",
  captureViewfinderFrom: "#101014",
  captureViewfinderTo: "#16161B",

  // Whites with alpha (overlays sur fonds sombres)
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
 * Gradients — API conservée, rendu « Instrument » : surfaces quasi plates
 * (duo très resserré), plus aucun dégradé décoratif marqué.
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
      [INK_SOFT, 0],
      [INK, 1],
    ],
  } satisfies Gradient,
  tealBtn: {
    angle: 135,
    stops: [
      [ACCENT, 0],
      [ACCENT_DEEP, 1],
    ],
  } satisfies Gradient,
  hero: {
    angle: 160,
    stops: [
      [INK_SOFT, 0],
      [INK, 1],
    ],
  } satisfies Gradient,
  tipBanner: {
    angle: 120,
    stops: [
      ["#F3F2EE", 0],
      [ACCENT_LIGHT, 1],
    ],
  } satisfies Gradient,
  reportHeader: {
    angle: 120,
    stops: [
      [INK_SOFT, 0],
      [INK, 1],
    ],
  } satisfies Gradient,
  viewfinder: {
    angle: 160,
    stops: [
      ["#101014", 0],
      ["#16161B", 1],
    ],
  } satisfies Gradient,
} as const;

/**
 * Shadows — quasi nulles : la hiérarchie vient des hairlines et de l'espace.
 * On garde l'API (sm/md/lg/primary/teal/actionBar) avec des valeurs discrètes.
 */
export const shadows: Record<
  "sm" | "md" | "lg" | "primary" | "teal" | "actionBar",
  ViewStyle
> = {
  sm: Platform.select({
    ios: {
      shadowColor: INK,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
    },
    android: { elevation: 1 },
    default: {},
  }) as ViewStyle,
  md: Platform.select({
    ios: {
      shadowColor: INK,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
    },
    android: { elevation: 1 },
    default: {},
  }) as ViewStyle,
  lg: Platform.select({
    ios: {
      shadowColor: INK,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 16,
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  primary: Platform.select({
    ios: {
      shadowColor: INK,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  teal: Platform.select({
    ios: {
      shadowColor: INK,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  actionBar: Platform.select({
    ios: {
      shadowColor: INK,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
    },
    android: { elevation: 3 },
    default: {},
  }) as ViewStyle,
};

/**
 * Typographie — Space Grotesk (display) / système (corps) / IBM Plex Mono
 * (toutes les données numériques : angles, écarts, IDs, dates techniques).
 *
 * Web : Google Fonts chargées via `<link>` dans `web/index.html`.
 * Native : fallback système assumé (pas de TTF bundlé pour l'instant).
 */
export const fonts = {
  /** Titres, valeurs héro — Space Grotesk. */
  display: Platform.select({
    web: '"Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    ios: "SpaceGrotesk-Regular",
    android: "SpaceGrotesk-Regular",
    default: "System",
  }) as string,
  /** Corps de texte — pile système (lisibilité, zéro chargement). */
  sans: Platform.select({
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    ios: "System",
    android: "System",
    default: "System",
  }) as string,
  /** Données chiffrées & techniques — IBM Plex Mono, tabulaire. */
  mono: Platform.select({
    web: '"IBM Plex Mono", "SF Mono", Menlo, Consolas, monospace',
    ios: "IBMPlexMono",
    android: "IBMPlexMono",
    default: "Menlo",
  }) as string,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
  extraBold: "700",
} as const satisfies Record<string, TextStyle["fontWeight"]>;

/** Tailles de texte par rôle. */
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
  statLg: 32,
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

/** Lettrage des micro-labels uppercase (plaques d'instrument). */
export const letterSpacing = {
  eyebrow: 1.4,
  label: 1.1,
} as const;

/** Espacements. */
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

/** Border radius par rôle — plat et net. */
export const radius = {
  button: 8,
  field: 8,
  iconSm: 8,
  cardSm: 10,
  cardLg: 10,
  cardXl: 12,
  pill: 999,
  chip: 999,
  avatarLg: 10,
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
  letterSpacing: typeof letterSpacing;
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
  letterSpacing,
  spacing,
  radius,
  sizes,
};
