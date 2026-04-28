import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import { Dashboard } from "../../screens/Dashboard";
import { useAuthStore } from "../../core/auth/auth-store";
import type { Patient } from "../../features/patients/domain/patient";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function DashboardRoute() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const practitionerName = formatPractitionerName(user);

  const handleQuickAction = useCallback(
    (key: "new-patient" | "capture" | "analysis" | "report") => {
      switch (key) {
        case "new-patient":
          navigation.navigate("CreatePatient");
          return;
        case "capture":
        case "analysis":
        case "report":
          navigation.navigate("MainTabs", { screen: "PatientsTab" });
          return;
      }
    },
    [navigation],
  );

  const handleSeeAll = useCallback(() => {
    navigation.navigate("MainTabs", { screen: "PatientsTab" });
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
          return;
        case "patients":
          navigation.navigate("MainTabs", { screen: "PatientsTab" });
          return;
        case "settings":
          navigation.navigate("MainTabs", { screen: "CompteTab" });
          return;
        case "capture":
        case "reports":
          // Pas de tab dédié — on ouvre la liste patients
          navigation.navigate("MainTabs", { screen: "PatientsTab" });
          return;
      }
    },
    [navigation],
  );

  return (
    <Dashboard
      practitionerName={practitionerName}
      hideBottomTab
      onQuickAction={handleQuickAction}
      onSeeAllPatients={handleSeeAll}
      onPatientPress={handlePatientPress}
      onTabPress={handleTabPress}
    />
  );
}

function formatPractitionerName(user: { firstName?: string; lastName?: string; email: string } | null): string {
  if (!user) return "Praticien";
  if (user.firstName || user.lastName) {
    const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return `Dr. ${full}`;
  }
  const local = user.email.split("@")[0] ?? "";
  if (!local) return "Praticien";
  const parts = local.split(/[._\-]/).filter(Boolean);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return `Dr. ${parts.map(cap).join(" ")}`;
}
