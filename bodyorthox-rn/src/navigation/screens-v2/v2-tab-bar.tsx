import React, { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BottomTab, PatientPickerModal, type TabKey } from "../../components";
import { usePatientsStore } from "../../features/patients/store/patients-store";
import type { Patient } from "../../features/patients/domain/patient";
import { colors } from "../../theme/tokens";

const TAB_ROUTE_TO_KEY: Record<string, TabKey> = {
  AnalysesTab: "home",
  PatientsTab: "patients",
  RapportsTab: "reports",
  CompteTab: "settings",
};

const KEY_TO_TAB_ROUTE: Partial<Record<TabKey, string>> = {
  home: "AnalysesTab",
  patients: "PatientsTab",
  reports: "RapportsTab",
  settings: "CompteTab",
};

export function V2TabBar({ state, navigation }: BottomTabBarProps) {
  const current = state.routes[state.index]?.name ?? "AnalysesTab";
  const activeKey = TAB_ROUTE_TO_KEY[current] ?? "home";

  // Capture centrale : même flux que la carte « Nouvelle capture » du
  // dashboard — choisir le patient, la capture démarre.
  const patients = usePatientsStore((s) => s.patients);
  const [pickerVisible, setPickerVisible] = useState(false);

  const handlePress = useCallback(
    (key: TabKey) => {
      if (key === "capture") {
        setPickerVisible(true);
        return;
      }
      const route = KEY_TO_TAB_ROUTE[key];
      if (route) navigation.navigate(route);
    },
    [navigation],
  );

  const handleSelectPatient = useCallback(
    (patient: Patient) => {
      setPickerVisible(false);
      // « Capture » vit sur le stack racine : l'appel remonte du tab
      // navigator vers son parent (résolution ascendante React Navigation).
      navigation.navigate("Capture", { patientId: patient.id });
    },
    [navigation],
  );

  const handleCreatePatient = useCallback(() => {
    setPickerVisible(false);
    navigation.navigate("PatientsTab", { screen: "CreatePatient" });
  }, [navigation]);

  return (
    <SafeAreaView edges={["bottom"]} style={{ backgroundColor: colors.bgCard }}>
      <BottomTab active={activeKey} onPress={handlePress} />
      <PatientPickerModal
        visible={pickerVisible}
        patients={patients}
        onSelectPatient={handleSelectPatient}
        onCreatePatient={handleCreatePatient}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}
