import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "./icons";
import { colors, fonts, fontWeight, sizes, spacing } from "../theme/tokens";

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
        const tint = focused ? colors.navyMid : colors.textMuted;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onPress?.(tab.key)}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
          >
            <Icon name={tab.icon} size={20} color={tint} strokeWidth={1.75} />
            <Text style={[styles.label, { color: tint, fontWeight: focused ? fontWeight.bold : fontWeight.medium }]}>
              {tab.label}
            </Text>
            {focused ? <View style={styles.dot} /> : null}
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
    paddingTop: 8,
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
  label: {
    fontFamily: fonts.sans,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  dot: {
    position: "absolute",
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.navyMid,
  },
});

export { TABS };
