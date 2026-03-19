import {
  updateAnalysisWithCorrection,
  correctionDisclaimer,
  validateCorrectionAngle,
} from "../manual-correction";
import type { Analysis } from "../../../capture/domain/analysis";

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
    confidenceScore: 0.45,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// T1.1 — updateAnalysisWithCorrection returns a new Analysis with correction
// ---------------------------------------------------------------------------
describe("updateAnalysisWithCorrection", () => {
  it("returns a new Analysis with manualCorrectionApplied: true", () => {
    const original = buildAnalysis();
    const corrected = updateAnalysisWithCorrection(original, "knee", 6.0);

    expect(corrected.manualCorrectionApplied).toBe(true);
    expect(corrected.manualCorrectionJoint).toBe("knee");
  });

  it("updates the correct joint angle (knee)", () => {
    const original = buildAnalysis();
    const corrected = updateAnalysisWithCorrection(original, "knee", 7.3);

    expect(corrected.angles.kneeAngle).toBe(7.3);
    // Other angles unchanged
    expect(corrected.angles.hipAngle).toBe(175.0);
    expect(corrected.angles.ankleAngle).toBe(88.5);
  });

  it("updates the correct joint angle (hip)", () => {
    const original = buildAnalysis();
    const corrected = updateAnalysisWithCorrection(original, "hip", 172.5);

    expect(corrected.angles.hipAngle).toBe(172.5);
    expect(corrected.angles.kneeAngle).toBe(5.2);
    expect(corrected.angles.ankleAngle).toBe(88.5);
  });

  it("updates the correct joint angle (ankle)", () => {
    const original = buildAnalysis();
    const corrected = updateAnalysisWithCorrection(original, "ankle", 92.0);

    expect(corrected.angles.ankleAngle).toBe(92.0);
    expect(corrected.angles.kneeAngle).toBe(5.2);
    expect(corrected.angles.hipAngle).toBe(175.0);
  });

  it("rounds the corrected angle to 1 decimal place", () => {
    const original = buildAnalysis();
    const corrected = updateAnalysisWithCorrection(original, "knee", 7.347);

    expect(corrected.angles.kneeAngle).toBe(7.3);
  });

  it("preserves all non-angle fields", () => {
    const original = buildAnalysis();
    const corrected = updateAnalysisWithCorrection(original, "knee", 6.0);

    expect(corrected.id).toBe(original.id);
    expect(corrected.patientId).toBe(original.patientId);
    expect(corrected.createdAt).toBe(original.createdAt);
    expect(corrected.confidenceScore).toBe(original.confidenceScore);
  });

  // -------------------------------------------------------------------------
  // T1.2 — Immutability: original analysis is NOT mutated
  // -------------------------------------------------------------------------
  it("does NOT mutate the original analysis object", () => {
    const original = buildAnalysis();
    const originalCopy = JSON.parse(JSON.stringify(original));

    updateAnalysisWithCorrection(original, "knee", 10.0);

    expect(original).toEqual(originalCopy);
  });

  it("does NOT mutate the original angles object", () => {
    const original = buildAnalysis();
    const originalAngles = { ...original.angles };

    updateAnalysisWithCorrection(original, "hip", 160.0);

    expect(original.angles).toEqual(originalAngles);
  });

  // -------------------------------------------------------------------------
  // T1.3 — Validation: angle must be a valid number (0-360)
  // -------------------------------------------------------------------------
  it("throws for angle below 0", () => {
    const original = buildAnalysis();
    expect(() => updateAnalysisWithCorrection(original, "knee", -1)).toThrow(
      /angle corrigé doit être entre 0 et 360/i,
    );
  });

  it("throws for angle above 360", () => {
    const original = buildAnalysis();
    expect(() => updateAnalysisWithCorrection(original, "knee", 361)).toThrow(
      /angle corrigé doit être entre 0 et 360/i,
    );
  });

  it("throws for NaN angle", () => {
    const original = buildAnalysis();
    expect(() => updateAnalysisWithCorrection(original, "knee", NaN)).toThrow(
      /angle corrigé doit être un nombre valide/i,
    );
  });

  it("accepts boundary value 0", () => {
    const original = buildAnalysis();
    const corrected = updateAnalysisWithCorrection(original, "knee", 0);
    expect(corrected.angles.kneeAngle).toBe(0);
  });

  it("accepts boundary value 360", () => {
    const original = buildAnalysis();
    const corrected = updateAnalysisWithCorrection(original, "knee", 360);
    expect(corrected.angles.kneeAngle).toBe(360);
  });
});

// ---------------------------------------------------------------------------
// validateCorrectionAngle
// ---------------------------------------------------------------------------
describe("validateCorrectionAngle", () => {
  it("returns valid for a normal angle", () => {
    expect(validateCorrectionAngle(90)).toEqual({ valid: true, error: null });
  });

  it("returns invalid for NaN", () => {
    const result = validateCorrectionAngle(NaN);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("returns invalid for negative angle", () => {
    const result = validateCorrectionAngle(-5);
    expect(result.valid).toBe(false);
  });

  it("returns invalid for angle > 360", () => {
    const result = validateCorrectionAngle(400);
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T1.4 — correctionDisclaimer returns the correct text per joint
// ---------------------------------------------------------------------------
describe("correctionDisclaimer", () => {
  it("returns disclaimer for knee", () => {
    expect(correctionDisclaimer("knee")).toBe(
      "Données Genou : estimées — vérification manuelle effectuée.",
    );
  });

  it("returns disclaimer for hip", () => {
    expect(correctionDisclaimer("hip")).toBe(
      "Données Hanche : estimées — vérification manuelle effectuée.",
    );
  });

  it("returns disclaimer for ankle", () => {
    expect(correctionDisclaimer("ankle")).toBe(
      "Données Cheville : estimées — vérification manuelle effectuée.",
    );
  });
});
