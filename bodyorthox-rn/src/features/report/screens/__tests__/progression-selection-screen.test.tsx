import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ProgressionSelectionScreen } from "../progression-selection-screen";
import { Analysis } from "../../../capture/domain/analysis";
import { Patient } from "../../../patients/domain/patient";

const mockPatient: Patient = {
  id: "patient-1",
  name: "Jean Dupont",
  dateOfBirth: "1985-06-15",
  morphologicalProfile: null,
  createdAt: "2026-03-19T10:00:00.000Z",
};

function makeAnalysis(id: string, createdAt: string): Analysis {
  return {
    id,
    patientId: "patient-1",
    createdAt,
    angles: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 },
    bilateralAngles: {
      left: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 },
      right: { kneeAngle: 177, hipAngle: 176, ankleAngle: 175 },
      leftHKA: 176,
      rightHKA: 178,
    },
    confidenceScore: 0.9,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
  };
}

const mockAnalyses: Analysis[] = [
  makeAnalysis("a1", "2026-01-01T00:00:00.000Z"),
  makeAnalysis("a2", "2026-02-01T00:00:00.000Z"),
  makeAnalysis("a3", "2026-03-01T00:00:00.000Z"),
  makeAnalysis("a4", "2026-04-01T00:00:00.000Z"),
];

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams = { patient: mockPatient, analyses: mockAnalyses };

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: mockRouteParams }),
}));

describe("ProgressionSelectionScreen — sélection des analyses", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = { patient: mockPatient, analyses: mockAnalyses };
  });

  it("présélectionne toutes les analyses et affiche le compteur correspondant", () => {
    const { getByTestId } = render(<ProgressionSelectionScreen />);
    expect(getByTestId("progression-selection-count").props.children.join("")).toContain(
      String(mockAnalyses.length),
    );
  });

  it("désactive la validation en dessous de 2 analyses sélectionnées", () => {
    const { getByTestId } = render(<ProgressionSelectionScreen />);

    // Décoche jusqu'à ne laisser qu'une seule analyse.
    fireEvent.press(getByTestId("progression-selection-item-a1"));
    fireEvent.press(getByTestId("progression-selection-item-a2"));
    fireEvent.press(getByTestId("progression-selection-item-a3"));

    expect(getByTestId("progression-selection-submit").props.accessibilityState.disabled).toBe(
      true,
    );
    expect(getByTestId("progression-selection-hint")).toBeTruthy();
  });

  it("le raccourci « 3 dernières » sélectionne les 3 analyses les plus récentes", () => {
    const { getByTestId } = render(<ProgressionSelectionScreen />);

    fireEvent.press(getByTestId("progression-selection-shortcut-last3"));
    fireEvent.press(getByTestId("progression-selection-submit"));

    expect(mockNavigate).toHaveBeenCalledWith("ProgressionReport", {
      patient: mockPatient,
      analyses: expect.arrayContaining([
        expect.objectContaining({ id: "a2" }),
        expect.objectContaining({ id: "a3" }),
        expect.objectContaining({ id: "a4" }),
      ]),
    });
    const call = mockNavigate.mock.calls[0][1];
    expect(call.analyses).toHaveLength(3);
    expect(call.analyses.some((a: Analysis) => a.id === "a1")).toBe(false);
  });

  it("le raccourci « Tout » resélectionne toutes les analyses après une désélection", () => {
    const { getByTestId } = render(<ProgressionSelectionScreen />);

    fireEvent.press(getByTestId("progression-selection-shortcut-last3"));
    fireEvent.press(getByTestId("progression-selection-shortcut-all"));
    fireEvent.press(getByTestId("progression-selection-submit"));

    const call = mockNavigate.mock.calls[0][1];
    expect(call.analyses).toHaveLength(4);
  });

  it("valide en générant le rapport uniquement sur les analyses cochées", () => {
    const { getByTestId } = render(<ProgressionSelectionScreen />);

    fireEvent.press(getByTestId("progression-selection-item-a1"));
    fireEvent.press(getByTestId("progression-selection-submit"));

    const call = mockNavigate.mock.calls[0][1];
    expect(call.analyses.some((a: Analysis) => a.id === "a1")).toBe(false);
    expect(call.analyses).toHaveLength(3);
  });

  it("affiche un état vide quand le patient n'a aucune analyse", () => {
    mockRouteParams = { patient: mockPatient, analyses: [] };
    const { getByTestId } = render(<ProgressionSelectionScreen />);
    expect(getByTestId("progression-selection-empty")).toBeTruthy();
  });
});
