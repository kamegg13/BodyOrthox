import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
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

export type BtnVariant = "primary" | "secondary" | "ghost" | "teal" | "danger";

interface BtnProps {
  readonly label: string;
  readonly variant?: BtnVariant;
  readonly icon?: IconName;
  readonly small?: boolean;
  readonly full?: boolean;
  readonly disabled?: boolean;
  readonly onPress?: () => void;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

/**
 * Bouton v4 « Accessible & Ethical ».
 * - primaire : cyan primaire plein, texte blanc — seule couleur de CTA
 *   primaire de l'app (le vert santé est réservé aux badges/statuts, il
 *   porte déjà le sens sémantique « Normal ») ;
 * - secondaire : bordure teintée sur blanc, texte encre ;
 * - destructive (`danger`) : bordure rouge, texte rouge ;
 * - ghost : transparent, texte encre.
 * La variante `teal` legacy rend le primaire plein.
 */
export function Btn({
  label,
  variant = "primary",
  icon,
  small = false,
  full = true,
  disabled = false,
  onPress,
  style,
  testID,
}: BtnProps) {
  const height = small ? sizes.btnSmall : sizes.btnPrimary;
  const fontSizePx = small ? 13 : fontSize.bodyLg;
  const paddingH = small ? spacing.s16 : spacing.s20;

  const isFilled = variant === "primary" || variant === "teal";

  const textColor = (() => {
    switch (variant) {
      case "primary":
      case "teal":
        return colors.textInverse;
      case "secondary":
      case "ghost":
        return colors.textPrimary;
      case "danger":
        return colors.red;
    }
  })();

  const containerStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      height,
      borderRadius: radius.button,
      paddingHorizontal: full ? 0 : paddingH,
      alignSelf: full ? "stretch" : "flex-start",
    },
    isFilled && styles.filled,
    variant === "secondary" && styles.secondary,
    variant === "ghost" && styles.ghost,
    variant === "danger" && styles.danger,
    disabled && styles.disabled,
    style,
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        {icon ? <Icon name={icon} size={small ? 14 : 16} color={textColor} /> : null}
        <Text
          style={[styles.label, { color: textColor, fontSize: fontSizePx }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  filled: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.red,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    zIndex: 1,
  },
  label: {
    fontFamily: fonts.display,
    fontWeight: fontWeight.semiBold,
    letterSpacing: -0.1,
  },
});
