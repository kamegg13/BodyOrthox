import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
} from "@testing-library/react-native";
import { ReplayScreen } from "../replay-screen";
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
const mockUpdate = jest.fn().mockResolvedValue(undefined);

jest.mock("../../../../core/database/init", () => ({
  getDatabase: () => ({}),
}));

jest.mock("../../../capture/data/sqlite-analysis-repository", () => ({
  SqliteAnalysisRepository: jest.fn().mockImplementation(() => ({
    getById: mockGetById,
    update: mockUpdate,
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

const lowConfidenceAnalysis = buildAnalysis({
  confidenceScore: 0.45,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderScreen() {
  return render(<ReplayScreen />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("ReplayScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetById.mockResolvedValue(defaultAnalysis);
  });

  // -------------------------------------------------------------------------
  // T3.1 — Loading analysis from repo → displays 3 joint buttons
  // -------------------------------------------------------------------------
  describe("AC1 — loading from repository", () => {
    it("calls getById with the analysisId from route params", async () => {
      renderScreen();

      await waitFor(
        () => {
          expect(screen.getByTestId("replay-screen")).toBeTruthy();
        },
        { timeout: 15000 },
      );

      expect(mockGetById).toHaveBeenCalledWith("analysis-001");
    });

    it("displays 3 joint buttons (Genou, Hanche, Cheville)", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("joint-knee")).toBeTruthy();
      });

      expect(screen.getByTestId("joint-hip")).toBeTruthy();
      expect(screen.getByTestId("joint-ankle")).toBeTruthy();
      expect(screen.getAllByText("Genou").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Hanche").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Cheville").length).toBeGreaterThanOrEqual(1);
    });

    it("displays angle values with 1 decimal", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("replay-screen")).toBeTruthy();
      });

      expect(screen.getAllByText("5.2°").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("175.0°").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("88.5°").length).toBeGreaterThanOrEqual(1);
    });

    it("shows loading spinner while fetching", () => {
      mockGetById.mockReturnValue(new Promise(() => {}));
      renderScreen();

      expect(screen.getByText("Chargement de la relecture...")).toBeTruthy();
    });

    it("shows error when repository throws", async () => {
      mockGetById.mockRejectedValue(new Error("DB error"));
      renderScreen();

      await waitFor(() => {
        expect(screen.getByText("DB error")).toBeTruthy();
      });
    });
  });

  // -------------------------------------------------------------------------
  // AC2 — Confidence badge display
  // -------------------------------------------------------------------------
  describe("AC2 — confidence badge", () => {
    it("displays the confidence score as a percentage badge", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("replay-screen")).toBeTruthy();
      });

      expect(screen.getByText(/92%/)).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // T3.2 — Selecting a joint → shows detail with angle and confidence
  // -------------------------------------------------------------------------
  describe("AC2 — joint selection and detail", () => {
    it("shows detail card when a joint is selected", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("joint-knee")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("joint-knee"));

      expect(screen.getByTestId("joint-detail")).toBeTruthy();
    });

    it("displays angle and confidence in the detail card", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("joint-knee")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("joint-knee"));

      expect(screen.getByText("Angle mesuré")).toBeTruthy();
      expect(screen.getByText("Score de confiance")).toBeTruthy();
    });

    it("hides detail card when the same joint is tapped again", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("joint-knee")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("joint-knee"));
      expect(screen.getByTestId("joint-detail")).toBeTruthy();

      fireEvent.press(screen.getByTestId("joint-knee"));
      expect(screen.queryByTestId("joint-detail")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // T3.3 — Low confidence visual signaling (AC3)
  // -------------------------------------------------------------------------
  describe("AC3 — low confidence signaling", () => {
    it('displays "Confiance faible" text for score < 0.60', async () => {
      mockGetById.mockResolvedValue(lowConfidenceAnalysis);
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("replay-screen")).toBeTruthy();
      });

      expect(screen.getByText(/Confiance Faible/)).toBeTruthy();
    });

    it('shows "Confiance faible" label near joints when score < 0.60', async () => {
      mockGetById.mockResolvedValue(lowConfidenceAnalysis);
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("replay-screen")).toBeTruthy();
      });

      // Each joint button should show a low confidence indicator
      const lowConfLabels = screen.getAllByText("Confiance faible");
      expect(lowConfLabels.length).toBe(3);
    });

    it("does NOT show low confidence label for high confidence analysis", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("replay-screen")).toBeTruthy();
      });

      expect(screen.queryByText("Confiance faible")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // T3.4 — Manual correction flow (AC4)
  // -------------------------------------------------------------------------
  describe("AC4 — manual correction", () => {
    it("shows correction input when a joint is selected on low confidence analysis", async () => {
      mockGetById.mockResolvedValue(lowConfidenceAnalysis);
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("joint-knee")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("joint-knee"));

      expect(screen.getByTestId("correction-input")).toBeTruthy();
      expect(screen.getByTestId("save-correction-button")).toBeTruthy();
    });

    it("calls repository update with corrected values on save", async () => {
      mockGetById.mockResolvedValue(lowConfidenceAnalysis);
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("joint-knee")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("joint-knee"));
      fireEvent.changeText(screen.getByTestId("correction-input"), "7.5");
      fireEvent.press(screen.getByTestId("save-correction-button"));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith("analysis-001", {
          angles: {
            kneeAngle: 7.5,
            hipAngle: 175.0,
            ankleAngle: 88.5,
          },
          manualCorrectionApplied: true,
          manualCorrectionJoint: "knee",
        });
      });
    });

    it("shows success feedback after correction is saved", async () => {
      mockGetById.mockResolvedValue(lowConfidenceAnalysis);
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("joint-knee")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("joint-knee"));
      fireEvent.changeText(screen.getByTestId("correction-input"), "7.5");
      fireEvent.press(screen.getByTestId("save-correction-button"));

      await waitFor(() => {
        expect(screen.getByText("Correction enregistrée")).toBeTruthy();
      });
    });

    it("shows validation error for invalid angle input", async () => {
      mockGetById.mockResolvedValue(lowConfidenceAnalysis);
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("joint-knee")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("joint-knee"));
      fireEvent.changeText(screen.getByTestId("correction-input"), "abc");
      fireEvent.press(screen.getByTestId("save-correction-button"));

      await waitFor(() => {
        expect(screen.getByText(/nombre valide/i)).toBeTruthy();
      });
    });

    it("shows disclaimer text after correction is applied", async () => {
      mockGetById.mockResolvedValue(lowConfidenceAnalysis);
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("joint-knee")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("joint-knee"));
      fireEvent.changeText(screen.getByTestId("correction-input"), "7.5");
      fireEvent.press(screen.getByTestId("save-correction-button"));

      await waitFor(() => {
        expect(
          screen.getByText(/vérification manuelle effectuée/i),
        ).toBeTruthy();
      });
    });

    it("does NOT show correction controls for high confidence analysis", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("joint-knee")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("joint-knee"));

      expect(screen.queryByTestId("correction-input")).toBeNull();
      expect(screen.queryByTestId("save-correction-button")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // T3.5 — Back navigation (AC6)
  // -------------------------------------------------------------------------
  describe("AC6 — back navigation", () => {
    it("navigates to Results with correct params on back press", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("back-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("back-button"));

      expect(mockNavigate).toHaveBeenCalledWith("Results", {
        analysisId: "analysis-001",
        patientId: "patient-001",
      });
    });

    it("navigates to Results via the bottom action button", async () => {
      renderScreen();

      await waitFor(() => {
        expect(screen.getByTestId("results-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("results-button"));

      expect(mockNavigate).toHaveBeenCalledWith("Results", {
        analysisId: "analysis-001",
        patientId: "patient-001",
      });
    });
  });
});
