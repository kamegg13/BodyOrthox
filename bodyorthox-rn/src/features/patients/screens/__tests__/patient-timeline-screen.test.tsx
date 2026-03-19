import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { PatientTimelineScreen } from "../patient-timeline-screen";
import { Analysis } from "../../../capture/domain/analysis";

// --- Mock data ---

const mockAnalyses: Analysis[] = [
  {
    id: "a1",
    patientId: "p1",
    createdAt: "2026-01-15T10:00:00Z",
    angles: { kneeAngle: 8.2, hipAngle: 172.1, ankleAngle: 91.5 },
    confidenceScore: 0.92,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
  },
  {
    id: "a2",
    patientId: "p1",
    createdAt: "2026-02-15T10:00:00Z",
    angles: { kneeAngle: 5.1, hipAngle: 170.3, ankleAngle: 90.2 },
    confidenceScore: 0.88,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
  },
  {
    id: "a3",
    patientId: "p1",
    createdAt: "2026-03-15T10:00:00Z",
    angles: { kneeAngle: 3.5, hipAngle: 175.0, ankleAngle: 89.8 },
    confidenceScore: 0.95,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
  },
];

// --- Mocks ---

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
  }),
  useRoute: () => ({
    params: { patientId: "p1" },
  }),
}));

const mockGetForPatient = jest.fn();

jest.mock("../../../capture/data/sqlite-analysis-repository", () => ({
  SqliteAnalysisRepository: jest.fn().mockImplementation(() => ({
    getForPatient: mockGetForPatient,
  })),
}));

jest.mock("../../../../core/database/init", () => ({
  getDatabase: () => ({}),
}));

// --- Tests ---

describe("PatientTimelineScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetForPatient.mockResolvedValue(mockAnalyses);
  });

  it("renders the screen title", async () => {
    const { getByText } = render(<PatientTimelineScreen />);
    await waitFor(() => {
      expect(getByText("Progression clinique")).toBeTruthy();
    });
  });

  it("calls getForPatient with correct patientId", async () => {
    render(<PatientTimelineScreen />);
    await waitFor(() => {
      expect(mockGetForPatient).toHaveBeenCalledWith("p1");
    });
  });

  it("shows loading spinner initially", async () => {
    let resolvePromise: (value: Analysis[]) => void;
    const pendingPromise = new Promise<Analysis[]>((resolve) => {
      resolvePromise = resolve;
    });
    mockGetForPatient.mockReturnValue(pendingPromise);

    const { getByTestId, queryByTestId } = render(<PatientTimelineScreen />);

    // LoadingSpinner renders with fullScreen, check it does not show timeline-screen
    expect(queryByTestId("timeline-screen")).toBeNull();

    await act(async () => {
      resolvePromise!(mockAnalyses);
    });
  });

  describe("with 2+ analyses (chart visible)", () => {
    it("renders the progression chart", async () => {
      const { getByTestId } = render(<PatientTimelineScreen />);
      await waitFor(() => {
        expect(getByTestId("progression-chart")).toBeTruthy();
      });
    });

    it("renders timeline items for each analysis", async () => {
      const { getByTestId } = render(<PatientTimelineScreen />);
      await waitFor(() => {
        expect(getByTestId("timeline-item-a1")).toBeTruthy();
        expect(getByTestId("timeline-item-a2")).toBeTruthy();
        expect(getByTestId("timeline-item-a3")).toBeTruthy();
      });
    });

    it("displays angles in timeline items", async () => {
      const { getByText } = render(<PatientTimelineScreen />);
      await waitFor(() => {
        // Check first analysis angles are shown
        expect(getByText(/8\.2°/)).toBeTruthy();
        expect(getByText(/172\.1°/)).toBeTruthy();
      });
    });

    it("navigates to ResultsScreen when timeline item is pressed", async () => {
      const { getByTestId } = render(<PatientTimelineScreen />);
      await waitFor(() => {
        expect(getByTestId("timeline-item-a2")).toBeTruthy();
      });

      fireEvent.press(getByTestId("timeline-item-a2"));
      expect(mockNavigate).toHaveBeenCalledWith("Results", {
        analysisId: "a2",
        patientId: "p1",
      });
    });

    it("renders chart legend with correct labels", async () => {
      const { getByText } = render(<PatientTimelineScreen />);
      await waitFor(() => {
        expect(getByText("Genou")).toBeTruthy();
        expect(getByText("Hanche")).toBeTruthy();
        expect(getByText("Cheville")).toBeTruthy();
      });
    });

    it("renders chart data points", async () => {
      const { getByTestId } = render(<PatientTimelineScreen />);
      await waitFor(() => {
        // Chart should have data points for each analysis
        expect(getByTestId("chart-point-0")).toBeTruthy();
        expect(getByTestId("chart-point-1")).toBeTruthy();
        expect(getByTestId("chart-point-2")).toBeTruthy();
      });
    });
  });

  describe("empty state (0 analyses)", () => {
    beforeEach(() => {
      mockGetForPatient.mockResolvedValue([]);
    });

    it("shows empty state message", async () => {
      const { getByText, getByTestId } = render(<PatientTimelineScreen />);
      await waitFor(() => {
        expect(getByTestId("empty-timeline")).toBeTruthy();
        expect(getByText("Aucune analyse")).toBeTruthy();
      });
    });

    it("shows guidance text", async () => {
      const { getByText } = render(<PatientTimelineScreen />);
      await waitFor(() => {
        expect(getByText(/Effectuez une première analyse/)).toBeTruthy();
      });
    });

    it('has "Démarrer une analyse" button that navigates to Capture', async () => {
      const { getByTestId, getByText } = render(<PatientTimelineScreen />);
      await waitFor(() => {
        expect(getByText("Démarrer une analyse")).toBeTruthy();
      });

      fireEvent.press(getByTestId("start-analysis-button"));
      expect(mockNavigate).toHaveBeenCalledWith("Capture", { patientId: "p1" });
    });

    it("does not render chart", async () => {
      const { queryByTestId } = render(<PatientTimelineScreen />);
      await waitFor(() => {
        expect(queryByTestId("progression-chart")).toBeNull();
      });
    });
  });

  describe("insufficient data (1 analysis)", () => {
    beforeEach(() => {
      mockGetForPatient.mockResolvedValue([mockAnalyses[0]]);
    });

    it("shows insufficient data message", async () => {
      const { getByText, getByTestId } = render(<PatientTimelineScreen />);
      await waitFor(() => {
        expect(getByTestId("empty-timeline")).toBeTruthy();
        expect(getByText("Données insuffisantes")).toBeTruthy();
      });
    });

    it("shows guidance for second analysis", async () => {
      const { getByText } = render(<PatientTimelineScreen />);
      await waitFor(() => {
        expect(getByText(/Effectuez une deuxième analyse/)).toBeTruthy();
      });
    });

    it("does not render chart", async () => {
      const { queryByTestId } = render(<PatientTimelineScreen />);
      await waitFor(() => {
        expect(queryByTestId("progression-chart")).toBeNull();
      });
    });
  });

  it("handles loading error gracefully (shows empty state)", async () => {
    mockGetForPatient.mockRejectedValue(new Error("DB error"));

    const { getByTestId } = render(<PatientTimelineScreen />);
    await waitFor(() => {
      expect(getByTestId("empty-timeline")).toBeTruthy();
    });
  });
});
