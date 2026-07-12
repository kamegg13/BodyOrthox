import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { ProgressionReportScreen } from "../progression-report-screen";
import { Analysis } from "../../../capture/domain/analysis";
import { Patient } from "../../../patients/domain/patient";
import * as progressionReportGenerator from "../../domain/progression-report-generator";

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
    createdAt: "2026-03-19T14:30:00.000Z",
    angles: { kneeAngle: 176.2, hipAngle: 175.0, ankleAngle: 174.5 },
    confidenceScore: 0.92,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
  },
];

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: () => ({
    params: { patient: mockPatient, analyses: mockAnalyses },
  }),
}));

describe("ProgressionReportScreen — états unifiés (LoadingState/ErrorState)", () => {
  it("affiche le rapport une fois la génération terminée", async () => {
    const { getByTestId } = render(<ProgressionReportScreen />);

    await waitFor(() => {
      expect(getByTestId("progression-report-screen")).toBeTruthy();
    });
    expect(getByTestId("progression-report-title")).toBeTruthy();
  });

  it("affiche une ErrorState avec un bouton Réessayer quand la génération échoue", async () => {
    jest
      .spyOn(progressionReportGenerator, "generateProgressionReportHtml")
      .mockImplementationOnce(() => {
        throw new Error("Erreur de génération");
      });

    const { getByText, getByTestId } = render(<ProgressionReportScreen />);

    await waitFor(() => {
      expect(getByTestId("progression-report-error")).toBeTruthy();
    });
    expect(getByText("Erreur de génération")).toBeTruthy();
    expect(getByText("Réessayer")).toBeTruthy();
  });

  it("relance la génération quand on appuie sur Réessayer, et affiche le rapport en cas de succès", async () => {
    jest
      .spyOn(progressionReportGenerator, "generateProgressionReportHtml")
      .mockImplementationOnce(() => {
        throw new Error("Erreur de génération");
      });

    const { getByText, getByTestId } = render(<ProgressionReportScreen />);

    await waitFor(() => {
      expect(getByTestId("progression-report-error")).toBeTruthy();
    });

    fireEvent.press(getByText("Réessayer"));

    await waitFor(() => {
      expect(getByTestId("progression-report-title")).toBeTruthy();
    });
  });
});
