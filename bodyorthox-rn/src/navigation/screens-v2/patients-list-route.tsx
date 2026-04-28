import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import { PatientList } from "../../screens/PatientList";
import type { Patient } from "../../features/patients/domain/patient";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PatientsListRoute() {
  const navigation = useNavigation<Nav>();

  const handleAdd = useCallback(() => {
    navigation.navigate("CreatePatient");
  }, [navigation]);

  const handlePatientPress = useCallback(
    (patient: Patient) => {
      navigation.navigate("PatientDetail", { patientId: patient.id });
    },
    [navigation],
  );

  const handleTabPress = useCallback(
    (key: "home" | "patients" | "capture" | "reports" | "settings") => {
      switch (key) {
        case "home":
          navigation.navigate("MainTabs", { screen: "AnalysesTab" });
          return;
        case "patients":
          return;
        case "settings":
          navigation.navigate("MainTabs", { screen: "CompteTab" });
          return;
        default:
          return;
      }
    },
    [navigation],
  );

  return (
    <PatientList
      hideBottomTab
      onAddPatient={handleAdd}
      onPatientPress={handlePatientPress}
      onTabPress={handleTabPress}
    />
  );
}
