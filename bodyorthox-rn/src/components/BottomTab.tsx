import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "./icons";
import { colors, fonts, fontSize, fontWeight, sizes, spacing } from "../theme/tokens";

export type TabKey = "home" | "patients" | "reports" | "settings";

interface TabDef {
  readonly key: TabKey;
  readonly label: string;
  readonly icon: IconName;
}

const TABS: readonly TabDef[] = [
  { key: "home", label: "Accueil", icon: "grid" },
  { key: "patients", label: "Patients", icon: "users" },
  { key: "reports", label: "Rapports", icon: "file" },
  { key: "settings", label: "Réglages", icon: "settings" },
];

interface BottomTabProps {
  readonly active: TabKey;
  readonly onPress?: (k: TabKey) => void;
}

export function BottomTab({ active, onPress }: BottomTabProps) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const focused = tab.key === active;
        const tint = focused ? colors.primary : colors.textMuted;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onPress?.(tab.key)}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
          >
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Icon name={tab.icon} size={20} color={tint} strokeWidth={1.75} />
            </View>
            <Text
              style={[
                styles.label,
                { color: tint, fontWeight: focused ? fontWeight.semiBold : fontWeight.medium },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: sizes.bottomTab,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 6,
    paddingBottom: sizes.bottomTabSafePad,
    paddingHorizontal: spacing.s8,
    backgroundColor: colors.bgCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 3,
  },
  // v4 : pilule primaire douce derrière l'icône de l'onglet actif.
  iconWrap: {
    width: 40,
    height: 26,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: colors.primaryLight,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    letterSpacing: 0.2,
  },
});

export { TABS };
