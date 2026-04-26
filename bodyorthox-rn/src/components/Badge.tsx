import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, fontSize, fontWeight, radius } from "../theme/tokens";

export type BadgeColor = "navy" | "teal" | "amber" | "red" | "green";

const PALETTE: Record<BadgeColor, { bg: string; fg: string }> = {
  navy: { bg: colors.navyLight, fg: colors.navyMid },
  teal: { bg: colors.tealLight, fg: colors.teal },
  amber: { bg: colors.amberLight, fg: colors.amber },
  red: { bg: colors.redLight, fg: colors.red },
  green: { bg: colors.greenLight, fg: colors.green },
};

interface BadgeProps {
  readonly label: string;
  readonly color?: BadgeColor;
}

export function Badge({ label, color = "navy" }: BadgeProps) {
  const { bg, fg } = PALETTE[color];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 7,
    paddingRight: 9,
    borderRadius: radius.pill,
    gap: 5,
    alignSelf: "flex-start",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semiBold,
  },
});
