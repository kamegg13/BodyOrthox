import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, fonts, fontSize, fontWeight } from "../theme/tokens";

interface SectionLabelProps {
  readonly children: React.ReactNode;
  readonly right?: React.ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}

export function SectionLabel({ children, right, style }: SectionLabelProps) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.label}>{children}</Text>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.08 * fontSize.eyebrow,
    textTransform: "uppercase",
  },
});
