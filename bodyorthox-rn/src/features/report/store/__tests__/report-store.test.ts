import { useReportStore } from "../report-store";
import { Analysis } from "../../../capture/domain/analysis";
import { Patient } from "../../../patients/domain/patient";
import { LEGAL_CONSTANTS } from "../../../../core/legal/legal-constants";

const mockPatient: Patient = {
  id: "patient-1",
  name: "Jean Dupont",
  dateOfBirth: "1985-06-15",
  morphologicalProfile: null,
  createdAt: "2026-03-19T10:00:00.000Z",
};

const mockAnalysis: Analysis = {
  id: "analysis-1",
  patientId: "patient-1",
  createdAt: "2026-03-19T14:30:00.000Z",
  angles: { kneeAngle: 5.2, hipAngle: 175.0, ankleAngle: 88.5 },
  confidenceScore: 0.92,
  manualCorrectionApplied: false,
  manualCorrectionJoint: null,
};

describe("useReportStore", () => {
  beforeEach(() => {
    useReportStore.getState().reset();
  });

  it("should start in idle state", () => {
    const state = useReportStore.getState();
    expect(state.status).toBe("idle");
    expect(state.reportData).toBeNull();
    expect(state.reportHtml).toBeNull();
    expect(state.fileName).toBeNull();
    expect(state.errorMessage).toBeNull();
  });

  it("should transition to ready after generateReport", () => {
    useReportStore.getState().generateReport(mockAnalysis, mockPatient);
    const state = useReportStore.getState();
    expect(state.status).toBe("ready");
    expect(state.reportData).not.toBeNull();
    expect(state.reportHtml).not.toBeNull();
    expect(state.fileName).toBe("JeanDupont_AnalyseMarche_2026-03-19.pdf");
  });

  it("should include MDR disclaimer in report data", () => {
    useReportStore.getState().generateReport(mockAnalysis, mockPatient);
    const state = useReportStore.getState();
    expect(state.reportData?.disclaimer).toBe(LEGAL_CONSTANTS.mdrDisclaimer);
  });

  it("should include HTML with patient name", () => {
    useReportStore.getState().generateReport(mockAnalysis, mockPatient);
    const state = useReportStore.getState();
    expect(state.reportHtml).toContain("Jean Dupont");
  });

  it("should reset to idle state", () => {
    useReportStore.getState().generateReport(mockAnalysis, mockPatient);
    expect(useReportStore.getState().status).toBe("ready");

    useReportStore.getState().reset();
    const state = useReportStore.getState();
    expect(state.status).toBe("idle");
    expect(state.reportData).toBeNull();
    expect(state.reportHtml).toBeNull();
    expect(state.fileName).toBeNull();
  });
});
