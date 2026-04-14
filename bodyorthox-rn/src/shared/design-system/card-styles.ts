/**
 * BodyOrthox Design System – Shared Card Styles
 * White cards with subtle shadow for elevated appearance.
 */
import { ViewStyle } from "react-native";
import { Colors } from "./colors";
import { BorderRadius } from "./spacing";

export const CardShadow: ViewStyle = {
  backgroundColor: Colors.backgroundCard,
  borderRadius: BorderRadius.lg,
  shadowColor: Colors.black,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 2,
} as const;

/** Niveaux de shadow réutilisables (sans backgroundColor ni borderRadius) */
export const Shadows = {
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  } as ViewStyle,
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  } as ViewStyle,
  primary: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  } as ViewStyle,
} as const;
