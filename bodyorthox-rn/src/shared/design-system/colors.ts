/**
 * BodyOrthox Design System – Color Palette (couche legacy → tokens v4)
 *
 * Ce module conserve exactement les mêmes clés publiques que la v1 legacy
 * (rétro-compat totale pour les ~40 écrans qui l'importent), mais chaque
 * valeur est mappée sur les design tokens v4 « Accessible & Ethical »
 * (`src/theme/tokens.ts` — primaire cyan, vert santé, encre #164E63), via
 * leurs alias historiques (`navyMid`, `accent`… pointent vers les valeurs
 * v4 dans tokens.ts). Aucun écran n'a besoin d'être modifié : ils adoptent
 * la palette v4 en important les mêmes noms.
 *
 * Les valeurs exactes vivent UNIQUEMENT dans tokens.ts — pas de hex en
 * commentaire ici (ils dérivaient à chaque refonte). NE PAS ré-introduire
 * de valeurs ad hoc : toute couleur vient de `tokens` (les rares littéraux
 * restants sont des dérivés absents de la table de base, ex. overlays).
 *
 * Dette documentée : les écrans v2+ importent `colors` depuis theme/tokens
 * directement — les nouveaux écrans doivent faire de même, cette couche
 * n'existe que pour l'existant.
 */
import { colors as v4 } from "../../theme/tokens";

export const Colors = {
  // Brand — primaire cyan v4 (CTAs, liens, accents)
  primary: v4.navyMid, // alias legacy → primaire v4
  primaryDark: v4.accentDeep, // primaire pressed
  primaryLight: v4.navyLight, // fond cards résultat

  // Semantic — palette clinique v4
  success: v4.green, // dans la norme
  warning: v4.amberMid, // écart léger
  error: v4.red, // hors norme
  warningModerate: v4.amber, // écart modéré
  info: v4.navyMid,

  // Confidence — alignée sur la palette sémantique
  confidenceHigh: v4.green,
  confidenceMedium: v4.amber,
  confidenceLow: v4.red,

  // Background
  background: v4.bg,
  backgroundCard: v4.bgCard,
  backgroundElevated: v4.bgCard,
  surface: v4.bgSubtle,

  // Text — encre sur fond clair
  textPrimary: v4.textPrimary,
  textSecondary: v4.textSecond,
  textDisabled: v4.textMuted,
  textOnPrimary: v4.textInverse,

  // Border
  border: v4.border,
  borderFocus: v4.navyMid,

  // Neutral
  white: v4.white,
  black: v4.black,
  darkGrey: v4.textPrimary,
  warningAmber: v4.amber,

  // Overlay — encre plutôt que noir pur (pas de token alpha équivalent)
  overlay: "rgba(12,35,64,0.45)",
  overlayLight: "rgba(12,35,64,0.20)",

  // Chart — mappé sur la palette v4
  chartKnee: v4.navyMid,
  chartHip: v4.red,
  chartAnkle: v4.teal,
  chartReference: v4.border,
} as const;

export type ColorKey = keyof typeof Colors;
