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
// Test data (clinically correct values for frontal standing analysis)
// ---------------------------------------------------------------------------
function buildAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    id: "analysis-001",
    patientId: "patient-001",
    createdAt: "2026-03-15T10:30:00.000Z",
    angles: {
      kneeAngle: 176.2,
      hipAngle: 175.0,
      ankleAngle: 174.5,
    },
    bilateralAngles: {
      left: {
        kneeAngle: 175.8,
        hipAngle: 174.2,
        ankleAngle: 173.9,
      },
      right: {
        kneeAngle: 176.2,
        hipAngle: 175.0,
        ankleAngle: 174.5,
      },
      leftHKA: 175.8,
      rightHKA: 176.2,
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
      expect(screen.getByText(/15/)).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // AC2: Bilateral HKA card rendered
  // -------------------------------------------------------------------------
  describe("AC2 — bilateral HKA card", () => {
    it("renders the HKA card", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("hka-card")).toBeTruthy();
      });
    });

    it("displays bilateral HKA angles", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      // Bilateral section should show both legs (may appear in HKA card + detail)
      expect(screen.getAllByText("Jambe gauche").length).toBeGreaterThanOrEqual(
        1,
      );
      expect(screen.getAllByText("Jambe droite").length).toBeGreaterThanOrEqual(
        1,
      );
    });

    it("renders joint labels in bilateral detail (Genou, Hanche, Cheville)", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      expect(screen.getAllByText("Genou").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Hanche").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Cheville").length).toBeGreaterThanOrEqual(1);
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
  // Bilateral analysis display
  // -------------------------------------------------------------------------
  describe("bilateral analysis display", () => {
    it("shows bilateral analysis section with both legs", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      // Should show both leg columns
      expect(screen.getAllByText("Jambe gauche").length).toBeGreaterThanOrEqual(
        1,
      );
      expect(screen.getAllByText("Jambe droite").length).toBeGreaterThanOrEqual(
        1,
      );
    });

    it("shows HKA classification for each leg", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      // Both HKA values (175.8 and 176.2) are in normal range (175-180)
      expect(screen.getAllByText("Normal").length).toBeGreaterThanOrEqual(2);
    });

    it("shows dash for unavailable angles", async () => {
      const analysisNoAnkle = buildAnalysis({
        bilateralAngles: {
          left: { kneeAngle: 175.8, hipAngle: 174.2, ankleAngle: 0 },
          right: { kneeAngle: 176.2, hipAngle: 175.0, ankleAngle: 0 },
          leftHKA: 175.8,
          rightHKA: 176.2,
        },
      });
      mockGetById.mockResolvedValue(analysisNoAnkle);
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-screen")).toBeTruthy();
      });

      // Ankle angles are 0, should show dashes
      expect(screen.getAllByText("\u2014").length).toBeGreaterThanOrEqual(2);
    });
  });
});
