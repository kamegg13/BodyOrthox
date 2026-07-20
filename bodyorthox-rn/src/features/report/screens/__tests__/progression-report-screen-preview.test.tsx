import React from "react";
import { render } from "@testing-library/react-native";
import { ProgressionReportScreen } from "../progression-report-screen";
import { Analysis } from "../../../capture/domain/analysis";
import { Patient } from "../../../patients/domain/patient";

const mockPatient: Patient = {
  id: "patient-1",
  name: "Jean Dupont",
  dateOfBirth: "1985-06-15",
  morphologicalProfile: null,
  createdAt: "2026-03-19T10:00:00.000Z",
};

const mockAnalyses: Analysis[] = [
  {
    id: "analysis-1",
    patientId: "patient-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    angles: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 },
    // Pas de bilateralAngles : mesure HKA indisponible pour cette séance,
    // ne doit jamais être affichée comme une valeur fabriquée.
    confidenceScore: 0.9,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
  },
  {
    id: "analysis-2",
    patientId: "patient-1",
    createdAt: "2026-02-01T00:00:00.000Z",
    angles: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 },
    bilateralAngles: {
      left: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 },
      right: { kneeAngle: 177, hipAngle: 176, ankleAngle: 175 },
      leftHKA: 173.0,
      rightHKA: 176.0,
    },
    confidenceScore: 0.9,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
  },
];

const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({
    params: { patient: mockPatient, analyses: mockAnalyses },
  }),
}));

describe("ProgressionReportScreen — aperçu des données réelles avant export", () => {
  it("affiche un tableau avec une ligne réelle par analyse sélectionnée", async () => {
    const { getByTestId, findByTestId } = render(<ProgressionReportScreen />);

    await findByTestId("progression-report-data-table");

    expect(getByTestId("progression-report-row-2026-01-01")).toBeTruthy();
    expect(getByTestId("progression-report-row-2026-02-01")).toBeTruthy();
  });

  it("affiche explicitement 'indisponible' pour une mesure manquante, jamais une valeur interpolée", async () => {
    const { findByTestId, toJSON } = render(<ProgressionReportScreen />);

    await findByTestId("progression-report-data-table");

    expect(JSON.stringify(toJSON())).toContain("indisponible");
  });

  it("affiche un message honnête (pas de tendance fabriquée) quand une des deux bornes n'a pas de mesure HKA", async () => {
    const { findByTestId, toJSON } = render(<ProgressionReportScreen />);

    await findByTestId("progression-report-synthesis");

    // La 1re séance (borne de comparaison) n'a pas de mesure HKA : la synthèse
    // doit dire explicitement qu'elle est indisponible, jamais inventer une tendance.
    expect(JSON.stringify(toJSON())).toContain("Synthèse indisponible");
  });
});
