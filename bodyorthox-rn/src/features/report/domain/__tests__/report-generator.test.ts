import { Analysis } from "../../../capture/domain/analysis";
import { Patient } from "../../../patients/domain/patient";
import { LEGAL_CONSTANTS } from "../../../../core/legal/legal-constants";
import {
  generateReportFileName,
  buildReportData,
  generateReportHtml,
  generateInterpretation,
} from "../report-generator";
import type { BilateralAngles } from "../../../capture/data/angle-calculator";

// ─── Fixtures ─────────────────────────────────────────────────

const mockPatient: Patient = {
  id: "patient-1",
  name: "Jean Dupont",
  dateOfBirth: "1985-06-15",
  morphologicalProfile: null,
  createdAt: "2026-03-19T10:00:00.000Z",
};

const mockBilateral: BilateralAngles = {
  leftHKA: 176.2,
  rightHKA: 177.5,
  left: { kneeAngle: 176.2, hipAngle: 175.0, ankleAngle: 174.5 },
  right: { kneeAngle: 177.5, hipAngle: 176.0, ankleAngle: 175.0 },
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
  bilateralAngles: mockBilateral,
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
    expect(result).toBe("JeanDupont_AnalyseHKA_2026-03-19.pdf");
  });

  it("should handle single-word names", () => {
    const result = generateReportFileName("Marie", "2026-01-01");
    expect(result).toBe("Marie_AnalyseHKA_2026-01-01.pdf");
  });

  it("should handle multiple spaces in names", () => {
    const result = generateReportFileName("Jean Pierre Dupont", "2026-06-15");
    expect(result).toBe("JeanPierreDupont_AnalyseHKA_2026-06-15.pdf");
  });

  it("should truncate ISO date to YYYY-MM-DD", () => {
    const result = generateReportFileName("Test", "2026-03-19T14:30:00.000Z");
    expect(result).toBe("Test_AnalyseHKA_2026-03-19.pdf");
  });
});

// ─── buildReportData ─────────────────────────────────────────

describe("buildReportData", () => {
  it("should include patient name", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    expect(data.patientName).toBe("Jean Dupont");
  });

  it("should include analysis date", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    expect(data.analysisDate).toBe("2026-03-19T14:30:00.000Z");
  });

  it("should include bilateral angles when present", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    expect(data.bilateral).toBeDefined();
    expect(data.bilateral?.leftHKA).toBe(176.2);
    expect(data.bilateral?.rightHKA).toBe(177.5);
  });

  it("should set bilateral to undefined when not in analysis", () => {
    const analysisNoBilateral: Analysis = {
      ...mockAnalysis,
      bilateralAngles: undefined,
    };
    const data = buildReportData(analysisNoBilateral, mockPatient);
    expect(data.bilateral).toBeUndefined();
  });

  it("should include EU MDR disclaimer from LEGAL_CONSTANTS", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    expect(data.disclaimer).toBe(LEGAL_CONSTANTS.mdrDisclaimer);
  });

  it("should include notes when provided", () => {
    const data = buildReportData(mockAnalysis, mockPatient, {
      notes: "Suivi recommandé",
    });
    expect(data.notes).toBe("Suivi recommandé");
  });

  it("should trim and omit empty notes", () => {
    const data = buildReportData(mockAnalysis, mockPatient, { notes: "   " });
    expect(data.notes).toBeUndefined();
  });
});

// ─── generateInterpretation ──────────────────────────────────

describe("generateInterpretation", () => {
  it("should return fallback message when bilateral is undefined", () => {
    const result = generateInterpretation(undefined);
    expect(result).toContain("Aucune donnée angulaire");
  });

  it("should mention normal alignment for HKA in range", () => {
    const result = generateInterpretation(mockBilateral);
    expect(result).toContain("limites physiologiques");
  });

  it("should detect genu varum for HKA < 175", () => {
    const abnormal: BilateralAngles = {
      leftHKA: 170,
      rightHKA: 172,
      left: { kneeAngle: 170, hipAngle: 170, ankleAngle: 170 },
      right: { kneeAngle: 172, hipAngle: 172, ankleAngle: 172 },
    };
    const result = generateInterpretation(abnormal);
    expect(result.toLowerCase()).toContain("genu varum");
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
    expect(html).toContain("177.5");
  });

  it("should include the MDR disclaimer", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    const html = generateReportHtml(data);
    expect(html).toContain(LEGAL_CONSTANTS.mdrDisclaimer);
  });

  it("should include clinic name", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    const html = generateReportHtml(data);
    expect(html).toContain("Antidote Sport");
  });

  it("should include notes when provided", () => {
    const data = buildReportData(mockAnalysis, mockPatient, {
      notes: "Suivi recommandé dans 3 mois",
    });
    const html = generateReportHtml(data);
    expect(html).toContain("Suivi recommandé dans 3 mois");
  });

  it("should NOT include notes section when notes are absent", () => {
    const data = buildReportData(mockAnalysis, mockPatient);
    const html = generateReportHtml(data);
    expect(html).not.toContain("Notes cliniques");
  });
});
