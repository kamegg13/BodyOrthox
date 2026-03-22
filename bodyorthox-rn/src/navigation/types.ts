import { Analysis } from "../features/capture/domain/analysis";
import { Patient } from "../features/patients/domain/patient";
import type { NavigatorScreenParams } from "@react-navigation/native";

export type BottomTabParamList = {
  AnalysesTab: undefined;
  PatientsTab: undefined;
  CompteTab: undefined;
};

export type RootStackParamList = {
  Lock: undefined;
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
  Patients: undefined;
  CreatePatient: undefined;
  PatientDetail: { patientId: string };
  Capture: { patientId: string };
  Results: { analysisId: string; patientId: string };
  Replay: { analysisId: string; patientId: string };
  Timeline: { patientId: string };
  Report: { analysis: Analysis; patient: Patient };
  Protocols: undefined;
  Reports: undefined;
};
