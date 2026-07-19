import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { Report, ReportRoute } from "../report-route";
import { SAMPLE_REPORT } from "../../../screens/__fixtures__/report";
import { useReportStore } from "../../../features/report/store/report-store";
import { Analysis } from "../../../features/capture/domain/analysis";
import { Patient } from "../../../features/patients/domain/patient";
import type { PoseLandmarks } from "../../../features/capture/data/angle-calculator";

jest.mock("../../../shared/utils/image-dimensions", () => {
  const actual = jest.requireActual("../../../shared/utils/image-dimensions");
  return {
    ...actual,
    getNaturalImageSize: jest.fn().mockResolvedValue({ width: 300, height: 400 }),
  };
});

const SKELETON_LANDMARKS: PoseLandmarks = {
  23: { x: 0.4, y: 0.5, z: 0, visibility: 0.95 },
  24: { x: 0.6, y: 0.5, z: 0, visibility: 0.95 },
  25: { x: 0.4, y: 0.7, z: 0, visibility: 0.95 },
  26: { x: 0.6, y: 0.7, z: 0, visibility: 0.95 },
  27: { x: 0.4, y: 0.9, z: 0, visibility: 0.95 },
  28: { x: 0.6, y: 0.9, z: 0, visibility: 0.95 },
};

const mockShareReport = jest.fn();
const mockDownloadReport = jest.fn();
jest.mock("../../../features/report/data/share-service", () => ({
  shareReport: (...args: unknown[]) => mockShareReport(...args),
  downloadReport: (...args: unknown[]) => mockDownloadReport(...args),
}));

const mockConfirmPrivacy = jest.fn();
jest.mock("../../../features/report/data/privacy-confirm", () => ({
  confirmPrivacyBeforeShare: () => mockConfirmPrivacy(),
}));

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

// Mutable : permet à chaque test de faire varier l'analyse du rapport
// (ex. avec/sans notes cliniques) sans re-mocker le module.
let mockRouteParams: { analysis: Analysis; patient: Patient } = {
  analysis: mockAnalysis,
  patient: mockPatient,
};

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
}));

describe("ReportRoute — export actions", () => {
  beforeEach(() => {
    mockRouteParams = { analysis: mockAnalysis, patient: mockPatient };
    useReportStore.getState().reset();
    mockShareReport.mockReset();
    mockDownloadReport.mockReset();
    mockConfirmPrivacy.mockReset();
    mockShareReport.mockResolvedValue({ kind: "shared" });
    mockDownloadReport.mockResolvedValue({
      kind: "downloaded",
      filePath: "/storage/docs/Report.pdf",
    });
    mockConfirmPrivacy.mockResolvedValue(true);
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call downloadReport (not shareReport) for 'Télécharger PDF', without a privacy prompt", async () => {
    const { getByText } = render(<ReportRoute />);

    await waitFor(() => expect(getByText("Télécharger PDF")).toBeTruthy());
    fireEvent.press(getByText("Télécharger PDF"));

    await waitFor(() => {
      expect(mockDownloadReport).toHaveBeenCalled();
    });
    expect(mockShareReport).not.toHaveBeenCalled();
    expect(mockConfirmPrivacy).not.toHaveBeenCalled();
  });

  it("should confirm the saved file location after a successful download", async () => {
    const { getByText } = render(<ReportRoute />);

    await waitFor(() => expect(getByText("Télécharger PDF")).toBeTruthy());
    fireEvent.press(getByText("Télécharger PDF"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("/storage/docs/Report.pdf"),
      );
    });
  });

  it("should show the privacy warning, then call shareReport, for 'Partager'", async () => {
    const { getByText } = render(<ReportRoute />);

    await waitFor(() => expect(getByText("Partager")).toBeTruthy());
    fireEvent.press(getByText("Partager"));

    await waitFor(() => {
      expect(mockConfirmPrivacy).toHaveBeenCalled();
      expect(mockShareReport).toHaveBeenCalled();
    });
    expect(mockDownloadReport).not.toHaveBeenCalled();
  });

  it("should show the privacy warning, then call shareReport, for 'Envoyer'", async () => {
    const { getByText } = render(<ReportRoute />);

    await waitFor(() => expect(getByText("Envoyer")).toBeTruthy());
    fireEvent.press(getByText("Envoyer"));

    await waitFor(() => {
      expect(mockConfirmPrivacy).toHaveBeenCalled();
      expect(mockShareReport).toHaveBeenCalled();
    });
  });

  it("should not call shareReport when the user cancels the privacy warning", async () => {
    mockConfirmPrivacy.mockResolvedValue(false);
    const { getByText } = render(<ReportRoute />);

    await waitFor(() => expect(getByText("Partager")).toBeTruthy());
    fireEvent.press(getByText("Partager"));

    await waitFor(() => {
      expect(mockConfirmPrivacy).toHaveBeenCalled();
    });
    expect(mockShareReport).not.toHaveBeenCalled();
  });

  it("should show an actionable alert when the download fails", async () => {
    mockDownloadReport.mockResolvedValue({
      kind: "error",
      message: "Impossible d'enregistrer le PDF : disque plein.",
    });
    const { getByText } = render(<ReportRoute />);

    await waitFor(() => expect(getByText("Télécharger PDF")).toBeTruthy());
    fireEvent.press(getByText("Télécharger PDF"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("disque plein"),
      );
    });
  });
});

