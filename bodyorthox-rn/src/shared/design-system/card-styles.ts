/**
 * BodyOrthox Design System – Shared Card Styles (v1 → v2 « Navy » alias)
 *
 * Mêmes clés publiques (CardShadow, Shadows sm/md/lg/primary), mais les ombres
 * référencent désormais les tokens v2 (`src/theme/tokens.ts` → `shadows`) :
 * teinte navy (au lieu de noir pur) + décomposition iOS `shadow*` / Android
 * `elevation` par plateforme. Aucun écran n'a besoin d'être modifié.
 *
 * NE PAS ré-introduire d'ombres noires ad hoc : tout vient de `tokens.shadows`.
 */
import { ViewStyle } from "react-native";
import { Colors } from "./colors";
import { BorderRadius } from "./spacing";
import { shadows as v2Shadows } from "../../theme/tokens";

export const CardShadow: ViewStyle = {
  backgroundColor: Colors.backgroundCard,
  borderRadius: BorderRadius.lg,
  ...v2Shadows.sm,
};

/** Niveaux de shadow réutilisables (sans backgroundColor ni borderRadius). */
export const Shadows = {
  sm: v2Shadows.sm,
  md: v2Shadows.md,
  lg: v2Shadows.lg,
  primary: v2Shadows.primary,
} as const;
