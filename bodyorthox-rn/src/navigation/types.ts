import { Analysis } from "../features/capture/domain/analysis";
import { Patient } from "../features/patients/domain/patient";
import type { NavigatorScreenParams } from "@react-navigation/native";

/** Paramètres d'un écran d'analyse (résultats, processing). */
export type AnalysisScreenParams = {
  analysisId: string;
  patientId: string;
  capturedImageUrl?: string;
  allLandmarks?: Record<number, { x: number; y: number; visibility?: number }>;
};

/** Écrans du parcours patient, dupliqués dans les stacks Analyses et Patients. */
type PatientFlowScreens = {
  CreatePatient: undefined;
  EditPatient: { patientId: string };
  PatientDetail: { patientId: string };
  Results: AnalysisScreenParams;
  Replay: { analysisId: string; patientId: string };
  Timeline: { patientId: string };
  Report: { analysis: Analysis; patient: Patient };
  ProgressionSelection: { patient: Patient; analyses: Analysis[] };
  ProgressionReport: { patient: Patient; analyses: Analysis[] };
};

export type AnalysesStackParamList = PatientFlowScreens & {
  AnalysesHome: undefined;
  Protocols: undefined;
};

export type PatientsStackParamList = PatientFlowScreens & {
  PatientsList: undefined;
};

export type RapportsStackParamList = {
  RapportsHome: undefined;
  Report: { analysis: Analysis; patient: Patient };
};

export type CompteStackParamList = {
  CompteHome: undefined;
  Admin: undefined;
  Calibration: undefined;
};

export type BottomTabParamList = {
  AnalysesTab: NavigatorScreenParams<AnalysesStackParamList> | undefined;
  PatientsTab: NavigatorScreenParams<PatientsStackParamList> | undefined;
  RapportsTab: NavigatorScreenParams<RapportsStackParamList> | undefined;
  CompteTab: NavigatorScreenParams<CompteStackParamList> | undefined;
};

export type RootStackParamList = {
  Lock: undefined;
  Login: undefined;
  Onboarding: { mode?: "review" } | undefined;
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
  ProgressionSelection: { patient: Patient; analyses: Analysis[] };
  ProgressionReport: { patient: Patient; analyses: Analysis[] };
  Protocols: undefined;
  Admin: undefined;
  Calibration: undefined;
};

// Type par défaut de useNavigation()/NavigationContainer (linking, refs) —
// reco React Navigation « Type checking the navigator ».
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends RootStackParamList {}
  }
}