describe("ReportRoute — conclusion clinique", () => {
  beforeEach(() => {
    useReportStore.getState().reset();
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockRouteParams = { analysis: mockAnalysis, patient: mockPatient };
  });

  it("affiche une mention honnête quand l'analyse n'a pas de notes cliniques", async () => {
    mockRouteParams = { analysis: mockAnalysis, patient: mockPatient };
    const { findByTestId, queryByTestId } = render(<ReportRoute />);

    expect(await findByTestId("report-conclusion-empty")).toHaveTextContent(
      "Aucune note du praticien saisie.",
    );
    expect(queryByTestId("report-conclusion-text")).toBeNull();
  });

  it("affiche les notes cliniques du praticien quand elles existent", async () => {
    mockRouteParams = {
      analysis: {
        ...mockAnalysis,
        clinicalNotes: "Discrète asymétrie, réévaluation dans 3 mois.",
      },
      patient: mockPatient,
    };
    const { findByTestId } = render(<ReportRoute />);

    expect(await findByTestId("report-conclusion-text")).toHaveTextContent(
      "Discrète asymétrie, réévaluation dans 3 mois.",
    );
  });

  it("affiche le badge de confiance faible quand l'analyse a une confidenceScore basse", async () => {
    mockRouteParams = {
      analysis: { ...mockAnalysis, confidenceScore: 0.3 },
      patient: mockPatient,
    };
    const { findByTestId } = render(<ReportRoute />);
    expect(await findByTestId("report-low-confidence-badge")).toBeTruthy();
  });

  it("inclut les notes cliniques dans le HTML généré pour le PDF", async () => {
    mockRouteParams = {
      analysis: {
        ...mockAnalysis,
        clinicalNotes: "Discrète asymétrie, réévaluation dans 3 mois.",
      },
      patient: mockPatient,
    };
    render(<ReportRoute />);

    await waitFor(() => {
      expect(useReportStore.getState().reportHtml).toContain(
        "Discrète asymétrie, réévaluation dans 3 mois.",
      );
    });
  });
});

describe("Report", () => {
  it("rend un AngleScale sous chaque ligne HKA du tableau de mesures", () => {
    const { getByTestId } = render(<Report data={SAMPLE_REPORT} />);
    expect(getByTestId("angle-scale-report-row-0")).toBeTruthy();
    expect(getByTestId("angle-scale-report-row-1")).toBeTruthy();
  });

  it("n'affiche pas de scale sous les lignes non-HKA", () => {
    const { queryByTestId } = render(<Report data={SAMPLE_REPORT} />);
    // Index 2 = "Inclin. épaules", sans angleRefMin/angleRefMax.
    expect(queryByTestId("angle-scale-report-row-2")).toBeNull();
  });

  describe("badge de confiance faible", () => {
    it("n'affiche pas de mention quand confidenceScore est absent", () => {
      const { queryByTestId } = render(<Report data={SAMPLE_REPORT} />);
      expect(queryByTestId("report-low-confidence-badge")).toBeNull();
    });

    it("n'affiche pas de mention quand confidenceScore est élevé", () => {
      const data = { ...SAMPLE_REPORT, confidenceScore: 0.9 };
      const { queryByTestId } = render(<Report data={data} />);
      expect(queryByTestId("report-low-confidence-badge")).toBeNull();
    });

    it("affiche une mention 'Confiance faible' quand confidenceScore est sous le seuil", () => {
      const data = { ...SAMPLE_REPORT, confidenceScore: 0.4 };
      const { getByTestId } = render(<Report data={data} />);
      expect(getByTestId("report-low-confidence-badge")).toHaveTextContent(
        "Confiance faible",
        { exact: false },
      );
    });
  });

  describe("squelette superposé à la capture", () => {
    it("superpose le squelette quand landmarks + photo sont fournis", async () => {
      const data = {
        ...SAMPLE_REPORT,
        capturedImageUrl: "data:image/png;base64,abc",
        skeleton: { landmarks: SKELETON_LANDMARKS },
      };
      const { getByTestId } = render(<Report data={data} />);

      fireEvent(getByTestId("report-capture-block"), "layout", {
        nativeEvent: { layout: { width: 320, height: 180 } },
      });

      await waitFor(() => {
        expect(getByTestId("skeleton-overlay")).toBeTruthy();
      });
    });

    it("pas de squelette sans landmarks", () => {
      const data = {
        ...SAMPLE_REPORT,
        capturedImageUrl: "data:image/png;base64,abc",
      };
      const { getByTestId, queryByTestId } = render(<Report data={data} />);

      fireEvent(getByTestId("report-capture-block"), "layout", {
        nativeEvent: { layout: { width: 320, height: 180 } },
      });

      expect(queryByTestId("skeleton-overlay")).toBeNull();
    });
  });

  describe("conclusion clinique", () => {
    it("affiche une mention honnête quand aucune note n'a été saisie", () => {
      const { getByTestId, queryByTestId } = render(
        <Report data={SAMPLE_REPORT} />,
      );
      expect(getByTestId("report-conclusion-empty")).toHaveTextContent(
        "Aucune note du praticien saisie.",
      );
      expect(queryByTestId("report-conclusion-text")).toBeNull();
    });

    it("affiche le texte réel des notes cliniques du praticien quand elles existent", () => {
      const data = {
        ...SAMPLE_REPORT,
        clinicalNotes: "Discrète asymétrie, réévaluation dans 3 mois.",
      };
      const { getByTestId, queryByTestId } = render(<Report data={data} />);
      expect(getByTestId("report-conclusion-text")).toHaveTextContent(
        "Discrète asymétrie, réévaluation dans 3 mois.",
      );
      expect(queryByTestId("report-conclusion-empty")).toBeNull();
    });
  });
});
