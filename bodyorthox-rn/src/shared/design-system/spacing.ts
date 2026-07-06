/**
 * BodyOrthox Design System – Spacing (v1 → v2 « Navy » alias)
 *
 * Mêmes clés publiques que la v1 (xxs…xxxl), mappées sur la grille v2.
 * Les valeurs v1 (4/8/16/24/32/48/64) sont déjà alignées sur la grille v2 ;
 * on référence les tokens v2 quand un équivalent exact existe, sinon on garde
 * la valeur de grille (multiples de 8 hors table v2 ponctuelle).
 * Le radius `button` est unifié sur la valeur v2 (13, était 14).
 */
import { spacing as v2Spacing, radius as v2Radius } from "../../theme/tokens";

export const Spacing = {
  xxs: 2,
  xs: v2Spacing.s4, // 4
  sm: v2Spacing.s8, // 8
  md: v2Spacing.s16, // 16
  lg: v2Spacing.s24, // 24
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: v2Radius.field, // 12
  button: v2Radius.button, // 13 — unifié (était 14)
  xl: v2Radius.cardLg, // 16
  full: 9999,
} as const;

export const IconSize = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
} as const;
