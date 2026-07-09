import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Btn, type BtnVariant } from "./Btn";
import { Icon, type IconName } from "./icons";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../theme/tokens";

export type StateTone = "navy" | "danger";

interface EmptyStateProps {
  readonly title: string;
  readonly message?: string;
  readonly icon?: IconName;
  /** Teinte du badge d'icône (défaut : navy ; « danger » pour ErrorState). */
  readonly tone?: StateTone;
  readonly actionLabel?: string;
  readonly actionVariant?: BtnVariant;
  readonly onAction?: () => void;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

/** État vide navy : badge d'icône optionnel, titre, message, action optionnelle. */
export function EmptyState({
  title,
  message,
  icon,
  tone = "navy",
  actionLabel,
  actionVariant = "secondary",
  onAction,
  style,
  testID,
}: EmptyStateProps) {
  const isDanger = tone === "danger";
  const badgeBg = isDanger ? colors.redLight : colors.bgSubtle;
  const iconColor = isDanger ? colors.red : colors.ink;
  const showAction = actionLabel !== undefined && onAction !== undefined;
  return (
    <View style={[styles.container, style]} testID={testID}>
      {icon ? (
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Icon name={icon} size={24} color={iconColor} />
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {showAction ? (
        <Btn
          label={actionLabel}
          variant={actionVariant}
          full={false}
          onPress={onAction}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.s24,
    gap: spacing.s12,
    backgroundColor: colors.bg,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: radius.cardLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.hero,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  message: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  action: {
    marginTop: spacing.s8,
  },
});
