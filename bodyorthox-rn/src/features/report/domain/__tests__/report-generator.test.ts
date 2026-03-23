import { Analysis } from "../../../capture/domain/analysis";
import { Patient } from "../../../patients/domain/patient";
import { LEGAL_CONSTANTS } from "../../../../core/legal/legal-constants";
import {
  generateReportFileName,
  buildReportData,
  generateReportHtml,
} from "../report-generator";

// ─── Fixtures ─────────────────────────────────────────────────

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
  angles: {
    kneeAngle: 176.2,
    hipAngle: 175.0,
    ankleAngle: 174.5,
  },
  confidenceScore: 0.92,
  manualCorrectionApplied: false,
  manualCorrectionJoint: null,
};

const mockAnalysisWithCorrection: Analysis = {
  ...mockAnalysis,
  id: "analysis-2",
  manualCorrectionApplied: true,
  manualCorrectionJoint: "knee",
};

// ─── generateReportFileName ──────────────────────────────────

describe("generateReportFileName", () => {
  it("should return correct filename with spaces removed from patient name", () => {
    const result = generateReportFileName(
      "Jean Dupont",
      "2026-03-19T14:30:00.000Z",
    );
    expect(result).toBe("JeanDupont_AnalyseMarche_2026-03-19.pdf");
  });

  it("should handle single-word names", () => {
    const result = generateReportFileName("Marie", "2026-01-01");
    expect(result).toBe("Marie_AnalyseMarche_2026-01-01.pdf");
  });

  it("should handle multiple spaces in names", () => {
    const result = generateReportFileName("Jean Pierre Dupont", "2026-06-15");
    expect(result).toBe("JeanPierreDupont_AnalyseMarche_2026-06-15.pdf");
  });

  it("should truncate ISO date to YYYY-MM-DD", () => {
    const result = generateReportFileName("Test", "2026-03-19T14:30:00.000Z");
    expect(result).toBe("Test_AnalyseMarche_2026-03-19.pdf");
  });
});

// ─── buildReportData ─────────────────────────────────────────

describe("buildReportData", () => {
  it("should include patient metadata", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    expect(data.metadata.patientName).toBe("Jean Dupont");
    expect(data.metadata.analysisDate).toBe("2026-03-19T14:30:00.000Z");
    expect(data.metadata.confidenceLevel).toBe("Élevée");
  });

  it("should include device info in metadata", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    expect(data.metadata.device).toBeDefined();
    expect(data.metadata.device.length).toBeGreaterThan(0);
  });

  it("should include practitioner view with all 3 angles", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    expect(data.practitionerView.angles).toHaveLength(3);

    const joints = data.practitionerView.angles.map((a) => a.joint);
    expect(joints).toEqual(["knee", "hip", "ankle"]);
  });

  it("should assess each angle against norms", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    const knee = data.practitionerView.angles[0];
    expect(knee.value).toBe(176.2);
    expect(knee.isWithinNorm).toBe(true);
    expect(knee.label).toBe("Genou");
  });

  it("should flag out-of-norm angles", () => {
    const abnormalAnalysis: Analysis = {
      ...mockAnalysis,
      angles: { kneeAngle: 160, hipAngle: 150, ankleAngle: 160 },
    };
    const data = buildReportData(abnormalAnalysis, mockPatient);
    expect(data.practitionerView.angles[0].isWithinNorm).toBe(false);
    expect(data.practitionerView.angles[1].isWithinNorm).toBe(false);
    expect(data.practitionerView.angles[2].isWithinNorm).toBe(false);
  });

  it("should include detailed view with confidence data", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    expect(data.detailedView.confidenceScore).toBe(0.92);
    expect(data.detailedView.confidencePercent).toBe("92%");
    expect(data.detailedView.confidenceLabel).toBe("Élevée");
    expect(data.detailedView.analysisId).toBe("analysis-1");
  });

  it("should set manualCorrectionDisclaimer to null when no correction", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    expect(data.detailedView.manualCorrectionApplied).toBe(false);
    expect(data.detailedView.manualCorrectionDisclaimer).toBeNull();
  });

  it("should include manual correction disclaimer when correction applied", () => {
    const data = buildReportData(mockAnalysisWithCorrection, mockPatient);
    expect(data.detailedView.manualCorrectionApplied).toBe(true);
    expect(data.detailedView.manualCorrectionDisclaimer).toBe(
      "Donnees Genou : estimees — verification manuelle effectuee.",
    );
  });

  it("should include EU MDR disclaimer from LEGAL_CONSTANTS", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    expect(data.disclaimer).toBe(LEGAL_CONSTANTS.mdrDisclaimer);
  });
});

// ─── generateReportHtml ──────────────────────────────────────

describe("generateReportHtml", () => {
  it("should generate valid HTML with DOCTYPE", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    const html = generateReportHtml(data);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  it("should include patient name in HTML", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    const html = generateReportHtml(data);
    expect(html).toContain("Jean Dupont");
  });

  it("should include all angle values", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    const html = generateReportHtml(data);
    expect(html).toContain("176.2");
    expect(html).toContain("175");
    expect(html).toContain("174.5");
  });

  it("should include the MDR disclaimer", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    const html = generateReportHtml(data);
    expect(html).toContain(LEGAL_CONSTANTS.mdrDisclaimer);
  });

  it("should include confidence percent", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    const html = generateReportHtml(data);
    expect(html).toContain("92%");
  });

  it("should include correction note when correction applied", () => {
    const data = buildReportData(mockAnalysisWithCorrection, mockPatient);
    const html = generateReportHtml(data);
    expect(html).toContain("verification manuelle effectuee");
  });

  it("should NOT include correction note when no correction", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    const html = generateReportHtml(data);
    expect(html).not.toContain('<p class="correction-note">');
  });
});
