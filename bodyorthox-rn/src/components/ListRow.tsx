import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "./icons";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  sizes,
  spacing,
} from "../theme/tokens";

interface ListRowProps {
  readonly label: string;
  readonly value?: string;
  readonly icon?: IconName;
  /** Chevron « › » de fin de ligne (masqué pour les lignes destructives). */
  readonly chevron?: boolean;
  /** Variante action dangereuse (label + icône en rouge). */
  readonly destructive?: boolean;
  readonly disabled?: boolean;
  readonly onPress?: () => void;
  readonly testID?: string;
}

/**
 * Ligne type réglages : icône optionnelle, label, valeur optionnelle, chevron.
 * Hauteur tactile minimale 44 (`sizes.tap`).
 */
export function ListRow({
  label,
  value,
  icon,
  chevron = true,
  destructive = false,
  disabled = false,
  onPress,
  testID,
}: ListRowProps) {
  const labelColor = destructive ? colors.red : colors.textPrimary;
  const iconColor = destructive ? colors.red : colors.textSecond;
  const inert = disabled || onPress === undefined;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={inert}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        pressed && !inert && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon ? (
        <View style={styles.iconWrap}>
          <Icon name={icon} size={16} color={iconColor} />
        </View>
      ) : null}
      <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {chevron && !destructive ? (
        <Icon name="chevRight" size={16} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: sizes.tap,
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s10,
    gap: spacing.s12,
    backgroundColor: colors.bgCard,
  },
  pressed: {
    backgroundColor: colors.bgHover,
  },
  disabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: sizes.chip,
    height: sizes.chip,
    borderRadius: radius.iconSm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgSubtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  label: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.listPrimary,
    fontWeight: fontWeight.medium,
    letterSpacing: -0.1,
  },
  value: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    color: colors.textMuted,
  },
});
