import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { ResultsRoute } from "../results-route";
import { usePatientsStore } from "../../../features/patients/store/patients-store";
import type { Analysis } from "../../../features/capture/domain/analysis";
import type { Patient } from "../../../features/patients/domain/patient";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
  }),
  useRoute: () => ({
    params: { analysisId: "analysis-1", patientId: "patient-1" },
  }),
  // Shim : simule un focus initial pour exercer la recharge de l'écran sans
  // dépendre d'un vrai NavigationContainer dans les tests.
  useFocusEffect: (callback: () => void | (() => void)) => {
    const ReactActual = jest.requireActual("react");
    ReactActual.useEffect(() => {
      const cleanup = callback();
      return cleanup;
    }, []);
  },
}));

const mockGetById = jest.fn();
const mockUpdate = jest.fn().mockResolvedValue(undefined);
// Référence stable : sinon useAsyncData (deps: [..., repo]) reprend sa
// requête à chaque render et l'écran reste bloqué en chargement.
const mockRepo = { getById: mockGetById, update: mockUpdate };

jest.mock("../../../shared/hooks/use-analysis-repository", () => ({
  useAnalysisRepository: () => mockRepo,
}));

const mockPatient: Patient = {
  id: "patient-1",
  name: "Jean Dupont",
  dateOfBirth: "1990-01-01",
  morphologicalProfile: null,
  createdAt: "2024-01-01T00:00:00Z",
};

function buildAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    id: "analysis-1",
    patientId: "patient-1",
    createdAt: "2026-03-19T14:30:00.000Z",
    angles: { kneeAngle: 176.2, hipAngle: 175.0, ankleAngle: 174.5 },
    bilateralAngles: {
      leftHKA: 176.2,
      rightHKA: 177.5,
      left: { kneeAngle: 176.2, hipAngle: 175.0, ankleAngle: 174.5 },
      right: { kneeAngle: 177.5, hipAngle: 176.0, ankleAngle: 175.0 },
    },
    confidenceScore: 0.92,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdate.mockResolvedValue(undefined);
  usePatientsStore.setState({ patients: [mockPatient] } as never);
});

describe("ResultsRoute — notes cliniques", () => {
  it("charge les notes existantes de l'analyse dans le champ", async () => {
    mockGetById.mockResolvedValue(
      buildAnalysis({ clinicalNotes: "Suivi à 3 mois." }),
    );
    const { findByTestId } = render(<ResultsRoute />);
    const input = await findByTestId("clinical-notes-input");
    expect(input.props.value).toBe("Suivi à 3 mois.");
  });

  it("sauvegarde les notes après un court délai suivant la dernière frappe", async () => {
    mockGetById.mockResolvedValue(buildAnalysis());
    const { findByTestId } = render(<ResultsRoute />);
    const input = await findByTestId("clinical-notes-input");

    fireEvent.changeText(input, "Nouvelle observation");
    expect(mockUpdate).not.toHaveBeenCalled();

    await waitFor(
      () => {
        expect(mockUpdate).toHaveBeenCalledWith("analysis-1", {
          clinicalNotes: "Nouvelle observation",
        });
      },
      { timeout: 2000 },
    );
  });

  it("sauvegarde immédiatement (flush) à la perte de focus", async () => {
    mockGetById.mockResolvedValue(buildAnalysis());
    const { findByTestId } = render(<ResultsRoute />);
    const input = await findByTestId("clinical-notes-input");

    fireEvent.changeText(input, "Texte au blur");
    fireEvent(input, "blur");

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith("analysis-1", {
        clinicalNotes: "Texte au blur",
      });
    });
  });

  it("affiche un message d'erreur visible si la sauvegarde échoue", async () => {
    mockGetById.mockResolvedValue(buildAnalysis());
    mockUpdate.mockRejectedValue(new Error("Connexion perdue"));
    const { findByTestId } = render(<ResultsRoute />);
    const input = await findByTestId("clinical-notes-input");

    fireEvent.changeText(input, "Texte");
    fireEvent(input, "blur");

    await waitFor(async () => {
      expect(await findByTestId("clinical-notes-feedback")).toHaveTextContent(
        "Connexion perdue",
      );
    });
  });
});

describe("ResultsRoute — Corriger les points", () => {
  it("navigue vers Replay avec analysisId et patientId", async () => {
    mockGetById.mockResolvedValue(buildAnalysis());
    const { findByTestId } = render(<ResultsRoute />);
    const button = await findByTestId("correct-points-button");

    fireEvent.press(button);

    expect(mockNavigate).toHaveBeenCalledWith("Replay", {
      analysisId: "analysis-1",
      patientId: "patient-1",
    });
  });
});

describe("ResultsRoute — recharge au focus", () => {
  it("recharge l'analyse quand l'écran regagne le focus", async () => {
    mockGetById.mockResolvedValue(buildAnalysis());
    render(<ResultsRoute />);

    await waitFor(() => {
      expect(mockGetById).toHaveBeenCalledWith("analysis-1");
    });
  });
});
