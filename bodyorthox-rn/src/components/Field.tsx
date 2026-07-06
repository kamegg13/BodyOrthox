import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Icon, type IconName } from "./icons";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  letterSpacing,
  radius,
  sizes,
  spacing,
} from "../theme/tokens";

interface FieldProps {
  readonly label?: string;
  readonly placeholder?: string;
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onChangeText?: (v: string) => void;
  readonly icon?: IconName;
  readonly hint?: string;
  readonly error?: string;
  readonly type?: "text" | "password" | "email" | "number";
  readonly disabled?: boolean;
  readonly autoCapitalize?: TextInputProps["autoCapitalize"];
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function Field({
  label,
  placeholder,
  value,
  defaultValue,
  onChangeText,
  icon,
  hint,
  error,
  type = "text",
  disabled = false,
  autoCapitalize,
  style,
  testID,
}: FieldProps) {
  const [hidden, setHidden] = useState(type === "password");
  const [focused, setFocused] = useState(false);
  const isPwd = type === "password";
  const keyboardType: KeyboardTypeOptions =
    type === "email" ? "email-address" : type === "number" ? "numeric" : "default";

  const hasError = Boolean(error);

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.input,
          focused && styles.inputFocused,
          hasError && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
      >
        {icon ? (
          <Icon name={icon} size={16} color={colors.textMuted} />
        ) : null}
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          defaultValue={defaultValue}
          onChangeText={onChangeText}
          secureTextEntry={isPwd && hidden}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? (type === "email" ? "none" : undefined)}
          autoCorrect={type !== "email" && type !== "password"}
          testID={testID}
        />
        {isPwd ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Afficher le mot de passe" : "Masquer le mot de passe"}
          >
            <Icon name="eye" size={16} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {hint && !hasError ? <Text style={styles.hint}>{hint}</Text> : null}
      {hasError ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    width: "100%",
    minWidth: 0,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.eyebrow,
    textTransform: "uppercase",
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s10,
    height: sizes.field,
    paddingHorizontal: spacing.s12,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSubtle,
    width: "100%",
    minWidth: 0,
    overflow: "hidden",
  },
  inputFocused: {
    borderColor: colors.accent,
  },
  inputError: {
    borderColor: colors.red,
    backgroundColor: colors.redLight,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    width: "100%",
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    color: colors.textPrimary,
    padding: 0,
    // RN-web : neutralise l'outline par defaut du <input> qui depasse
    // l'arrondi de la cellule sur focus.
    ...(Platform.OS === "web" ? { outlineStyle: "none" as never } : {}),
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.red,
  },
});
