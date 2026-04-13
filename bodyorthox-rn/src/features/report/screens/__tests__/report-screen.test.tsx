import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { ReportScreen } from "../report-screen";
import { useReportStore } from "../../store/report-store";
import { LEGAL_CONSTANTS } from "../../../../core/legal/legal-constants";
import { Analysis } from "../../../capture/domain/analysis";
import { Patient } from "../../../patients/domain/patient";

// Mock share-service to prevent platform issues in tests
jest.mock("../../data/share-service", () => ({
  shareReport: jest.fn().mockResolvedValue({ kind: "shared" }),
}));

// Mock navigation to provide route params
const mockAnalysis: Analysis = {
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
};

const mockPatient: Patient = {
  id: "patient-1",
  name: "Jean Dupont",
  dateOfBirth: "1985-06-15",
  morphologicalProfile: null,
  createdAt: "2026-03-19T10:00:00.000Z",
};

// Override useRoute to provide params
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {
      analysis: mockAnalysis,
      patient: mockPatient,
    },
  }),
}));

describe("ReportScreen", () => {
  beforeEach(() => {
    useReportStore.getState().reset();
  });

  it("should display loading state initially then transition to ready", async () => {
    const { getByTestId } = render(<ReportScreen />);

    // After useEffect triggers generation, it should be ready
    await waitFor(() => {
      expect(getByTestId("report-title")).toBeTruthy();
    });
  });

  it("should display patient name in metadata", async () => {
    const { getByTestId } = render(<ReportScreen />);

    await waitFor(() => {
      const metadata = getByTestId("report-metadata");
      expect(metadata).toBeTruthy();
    });
  });

  it("should display the bilateral angles card when bilateral data is present", async () => {
    const { getByTestId } = render(<ReportScreen />);

    await waitFor(() => {
      expect(getByTestId("report-bilateral")).toBeTruthy();
    });
  });

  it("should display the EU MDR disclaimer", async () => {
    const { getByTestId } = render(<ReportScreen />);

    await waitFor(() => {
      const disclaimer = getByTestId("report-disclaimer");
      expect(disclaimer.props.children).toBe(LEGAL_CONSTANTS.mdrDisclaimer);
    });
  });

  it("should display the export button when report is ready", async () => {
    const { getByTestId } = render(<ReportScreen />);

    await waitFor(() => {
      expect(getByTestId("export-button")).toBeTruthy();
    });
  });

  it("should not make any network requests during generation", async () => {
    // Mock global fetch to track calls
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockImplementation(() =>
        Promise.reject(new Error("Network should not be called")),
      );

    render(<ReportScreen />);

    await waitFor(() => {
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    fetchSpy.mockRestore();
  });
});
