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
