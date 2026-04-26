import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BottomTab, type TabKey } from "../../components";
import { colors } from "../../theme/tokens";

const TAB_ROUTE_TO_KEY: Record<string, TabKey> = {
  AnalysesTab: "home",
  PatientsTab: "patients",
  RapportsTab: "reports",
  CompteTab: "settings",
};

const KEY_TO_TAB_ROUTE: Record<TabKey, string> = {
  home: "AnalysesTab",
  patients: "PatientsTab",
  reports: "RapportsTab",
  settings: "CompteTab",
};

export function V2TabBar({ state, navigation }: BottomTabBarProps) {
  const current = state.routes[state.index]?.name ?? "AnalysesTab";
  const activeKey = TAB_ROUTE_TO_KEY[current] ?? "home";

  function handlePress(key: TabKey) {
    navigation.navigate(KEY_TO_TAB_ROUTE[key]);
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ backgroundColor: colors.bgCard }}>
      <BottomTab active={activeKey} onPress={handlePress} />
    </SafeAreaView>
  );
}
