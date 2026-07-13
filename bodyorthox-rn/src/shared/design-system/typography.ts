/**
 * BodyOrthox Design System – Typography (couche legacy → tokens v4)
 *
 * Mêmes clés publiques que la v1 (FontSize xs…xxxl, FontWeight, Typography) :
 * rétro-compat totale pour les écrans qui importent ces styles. Les valeurs
 * suivent les tokens v4 (`src/theme/tokens.ts`) :
 *  - `FontFamily` = `fonts.sans` du DS (Source Sans 3 ; les titres v4
 *    utilisent Lexend via `fonts.display`, non exposé par cette couche) ;
 *  - poids et tailles référencent les tokens dès qu'un équivalent existe
 *    (les rares valeurs sans équivalent exact restent sur l'échelle v1).
 *
 * NE PAS ré-introduire de police système ni de tailles ad hoc : tout vient de
 * `tokens`. Nouveaux écrans : importer directement theme/tokens.
 */
import { StyleSheet, TextStyle } from "react-native";
import { Colors } from "./colors";
import {
  fonts,
  fontSize as v2Size,
  fontWeight as v2Weight,
} from "../../theme/tokens";

/** Police de corps de l'app — `fonts.sans` des tokens (Source Sans 3). */
export const FontFamily = fonts.sans;

export const FontSize = {
  xs: v2Size.captionXs, // 11
  sm: 13, // pas d'équiv v2 exact (entre caption 12 et body 14)
  md: v2Size.bodyLg, // 15
  lg: 17, // pas d'équiv v2 exact
  xl: v2Size.h1, // 22
  xxl: 24, // pas d'équiv v2 exact (statMd = 26)
  xxxl: 34, // pas d'équiv v2 exact (statLg = 30)
} as const;

export const FontWeight = {
  regular: v2Weight.regular as TextStyle["fontWeight"],
  medium: v2Weight.medium as TextStyle["fontWeight"],
  semiBold: v2Weight.semiBold as TextStyle["fontWeight"],
  bold: v2Weight.bold as TextStyle["fontWeight"],
} as const;

export const Typography = StyleSheet.create({
  h1: {
    fontFamily: FontFamily,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 42,
  },
  h2: {
    fontFamily: FontFamily,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    lineHeight: 32,
  },
  h3: {
    fontFamily: FontFamily,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  bodyLarge: {
    fontFamily: FontFamily,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  body: {
    fontFamily: FontFamily,
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: FontFamily,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  caption: {
    fontFamily: FontFamily,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    color: Colors.textDisabled,
    lineHeight: 16,
  },
  label: {
    fontFamily: FontFamily,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    lineHeight: 18,
    letterSpacing: 0.5,
  },
});
