import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Gradient } from "./gradient";
import { Icon, type IconName } from "./icons";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  gradients,
  radius,
  shadows,
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

  const isGradient = variant === "primary" || variant === "teal";
  const gradient = variant === "teal" ? gradients.tealBtn : gradients.primaryBtn;

  const textColor = (() => {
    switch (variant) {
      case "primary":
      case "teal":
        return colors.textInverse;
      case "secondary":
      case "ghost":
        return colors.navyMid;
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
    variant === "secondary" && styles.secondary,
    variant === "ghost" && styles.ghost,
    variant === "danger" && styles.danger,
    variant === "primary" && shadows.primary,
    variant === "teal" && shadows.teal,
    variant === "secondary" && shadows.sm,
    disabled && styles.disabled,
    style,
  ];

  const inner = (
    <View style={styles.row}>
      {icon ? <Icon name={icon} size={small ? 14 : 16} color={textColor} /> : null}
      <Text style={[styles.label, { color: textColor, fontSize: fontSizePx }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  if (isGradient) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
      >
        <Gradient gradient={gradient} radius={radius.button} style={StyleSheet.absoluteFill}>
          <View />
        </Gradient>
        {inner}
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  secondary: {
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.navySoft,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: colors.redLight,
    borderWidth: 1.5,
    borderColor: "rgba(185,28,28,0.2)",
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.9,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    zIndex: 1,
  },
  label: {
    fontFamily: fonts.sans,
    fontWeight: fontWeight.semiBold,
    letterSpacing: -0.1,
  },
});
