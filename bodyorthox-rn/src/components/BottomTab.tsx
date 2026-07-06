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
        const tint = focused ? colors.ink : colors.textMuted;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onPress?.(tab.key)}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
          >
            <View style={styles.tickSlot}>
              {focused ? <View style={styles.tick} /> : null}
            </View>
            <Icon name={tab.icon} size={20} color={tint} strokeWidth={1.75} />
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
  // Signature « graduation » : trait accent au-dessus de l'onglet actif.
  tickSlot: {
    height: 4,
    justifyContent: "center",
  },
  tick: {
    width: 16,
    height: 2,
    backgroundColor: colors.accent,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    letterSpacing: 0.2,
  },
});

export { TABS };
