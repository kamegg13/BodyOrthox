import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, fontSize, fontWeight, letterSpacing, radius } from "../theme/tokens";
import { Icon, type IconName } from "./icons";

export type BadgeColor = "navy" | "teal" | "amber" | "red" | "green";

/**
 * Chip d'état v4 « Accessible & Ethical » : fond soft sémantique + texte
 * sémantique foncé + icône optionnelle. Le sens est toujours porté par le
 * texte (jamais par la couleur seule) — l'icône renforce sans remplacer.
 * `navy`/`teal` legacy pointent sur le primaire.
 */
const PALETTE: Record<BadgeColor, { bg: string; fg: string; icon: IconName }> = {
  navy: { bg: colors.primaryLight, fg: colors.primaryDeep, icon: "check" },
  teal: { bg: colors.greenLight, fg: colors.greenDeep, icon: "check" },
  amber: { bg: colors.amberLight, fg: colors.amberMid, icon: "clock" },
  red: { bg: colors.redLight, fg: colors.red, icon: "clock" },
  green: { bg: colors.greenLight, fg: colors.greenDeep, icon: "check" },
};

interface BadgeProps {
  readonly label: string;
  readonly color?: BadgeColor;
  /** Icône d'état ; défaut selon la couleur. `null` pour la masquer. */
  readonly icon?: IconName | null;
}

export function Badge({ label, color = "navy", icon }: BadgeProps) {
  const { bg, fg, icon: defaultIcon } = PALETTE[color];
  const iconName = icon === null ? null : icon ?? defaultIcon;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {iconName ? <Icon name={iconName} size={11} color={fg} strokeWidth={1.8} /> : null}
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
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    fontWeight: fontWeight.semiBold,
    letterSpacing: letterSpacing.label,
  },
});
