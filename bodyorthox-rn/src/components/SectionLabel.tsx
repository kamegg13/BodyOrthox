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
  // v4 : titre de section en casse normale (Lexend), plus d'eyebrow uppercase.
  label: {
    fontFamily: fonts.display,
    fontSize: fontSize.navTitle,
    fontWeight: fontWeight.semiBold,
    color: colors.ink,
    letterSpacing: -0.1,
  },
});
