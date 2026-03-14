export type RootStackParamList = {
  Lock: undefined;
  Patients: undefined;
  CreatePatient: undefined;
  PatientDetail: { patientId: string };
  Capture: { patientId: string };
  Results: { analysisId: string; patientId: string };
  Replay: { analysisId: string; patientId: string };
  Timeline: { patientId: string };
};
