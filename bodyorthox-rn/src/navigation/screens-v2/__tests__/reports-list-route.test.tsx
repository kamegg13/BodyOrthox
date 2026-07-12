import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { ReportsListRoute } from "../reports-list-route";
import { usePatientsStore } from "../../../features/patients/store/patients-store";
import type { Analysis } from "../../../features/capture/domain/analysis";
import type { Patient } from "../../../features/patients/domain/patient";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockGetForPatient = jest.fn();
const mockGetById = jest.fn();
// Référence stable : sinon l'effet (deps: [patients, repo]) reprend sa
// requête à chaque render et l'écran reste bloqué en chargement (cf. le
// même commentaire dans results-route.test.tsx).
const mockRepo = { getForPatient: mockGetForPatient, getById: mockGetById };
jest.mock("../../../shared/hooks/use-analysis-repository", () => ({
  useAnalysisRepository: () => mockRepo,
}));

const patients: Patient[] = [
  {
    id: "patient-1",
    name: "Jean Dupont",
    dateOfBirth: "1990-01-01",
    morphologicalProfile: null,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "patient-2",
    name: "Sophie Leclerc",
    dateOfBirth: "1985-05-05",
    morphologicalProfile: null,
    createdAt: "2024-01-01T00:00:00Z",
  },
];

function buildAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    id: "analysis-1",
    patientId: "patient-1",
    createdAt: "2026-03-19T14:30:00.000Z",
    angles: { kneeAngle: 176.2, hipAngle: 175.0, ankleAngle: 174.5 },
    confidenceScore: 0.9,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  usePatientsStore.setState({
    patients,
    isLoading: false,
    error: null,
  } as never);
  mockGetForPatient.mockImplementation(async (patientId: string) => {
    if (patientId === "patient-1") {
      return [
        buildAnalysis({
          id: "a1",
          patientId: "patient-1",
          bilateralAngles: {
            leftHKA: 179,
            rightHKA: 179,
            left: { kneeAngle: 176.2, hipAngle: 175.0, ankleAngle: 174.5 },
            right: { kneeAngle: 176.2, hipAngle: 175.0, ankleAngle: 174.5 },
          },
        }),
      ];
    }
    if (patientId === "patient-2") {
      return [
        buildAnalysis({
          id: "a2",
          patientId: "patient-2",
          bilateralAngles: {
            leftHKA: 165,
            rightHKA: 165,
            left: { kneeAngle: 165, hipAngle: 165, ankleAngle: 165 },
            right: { kneeAngle: 165, hipAngle: 165, ankleAngle: 165 },
          },
        }),
      ];
    }
    return [];
  });
});

describe("ReportsListRoute — recherche et filtre", () => {
  it("filtre les rapports par nom de patient", async () => {
    const { findByText, queryByText, getByTestId } = render(<ReportsListRoute />);
    await findByText("Jean Dupont");
    expect(await findByText("Sophie Leclerc")).toBeTruthy();

    fireEvent.changeText(getByTestId("reports-search-input"), "Sophie");

    await waitFor(() => {
      expect(queryByText("Jean Dupont")).toBeNull();
    });
  });

  it("filtre les rapports par sévérité", async () => {
    const { getByTestId, findByText, queryByText } = render(<ReportsListRoute />);
    await findByText("Jean Dupont");

    fireEvent.press(getByTestId("reports-severity-chip-severe"));

    await waitFor(() => {
      expect(queryByText("Jean Dupont")).toBeNull();
      expect(queryByText("Sophie Leclerc")).toBeTruthy();
    });
  });

  it("affiche un état vide distinct pour une recherche sans résultat", async () => {
    const { getByTestId, findByText, findByTestId } = render(<ReportsListRoute />);
    await findByText("Jean Dupont");

    fireEvent.changeText(getByTestId("reports-search-input"), "zzz-inconnu");

    expect(await findByTestId("reports-empty-search")).toBeTruthy();
  });

  it("affiche l'état 'Aucun rapport' quand il n'y a aucun rapport", async () => {
    mockGetForPatient.mockResolvedValue([]);
    const { findByTestId } = render(<ReportsListRoute />);
    expect(await findByTestId("reports-empty-none")).toBeTruthy();
  });

  it("navigue vers le rapport sélectionné", async () => {
    mockGetById.mockResolvedValue(buildAnalysis({ id: "a1", patientId: "patient-1" }));
    const { findByText } = render(<ReportsListRoute />);
    const row = await findByText("Jean Dupont");
    fireEvent.press(row);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "Report",
        expect.objectContaining({ patient: patients[0] }),
      );
    });
  });
});

describe("ReportsListRoute — états loading/erreur", () => {
  it("affiche un état d'erreur quand le chargement des patients échoue", async () => {
    usePatientsStore.setState({ patients: [], isLoading: false, error: "Erreur réseau" } as never);
    const { findByText } = render(<ReportsListRoute />);
    expect(await findByText("Erreur réseau")).toBeTruthy();
  });
});
