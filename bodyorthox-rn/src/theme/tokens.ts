/**
 * BodyOrthox – Design Tokens (v4 « Accessible & Ethical »)
 * Source : design-system/bodyorthox/MASTER.md (généré par ui-ux-pro-max).
 *
 * Identité : outil clinique de confiance — cyan calme, vert santé pour les
 * actions, fond teinté #ECFEFF, encre #164E63, WCAG AA/AAA visé.
 * Typographie : Lexend (titres, valeurs, boutons) + Source Sans 3 (corps).
 *
 * Règles portées par le système :
 * - contraste texte ≥ 4.5:1 ; les états ne reposent jamais sur la couleur seule ;
 * - cibles tactiles ≥ 44 px (voir sizes.tap) ;
 * - anti-patterns : néons, gradients décoratifs marqués, emojis-icônes.
 *
 * Clés legacy (ink, navy, teal…) : ALIAS vers les valeurs v4 pour la
 * rétro-compatibilité — ne pas les utiliser dans du code nouveau.
 */
import { Platform, type ViewStyle, type TextStyle } from "react-native";

// Valeurs canoniques « Accessible & Ethical »
const PRIMARY = "#0891B2";
const PRIMARY_DEEP = "#0E7490";
const PRIMARY_LIGHT = "#D7F5FA";
const PRIMARY_SOFT = "#A5F3FC";
const ACCENT_GREEN = "#059669";
const ACCENT_GREEN_DEEP = "#047857";
const ACCENT_GREEN_LIGHT = "#D9F2E5";
const FG = "#164E63";
const FG_DEEP = "#103B4C";

export const colors = {
  // Backgrounds — cyan très pâle, cartes blanches
  bg: "#ECFEFF",
  bgCard: "#FFFFFF",
  bgSubtle: "#E8F1F6",
  bgHover: "#DDF2F7",

  // Borders — teintées primaire (cartes bordées, pas de hairline grise)
  border: PRIMARY_SOFT,
  borderMid: "rgba(22,78,99,0.30)",

  // Système de couleur canonique v4
  primary: PRIMARY,
  primaryDeep: PRIMARY_DEEP,
  primaryLight: PRIMARY_LIGHT,
  primarySoft: PRIMARY_SOFT,
  onPrimary: "#FFFFFF",
  secondary: "#22D3EE",

  // Legacy « ink » → encre cyan foncé (alias rétro-compat)
  ink: FG,
  inkSoft: FG_DEEP,
  accent: PRIMARY,
  accentDeep: PRIMARY_DEEP,
  accentLight: PRIMARY_LIGHT,
  accentSoft: PRIMARY_SOFT,

  // Legacy « navy » → primaire (alias rétro-compat)
  navy: FG,
  navyMid: PRIMARY,
  navyLight: PRIMARY_LIGHT,
  navySoft: PRIMARY_SOFT,

  // Legacy « teal » → primaire (alias rétro-compat)
  teal: PRIMARY,
  tealLight: PRIMARY_LIGHT,
  tealSoft: PRIMARY_SOFT,

  // Semantic — mesures et états (toujours accompagnés d'icône/texte)
  green: ACCENT_GREEN,
  greenDeep: ACCENT_GREEN_DEEP,
  greenLight: ACCENT_GREEN_LIGHT,
  amber: "#92510A",
  // Écart modéré : ambre AA sur fonds clairs (4.6:1 sur #FFFFFF).
  amberMid: "#B45309",
  amberLight: "#FDF0DC",
  amberSoft: "#FBE3C0",
  red: "#DC2626",
  redLight: "#FEE2E2",

  // Text — encre cyan sur fonds clairs
  textPrimary: FG,
  textSecond: "#35606F",
  // AA : ≥ 4.5:1 sur blanc et sur bg #ECFEFF.
  textMuted: "#46707F",
  textInverse: "#FFFFFF",

  white: "#FFFFFF",
  black: "#000000",

  // Capture screen — chambre sombre cyan, repères clairs
  captureBg: "#0A2029",
  captureViewfinderFrom: "#0E2A35",
  captureViewfinderTo: "#081820",

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
 * Gradients — API conservée, rendu v4 : duos resserrés dans la teinte
 * primaire ; aucun dégradé décoratif marqué (anti-pattern du système).
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
      [PRIMARY, 0],
      [PRIMARY_DEEP, 1],
    ],
  } satisfies Gradient,
  tealBtn: {
    angle: 135,
    stops: [
      [PRIMARY, 0],
      [PRIMARY_DEEP, 1],
    ],
  } satisfies Gradient,
  hero: {
    angle: 160,
    stops: [
      [PRIMARY, 0],
      [PRIMARY_DEEP, 1],
    ],
  } satisfies Gradient,
  tipBanner: {
    angle: 120,
    stops: [
      ["#E8F1F6", 0],
      [PRIMARY_LIGHT, 1],
    ],
  } satisfies Gradient,
  reportHeader: {
    angle: 120,
    stops: [
      [FG, 0],
      [FG_DEEP, 1],
    ],
  } satisfies Gradient,
  viewfinder: {
    angle: 160,
    stops: [
      ["#0E2A35", 0],
      ["#081820", 1],
    ],
  } satisfies Gradient,
} as const;

