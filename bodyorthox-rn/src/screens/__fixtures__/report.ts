import type { ReportData } from "../../navigation/screens-v2/report-route";

export const SAMPLE_REPORT: ReportData = {
  number: "RPT-2026-0041-04",
  title: "Rapport d’analyse posturale",
  patientName: "Sophie Leclerc",
  date: "24 avr 2026",
  practitioner: "Dr. Jean Martin",
  practitionerId: "RPPS 12345678901",
  rangeLabel: "Hors plage 175–180°",
  rows: [
    {
      label: "HKA gauche",
      value: "173°",
      norm: "180°",
      delta: "−7°",
      status: "measured",
      angleValue: 173,
      angleRefMin: 175,
      angleRefMax: 180,
    },
    {
      label: "HKA droit",
      value: "177°",
      norm: "180°",
      delta: "−3°",
      status: "measured",
      angleValue: 177,
      angleRefMin: 175,
      angleRefMax: 180,
    },
    { label: "Inclin. épaules", value: "4°", norm: "0°", delta: "+4°", status: "measured" },
    { label: "Inclin. bassin",  value: "9°", norm: "5°", delta: "+4°", status: "measured" },
    { label: "Inclin. tronc",   value: "8°", norm: "0°", delta: "+8°", status: "measured" },
  ],
};
