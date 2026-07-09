/**
 * BodyOrthox Design System – Color Palette (v1 → v2 « Navy » alias)
 *
 * Ce module conserve exactement les mêmes clés publiques que la v1 legacy
 * (rétro-compat totale pour les ~40 écrans qui l'importent), mais chaque
 * valeur est désormais mappée sur les design tokens v2 « Navy »
 * (`src/theme/tokens.ts`). Aucun écran n'a besoin d'être modifié : ils
 * adoptent visuellement la palette navy en important les mêmes noms.
 *
 * NE PAS ré-introduire de valeurs hex ad hoc ici : toute couleur vient de
 * `tokens` (les rares littéraux restants sont des dérivés directs des tokens
 * v2 — fin de gradient, overlays navy — absents de la table de base).
 */
import { colors as v2 } from "../../theme/tokens";

export const Colors = {
  // Brand — navy/blue v2 (CTAs, liens, accents)
  primary: v2.navyMid, // accent Instrument (#0891B2) — liens/actifs
  primaryDark: v2.accentDeep, // accent pressed (#0E7490)
  primaryLight: v2.navyLight, // #EAF0FE — fond cards résultat

  // Semantic — palette clinique v2 (handoff)
  success: v2.green, // #0A6E52 (dans la norme)
  warning: v2.amberMid, // #B45309 (écart léger)
  error: v2.red, // #B91C1C (hors norme)
  warningModerate: v2.amber, // #92510A (écart modéré)
  info: v2.navyMid,

  // Confidence — alignée sur la palette sémantique v2
  confidenceHigh: v2.green,
  confidenceMedium: v2.amber,
  confidenceLow: v2.red,

  // Background — Navy v2
  background: v2.bg, // #F4F7FB
  backgroundCard: v2.bgCard, // #FFFFFF
  backgroundElevated: v2.bgCard,
  surface: v2.bgSubtle, // #EDF1F7

  // Text — navy sur fond clair
  textPrimary: v2.textPrimary, // #0C1F35
  textSecondary: v2.textSecond, // #3D5470
  textDisabled: v2.textMuted, // #5A7290 (AA)
  textOnPrimary: v2.textInverse, // #FFFFFF

  // Border
  border: v2.border, // rgba(15,40,80,0.10)
  borderFocus: v2.navyMid,

  // Neutral
  white: v2.white,
  black: v2.black,
  darkGrey: v2.textPrimary,
  warningAmber: v2.amber,

  // Overlay — navy plutôt que noir pur
  overlay: "rgba(12,35,64,0.45)",
  overlayLight: "rgba(12,35,64,0.20)",

  // Chart — mappé sur la palette v2
  chartKnee: v2.navyMid,
  chartHip: v2.red,
  chartAnkle: v2.teal,
  chartReference: v2.border,
} as const;

export type ColorKey = keyof typeof Colors;
