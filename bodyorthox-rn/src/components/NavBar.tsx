import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "./icons";
import { colors, fonts, fontSize, fontWeight, sizes, spacing } from "../theme/tokens";

interface NavBarProps {
  readonly title: string;
  readonly back?: boolean;
  readonly onBack?: () => void;
  readonly action?: string;
  readonly actionIcon?: IconName;
  readonly onAction?: () => void;
  readonly light?: boolean;
}

export function NavBar({
  title,
  back = false,
  onBack,
  action,
  actionIcon,
  onAction,
  light = false,
}: NavBarProps) {
  const fg = light ? colors.textInverse : colors.textPrimary;
  const actionFg = light ? colors.textInverse : colors.navyMid;
  return (
    <View style={[styles.bar, light ? styles.barLight : styles.barDefault]}>
      <View style={styles.side}>
        {back ? (
          <Pressable
            onPress={onBack}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={styles.iconBtn}
          >
            <Icon name="back" size={16} color={fg} strokeWidth={1.75} />
          </Pressable>
        ) : null}
      </View>
      <Text style={[styles.title, { color: fg }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>
        {action ? (
          <Pressable onPress={onAction} hitSlop={6} accessibilityRole="button">
            <Text style={[styles.actionText, { color: actionFg }]}>{action}</Text>
          </Pressable>
        ) : null}
        {actionIcon ? (
          <Pressable
            onPress={onAction}
            hitSlop={6}
            accessibilityRole="button"
            style={styles.iconBtn}
          >
            <Icon name={actionIcon} size={16} color={actionFg} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: sizes.navBar,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.s14,
  },
  barDefault: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  barLight: {
    backgroundColor: "transparent",
  },
  side: {
    width: 64,
    flexDirection: "row",
    alignItems: "center",
  },
  sideRight: {
    justifyContent: "flex-end",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.sans,
    fontSize: fontSize.navTitle,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  actionText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: fontWeight.semiBold,
  },
});
