import type { PatientDetailData } from "../../navigation/screens-v2/patient-detail-route";

export const SAMPLE_PATIENT_DETAIL: PatientDetailData = {
  name: "Sophie Leclerc",
  sex: "F",
  age: 34,
  id: "P-0041",
  status: { label: "Actif", color: "teal" },
  heightCm: 165,
  weightKg: 58,
  dob: "12/03/91",
  diagnosisDescription:
    "Scoliose idiopathique adolescente — Cobb 18° suivi longitudinal.",
  history: [
    { id: "h1", date: "24 avr 2026", type: "Posture complète · 4 vues", hka: "173° / 177°", range: "out_of_range" },
    { id: "h2", date: "10 mars 2026", type: "Sagittal seul", range: "in_range" },
    { id: "h3", date: "05 janv 2026", type: "Posture complète · 4 vues", hka: "172° / 177°", range: "out_of_range" },
  ],
  analysisCount: 3,
};
