import React from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Icon } from "./icons";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  sizes,
  spacing,
} from "../theme/tokens";

interface SelectFieldProps {
  readonly label?: string;
  readonly placeholder?: string;
  readonly value?: string;
  readonly onPress?: () => void;
  readonly disabled?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function SelectField({
  label,
  placeholder,
  value,
  onPress,
  disabled = false,
  style,
  testID,
}: SelectFieldProps) {
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [styles.input, pressed && styles.pressed]}
      >
        <Text
          style={[styles.value, !value && styles.placeholder]}
          numberOfLines={1}
        >
          {value ?? placeholder ?? ""}
        </Text>
        <Icon name="chevDown" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, width: "100%", minWidth: 0 },
  label: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semiBold,
    color: colors.textSecond,
    letterSpacing: 0.07 * fontSize.eyebrow,
    textTransform: "uppercase",
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    height: sizes.field,
    paddingHorizontal: spacing.s12,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: colors.borderMid,
    backgroundColor: colors.bgCard,
    gap: spacing.s8,
    width: "100%",
    minWidth: 0,
    overflow: "hidden",
  },
  pressed: { opacity: 0.85 },
  value: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    color: colors.textPrimary,
  },
  placeholder: {
    color: colors.textMuted,
  },
});
