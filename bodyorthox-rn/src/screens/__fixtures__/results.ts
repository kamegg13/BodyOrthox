import type { ResultsData } from "../../navigation/screens-v2/results-route";

export const SAMPLE_RESULTS: ResultsData = {
  patientName: "Sophie Leclerc",
  date: "24 avr 2026",
  type: "Analyse posturale complète",
  rangeStatus: "out_of_range",
  hka: {
    left:  { key: "hka-l", label: "HKA gauche", value: 173, norm: 180, unit: "°" },
    right: { key: "hka-r", label: "HKA droit",  value: 177, norm: 180, unit: "°" },
  },
  postural: [
    { key: "shoulder", label: "Inclin. épaules", left: 4,  right: 3,  norm: 0,  unit: "°" },
    { key: "pelvis",   label: "Inclin. bassin",  left: 9,  right: 6,  norm: 5,  unit: "°" },
    { key: "head",     label: "Décal. tête",      left: 14, right: 12, norm: 0,  unit: "mm" },
    { key: "spine",    label: "Courbure rachis", left: 18, right: 15, norm: 10, unit: "°" },
  ],
};