/**
 * Shadows — discrètes : la hiérarchie vient des bordures teintées et des
 * remplissages, pas de l'ombre. API conservée (sm/md/lg/primary/teal/actionBar).
 */
export const shadows: Record<
  "sm" | "md" | "lg" | "primary" | "teal" | "actionBar",
  ViewStyle
> = {
  sm: Platform.select({
    ios: {
      shadowColor: FG,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
    },
    android: { elevation: 1 },
    default: {},
  }) as ViewStyle,
  md: Platform.select({
    ios: {
      shadowColor: FG,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
    },
    android: { elevation: 1 },
    default: {},
  }) as ViewStyle,
  lg: Platform.select({
    ios: {
      shadowColor: FG,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  primary: Platform.select({
    ios: {
      shadowColor: PRIMARY_DEEP,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  teal: Platform.select({
    ios: {
      shadowColor: PRIMARY_DEEP,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  actionBar: Platform.select({
    ios: {
      shadowColor: FG,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
    },
    android: { elevation: 3 },
    default: {},
  }) as ViewStyle,
};

/**
 * Typographie — Lexend (titres, valeurs, boutons) / Source Sans 3 (corps) /
 * mono système (IDs, dates techniques — chiffres tabulaires).
 *
 * Web : Google Fonts chargées via `<link>` dans `web/index.html`.
 * Native : fontes VARIABLES bundlées (assets/fonts/Lexend.ttf, SourceSans3.ttf)
 * — mêmes fichiers d'axes wght que Google Fonts, donc les graisses 400-700
 * rendent identiques au web (Android résout par nom de fichier et applique
 * fontWeight via Typeface.create — vraie graisse sur API 28+).
 */
export const fonts = {
  /** Titres, valeurs héro, boutons — Lexend (lisibilité). */
  display: Platform.select({
    web: '"Lexend", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    ios: "Lexend",
    android: "Lexend",
    default: "System",
  }) as string,
  /** Corps de texte — Source Sans 3, fallback système. */
  sans: Platform.select({
    web: '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    ios: "Source Sans 3",
    android: "SourceSans3",
    default: "System",
  }) as string,
  /** Données techniques (IDs, dates) — mono système, tabulaire. */
  mono: Platform.select({
    web: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    ios: "Menlo",
    android: "monospace",
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

/** Tailles de texte par rôle — corps ≥ 15, base lisible mobile. */
export const fontSize = {
  // Page H1 (Patients title)
  h1: 24,
  // Hero name (greeting, patient name)
  hero: 24,
  // Section H2
  h2: 22,
  // NavBar title
  navTitle: 16,
  // List item primary
  listPrimary: 15,
  // Body / button
  body: 15,
  bodyLg: 16,
  // Stat values
  statLg: 32,
  statMd: 28,
  statSm: 15,
  // Caption / meta
  caption: 12.5,
  captionXs: 11.5,
  // Section label / Field label (eyebrow)
  eyebrow: 12,
  // Tiny mono (IDs, live readouts)
  monoSm: 10.5,
  monoMd: 12,
} as const;

/** Lettrage des micro-labels uppercase. */
export const letterSpacing = {
  eyebrow: 0.96,
  label: 0.8,
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
  screenH: 20,
  screenHWide: 20,
  cardPadV: 14,
  cardPadH: 16,
  heroPadH: 20,
  heroPadV: 18,
} as const;

/** Border radius par rôle — arrondi net, cartes 16. */
export const radius = {
  button: 14,
  field: 12,
  iconSm: 10,
  cardSm: 14,
  cardLg: 16,
  cardXl: 16,
  pill: 999,
  chip: 999,
  avatarLg: 12,
  shutterInner: 29,
  shutterOuter: 38,
} as const;

/** Tailles de composant (hauteurs, etc.) — touch targets ≥ 44. */
export const sizes = {
  btnPrimary: 52,
  btnSmall: 44,
  field: 48,
  search: 46,
  navBar: 56,
  bottomTab: 68,
  bottomTabSafePad: 6,
  chip: 32,
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
