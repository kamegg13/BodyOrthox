/**
 * BodyOrthox Design System – Color Palette
 * Optimised for clinical / medical contexts (accessibility AA).
 */
export const Colors = {
  // Brand
  primary: "#4a90d9",
  primaryDark: "#2c6fad",
  primaryLight: "#7ab3e8",

  // Semantic
  success: "#27ae60",
  warning: "#f39c12",
  error: "#e74c3c",
  warningModerate: "#e67e22",
  info: "#3498db",

  // Confidence score gradient
  confidenceHigh: "#27ae60", // >= 0.85
  confidenceMedium: "#f39c12", // >= 0.60
  confidenceLow: "#e74c3c", // < 0.60

  // Background
  background: "#0f0f1a",
  backgroundCard: "#1a1a2e",
  backgroundElevated: "#22223b",
  surface: "#2d2d44",

  // Text
  textPrimary: "#ffffff",
  textSecondary: "#b0b0c8",
  textDisabled: "#606080",
  textOnPrimary: "#ffffff",

  // Border
  border: "#333355",
  borderFocus: "#4a90d9",

  // Neutral
  white: "#ffffff",
  black: "#000000",
  darkGrey: "#111111",
  warningAmber: "#FFA726",

  // Overlay
  overlay: "rgba(0,0,0,0.6)",
  overlayLight: "rgba(0,0,0,0.3)",

  // Chart colours (clinical)
  chartKnee: "#4a90d9",
  chartHip: "#e74c3c",
  chartAnkle: "#27ae60",
  chartReference: "rgba(255,255,255,0.3)",
} as const;

export type ColorKey = keyof typeof Colors;
