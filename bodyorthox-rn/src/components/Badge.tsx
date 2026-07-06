import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, fontSize, fontWeight, letterSpacing, radius } from "../theme/tokens";

export type BadgeColor = "navy" | "teal" | "amber" | "red" | "green";

/**
 * Pill hairline « Instrument » : fond soft sémantique + texte sémantique foncé.
 * Le sens est porté par le texte (jamais par la couleur seule) — pas de pastille.
 * `navy`/`teal` legacy pointent sur l'accent unique.
 */
const PALETTE: Record<BadgeColor, { bg: string; fg: string }> = {
  navy: { bg: colors.accentLight, fg: colors.accentDeep },
  teal: { bg: colors.accentLight, fg: colors.accentDeep },
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
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignSelf: "flex-start",
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semiBold,
    letterSpacing: letterSpacing.label,
  },
});
