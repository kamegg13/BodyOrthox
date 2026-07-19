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
    (key: "new-patient" | "protocols") => {
      switch (key) {
        case "new-patient":
          navigation.navigate("CreatePatient");
          return;
        case "protocols":
          // Écran du stack Analyses courant (guide de positionnement).
          navigation.navigate("Protocols");
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

  // Sélection depuis le picker rapide de capture — même appel que le bouton
  // Capture de la fiche patient (patient-detail-route.tsx::handleCapture).
  const handleCaptureForPatient = useCallback(
    (patient: Patient) => {
      navigation.navigate("Capture", { patientId: patient.id });
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
      onCaptureForPatient={handleCaptureForPatient}
      onTabPress={handleTabPress}
    />
  );
}

export function formatPractitionerName(user: { firstName?: string; lastName?: string; email: string } | null): string {
  if (!user) return "Praticien";
  if (user.firstName || user.lastName) {
    const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return withDoctorPrefix(full);
  }
  const local = user.email.split("@")[0] ?? "";
  if (!local) return "Praticien";
  const parts = local.split(/[._-]/).filter(Boolean);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return withDoctorPrefix(parts.map(cap).join(" "));
}

/** Préfixe « Dr. » sans le doubler si le nom le porte déjà (« Dr. Martin »). */
function withDoctorPrefix(name: string): string {
  return /^dr\.?(\s|$)/i.test(name) ? name : `Dr. ${name}`;
}
