/**
 * BodyOrthox Design System – Color Palette
 * Clinical White theme – iOS-native aesthetic (accessibility AA).
 */
export const Colors = {
  // Brand — from mockups
  primary: "#1B6FBF", // Blue médical (CTAs, liens, accents)
  primaryDark: "#155a9c",
  primaryLight: "#E8F1FB", // Background cards résultat

  // Semantic — iOS system colors
  success: "#34C759", // Vert iOS (normal, dans la norme)
  warning: "#FF9500", // Orange iOS (à surveiller)
  error: "#FF3B30", // Rouge iOS (hors norme)
  warningModerate: "#e67e22",
  info: "#007AFF", // Bleu iOS

  // Confidence
  confidenceHigh: "#34C759",
  confidenceMedium: "#FF9500",
  confidenceLow: "#FF3B30",

  // Background — Clinical White
  background: "#F2F2F7", // iOS systemGroupedBackground
  backgroundCard: "#FFFFFF", // White cards
  backgroundElevated: "#FFFFFF",
  surface: "#F2F2F7",

  // Text — dark on light
  textPrimary: "#1C1C1E", // iOS label
  textSecondary: "#8E8E93", // iOS secondaryLabel
  textDisabled: "#C7C7CC",
  textOnPrimary: "#FFFFFF", // White text on blue buttons

  // Border
  border: "#E5E5EA", // iOS separator
  borderFocus: "#1B6FBF",

  // Neutral
  white: "#FFFFFF",
  black: "#000000",
  darkGrey: "#111111",
  warningAmber: "#FF9500",

  // Overlay
  overlay: "rgba(0,0,0,0.4)",
  overlayLight: "rgba(0,0,0,0.2)",

  // Chart
  chartKnee: "#1B6FBF",
  chartHip: "#FF3B30",
  chartAnkle: "#34C759",
  chartReference: "rgba(0,0,0,0.1)",
} as const;

export type ColorKey = keyof typeof Colors;
