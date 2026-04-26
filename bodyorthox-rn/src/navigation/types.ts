import { Analysis } from "../features/capture/domain/analysis";
import { Patient } from "../features/patients/domain/patient";
import type { NavigatorScreenParams } from "@react-navigation/native";

export type BottomTabParamList = {
  AnalysesTab: undefined;
  PatientsTab: undefined;
  RapportsTab: undefined;
  CompteTab: undefined;
};

export type RootStackParamList = {
  Lock: undefined;
  Login: undefined;
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
  Patients: undefined;
  CreatePatient: undefined;
  EditPatient: { patientId: string };
  PatientDetail: { patientId: string };
  Capture: { patientId: string };
  Processing: {
    analysisId: string;
    patientId: string;
    capturedImageUrl?: string;
    allLandmarks?: Record<
      number,
      { x: number; y: number; visibility?: number }
    >;
  };
  Results: {
    analysisId: string;
    patientId: string;
    capturedImageUrl?: string;
    allLandmarks?: Record<
      number,
      { x: number; y: number; visibility?: number }
    >;
  };
  Replay: { analysisId: string; patientId: string };
  Timeline: { patientId: string };
  Report: { analysis: Analysis; patient: Patient };
  ProgressionReport: { patient: Patient; analyses: Analysis[] };
  Protocols: undefined;
  Reports: undefined;
  Admin: undefined;
};
