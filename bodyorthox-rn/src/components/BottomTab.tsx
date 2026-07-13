import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "./icons";
import { colors, fonts, fontSize, fontWeight, shadows, sizes, spacing } from "../theme/tokens";

export type TabKey = "home" | "patients" | "capture" | "reports" | "settings";

interface TabDef {
  readonly key: TabKey;
  readonly label: string;
  readonly icon: IconName;
}

// « Capture » au centre : c'est l'action cœur de métier du praticien — elle
// doit rester accessible depuis n'importe quel onglet, pas seulement depuis
// la carte du dashboard.
const TABS: readonly TabDef[] = [
  { key: "home", label: "Accueil", icon: "grid" },
  { key: "patients", label: "Patients", icon: "users" },
  { key: "capture", label: "Capture", icon: "camera" },
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
        if (tab.key === "capture") {
          return (
            <Pressable
              key={tab.key}
              onPress={() => onPress?.(tab.key)}
              style={styles.item}
              accessibilityRole="button"
              accessibilityLabel="Nouvelle capture"
              testID="tab-capture"
            >
              <View style={styles.captureBtn}>
                <Icon name="camera" size={22} color={colors.onPrimary} strokeWidth={1.75} />
              </View>
              <Text style={[styles.label, styles.captureLabel]}>{tab.label}</Text>
            </Pressable>
          );
        }
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
  // Bouton d'action central — cercle primaire surélevé au-dessus de la barre.
  captureBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginTop: -22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.bgCard,
    ...shadows.primary,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    letterSpacing: 0.2,
  },
  captureLabel: {
    color: colors.primary,
    fontWeight: fontWeight.semiBold,
    marginTop: 1,
  },
});

export { TABS };
