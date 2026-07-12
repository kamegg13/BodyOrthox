import React, { forwardRef, useState } from "react";
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
  readonly onBlur?: () => void;
  readonly icon?: IconName;
  readonly hint?: string;
  readonly error?: string;
  readonly type?: "text" | "password" | "email" | "number";
  readonly disabled?: boolean;
  readonly autoCapitalize?: TextInputProps["autoCapitalize"];
  /** Surcharge du type d'autofill iOS (déduit de `type` sinon). */
  readonly textContentType?: TextInputProps["textContentType"];
  /** Surcharge du type d'autofill Android/web (déduit de `type` sinon). */
  readonly autoComplete?: TextInputProps["autoComplete"];
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

/** Déduit les props d'autofill (gestionnaire de mots de passe) du `type` du champ. */
function defaultTextContentType(
  type: FieldProps["type"],
): TextInputProps["textContentType"] {
  if (type === "email") return "emailAddress";
  if (type === "password") return "password";
  return "none";
}

function defaultAutoComplete(
  type: FieldProps["type"],
): TextInputProps["autoComplete"] {
  if (type === "email") return "email";
  if (type === "password") return "current-password";
  return "off";
}

export const Field = forwardRef<TextInput, FieldProps>(function Field(
  {
    label,
    placeholder,
    value,
    defaultValue,
    onChangeText,
    onBlur,
    icon,
    hint,
    error,
    type = "text",
    disabled = false,
    autoCapitalize,
    textContentType,
    autoComplete,
    style,
    testID,
  },
  ref,
) {
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
          ref={ref}
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          defaultValue={defaultValue}
          onChangeText={onChangeText}
          secureTextEntry={isPwd && hidden}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? (type === "email" ? "none" : undefined)}
          autoCorrect={type !== "email" && type !== "password"}
          textContentType={textContentType ?? defaultTextContentType(type)}
          autoComplete={autoComplete ?? defaultAutoComplete(type)}
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
      {hasError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    width: "100%",
    minWidth: 0,
  },
  // v4 : label de champ en casse normale (plus d'eyebrow uppercase).
  label: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.textSecond,
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
