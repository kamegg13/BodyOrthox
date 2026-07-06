import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, fonts, fontSize, fontWeight, spacing } from "../theme/tokens";

interface LoadingStateProps {
  readonly message?: string;
  readonly size?: "small" | "large";
  /** Occupe tout l'écran avec le fond navy `colors.bg`. */
  readonly fullScreen?: boolean;
  readonly testID?: string;
}

/** État de chargement navy : spinner + message optionnel. */
export function LoadingState({
  message,
  size = "large",
  fullScreen = false,
  testID,
}: LoadingStateProps) {
  return (
    <View
      style={[styles.container, fullScreen && styles.fullScreen]}
      testID={testID}
    >
      <ActivityIndicator size={size} color={colors.navyMid} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.s24,
    gap: spacing.s12,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  message: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    color: colors.textMuted,
    textAlign: "center",
  },
});
