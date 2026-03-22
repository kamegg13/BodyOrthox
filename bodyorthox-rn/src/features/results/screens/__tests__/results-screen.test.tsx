import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
} from "@testing-library/react-native";
import { ResultsScreen } from "../results-screen";
import type { Analysis } from "../../../capture/domain/analysis";

// ---------------------------------------------------------------------------
// Mock navigation
// ---------------------------------------------------------------------------
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    replace: jest.fn(),
    push: jest.fn(),
  }),
  useRoute: () => ({
    params: { analysisId: "analysis-001", patientId: "patient-001" },
  }),
}));

// ---------------------------------------------------------------------------
// Mock database & repository
// ---------------------------------------------------------------------------
const mockGetById = jest.fn();

jest.mock("../../../../core/database/init", () => ({
  getDatabase: () => ({}),
}));

jest.mock("../../../capture/data/sqlite-analysis-repository", () => ({
  SqliteAnalysisRepository: jest.fn().mockImplementation(() => ({
    getById: mockGetById,
  })),
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
function buildAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    id: "analysis-001",
    patientId: "patient-001",
    createdAt: "2026-03-15T10:30:00.000Z",
    angles: {
      kneeAngle: 5.2,
      hipAngle: 175.0,
      ankleAngle: 88.5,
    },
    confidenceScore: 0.92,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
    ...overrides,
  };
}

const defaultAnalysis = buildAnalysis();

const analysisWithManualCorrection = buildAnalysis({
  manualCorrectionApplied: true,
  manualCorrectionJoint: "knee",
});

const analysisLowConfidence = buildAnalysis({
  confidenceScore: 0.45,
});

const analysisMediumConfidence = buildAnalysis({
  confidenceScore: 0.72,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderScreen() {
  return render(<ResultsScreen />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("ResultsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetById.mockResolvedValue(defaultAnalysis);
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  describe("loading state", () => {
    it("shows a loading spinner while fetching data", () => {
      // Never resolve — keep in loading state
      mockGetById.mockReturnValue(new Promise(() => {}));
      renderScreen();

      expect(screen.getByText("Chargement des résultats...")).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  describe("error state", () => {
    it("displays error message when repository throws", async () => {
      mockGetById.mockRejectedValue(new Error("DB read failed"));
      renderScreen();

      await waitFor(() => {
        expect(screen.getByText("DB read failed")).toBeTruthy();
      });
    });

    it("shows a generic error message for non-Error throws", async () => {
      mockGetById.mockRejectedValue("unknown");
      renderScreen();

      await waitFor(() => {
        expect(screen.getByText("Erreur inconnue")).toBeTruthy();
      });
    });

    it("shows error when analysis is not found (null)", async () => {
      mockGetById.mockResolvedValue(null);
      renderScreen();

      await waitFor(() => {
        expect(screen.getByText("Analyse introuvable.")).toBeTruthy();
      });
    });

    it("provides a retry button on error that re-triggers the fetch", async () => {
      mockGetById.mockRejectedValueOnce(new Error("Network error"));
      renderScreen();

      await waitFor(() => {
        expect(screen.getByText("Réessayer")).toBeTruthy();
      });

      // On retry, the fetch should succeed
      mockGetById.mockResolvedValueOnce(defaultAnalysis);
      fireEvent.press(screen.getByText("Réessayer"));

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      // getById called twice: once on initial mount (failed), once on retry
      expect(mockGetById).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // AC1: Data loaded and displayed correctly
  // -------------------------------------------------------------------------
  describe("AC1 — data loading from repository", () => {
    it("calls SqliteAnalysisRepository.getById with the analysisId from route params", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      expect(mockGetById).toHaveBeenCalledWith("analysis-001");
      expect(mockGetById).toHaveBeenCalledTimes(1);
    });

    it("displays the analysis date formatted", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      // Date should be displayed (French locale format of 2026-03-15)
      // The exact format depends on locale; we check for presence of key parts
      expect(screen.getByText(/15/)).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // AC2: 3 ArticularAngleCards rendered with correct values
  // -------------------------------------------------------------------------
  describe("AC2 — three articular angle cards", () => {
    it("renders knee, hip, and ankle cards", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("knee-card")).toBeTruthy();
      });

      expect(screen.getByTestId("hip-card")).toBeTruthy();
      expect(screen.getByTestId("ankle-card")).toBeTruthy();
    });

    it("renders correct angle values in the cards", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("knee-card")).toBeTruthy();
      });

      expect(screen.getByText("5.2°")).toBeTruthy();
      expect(screen.getByText("175.0°")).toBeTruthy();
      expect(screen.getByText("88.5°")).toBeTruthy();
    });

    it("renders joint labels (Genou, Hanche, Cheville)", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      expect(screen.getByText("Genou")).toBeTruthy();
      expect(screen.getByText("Hanche")).toBeTruthy();
      expect(screen.getByText("Cheville")).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // AC4: Simple view (default) shows angles + visual indicator + confidence badge
  // -------------------------------------------------------------------------
  describe("AC4 — simple view (default)", () => {
    it("defaults to simple (Vue patient) mode", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      // "Vue patient" button should be active (rendered), "Vue expert" as well
      expect(screen.getByText("Vue patient")).toBeTruthy();
      expect(screen.getByText("Vue expert")).toBeTruthy();
    });

    it("displays confidence badge with high confidence label", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      // 0.92 → "Élevée" and "92%" (may appear in both confidence badge and HKA card)
      expect(screen.getByText(/Confiance Élevée/)).toBeTruthy();
      expect(screen.getAllByText(/92%/).length).toBeGreaterThanOrEqual(1);
    });

    it("displays confidence badge with medium confidence label", async () => {
      mockGetById.mockResolvedValue(analysisMediumConfidence);
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      expect(screen.getByText(/Confiance Moyenne/)).toBeTruthy();
      expect(screen.getAllByText(/72%/).length).toBeGreaterThanOrEqual(1);
    });

    it("displays confidence badge with low confidence label", async () => {
      mockGetById.mockResolvedValue(analysisLowConfidence);
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      expect(screen.getByText(/Confiance Faible/)).toBeTruthy();
      expect(screen.getAllByText(/45%/).length).toBeGreaterThanOrEqual(1);
    });

    it('does NOT show "Données cliniques" section in simple mode', async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      expect(screen.queryByText("Données cliniques")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // AC5: Toggle simple → expert reveals clinical data section
  // -------------------------------------------------------------------------
  describe("AC5 — toggle to expert mode", () => {
    it('shows "Données cliniques" section after pressing "Vue expert"', async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("mode-expert")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("mode-expert"));

      expect(screen.getByText("Données cliniques")).toBeTruthy();
    });

    it("shows ML confidence percentage in expert section", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("mode-expert")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("mode-expert"));

      expect(screen.getByText("Score de confiance ML")).toBeTruthy();
      expect(screen.getByText("92.0%")).toBeTruthy();
    });

    it("shows analysis ID in expert section", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("mode-expert")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("mode-expert"));

      expect(screen.getByText("ID analyse")).toBeTruthy();
      expect(screen.getByText("analysis-001")).toBeTruthy();
    });

    it('shows manual correction status "Non" when not applied', async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("mode-expert")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("mode-expert"));

      expect(screen.getByText("Correction manuelle")).toBeTruthy();
      expect(screen.getByText("Non")).toBeTruthy();
    });

    it('shows manual correction status "Oui" when applied', async () => {
      mockGetById.mockResolvedValue(analysisWithManualCorrection);
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("mode-expert")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("mode-expert"));

      expect(screen.getByText("Oui")).toBeTruthy();
    });

    it('hides "Données cliniques" when toggling back to simple', async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("mode-expert")).toBeTruthy();
      });

      // Switch to expert
      fireEvent.press(screen.getByTestId("mode-expert"));
      expect(screen.getByText("Données cliniques")).toBeTruthy();

      // Switch back to simple
      fireEvent.press(screen.getByTestId("mode-simple"));
      expect(screen.queryByText("Données cliniques")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // AC6: Manual correction indicator
  // -------------------------------------------------------------------------
  describe("AC6 — manual correction indicator", () => {
    it("shows correction note when manualCorrectionApplied is true", async () => {
      mockGetById.mockResolvedValue(analysisWithManualCorrection);
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      expect(screen.getByText(/Correction manuelle \(Genou\)/)).toBeTruthy();
    });

    it("does not show correction note when manualCorrectionApplied is false", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      // The meta card correction note should not exist
      // (Note: "Correction manuelle" also appears in expert mode as a label,
      //  but in simple mode it should not appear)
      expect(screen.queryByText(/Correction manuelle \(/)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // AC7: Back navigation
  // -------------------------------------------------------------------------
  describe("AC7 — back navigation", () => {
    it("navigates to PatientDetail with correct patientId on back press", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("back-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("back-button"));

      expect(mockNavigate).toHaveBeenCalledWith("PatientDetail", {
        patientId: "patient-001",
      });
    });
  });

  // -------------------------------------------------------------------------
  // Replay button
  // -------------------------------------------------------------------------
  describe("replay button", () => {
    it("navigates to Replay screen on press", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("replay-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("replay-button"));

      expect(mockNavigate).toHaveBeenCalledWith("Replay", {
        analysisId: "analysis-001",
        patientId: "patient-001",
      });
    });
  });

  // -------------------------------------------------------------------------
  // Deviation assessment rendering
  // -------------------------------------------------------------------------
  describe("angle deviation rendering", () => {
    it('shows "Normal" badges for within-norm angles', async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      // knee 5.2° (norm 0-10) → normal
      // hip 175° (norm 170-180) → normal
      // ankle 88.5° (norm 80-100) → normal
      // All three should show "Normal"
      const normals = screen.getAllByText("Normal");
      expect(normals.length).toBe(3);
    });

    it("shows deviation badges for out-of-norm angles", async () => {
      const abnormalAnalysis = buildAnalysis({
        angles: {
          kneeAngle: 25.0, // > 10, deviation 15 → moderate
          hipAngle: 150.0, // < 170, deviation 20 → severe
          ankleAngle: 90.0, // normal
        },
      });
      mockGetById.mockResolvedValue(abnormalAnalysis);
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      expect(screen.getByText("Déviation modérée")).toBeTruthy();
      expect(screen.getByText("Déviation sévère")).toBeTruthy();
      expect(screen.getByText("Normal")).toBeTruthy();
    });
  });
});
