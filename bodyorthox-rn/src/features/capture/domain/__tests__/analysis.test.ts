import { createAnalysis, confidenceLabel } from "../analysis";

jest.mock("../../../../shared/utils/generate-id", () => ({
  generateId: () => "mock-analysis-id",
}));

const validAngles = { kneeAngle: 175.5, hipAngle: 178.0, ankleAngle: 90.5 };

describe("createAnalysis", () => {
  it("creates analysis with valid input", () => {
    const analysis = createAnalysis({
      patientId: "patient-1",
      angles: validAngles,
      confidenceScore: 0.92,
    });

    expect(analysis.id).toBe("mock-analysis-id");
    expect(analysis.patientId).toBe("patient-1");
    expect(analysis.angles.kneeAngle).toBeCloseTo(175.5, 1);
    expect(analysis.angles.hipAngle).toBeCloseTo(178.0, 1);
    expect(analysis.angles.ankleAngle).toBeCloseTo(90.5, 1);
    expect(analysis.confidenceScore).toBe(0.92);
    expect(analysis.manualCorrectionApplied).toBe(false);
    expect(analysis.manualCorrectionJoint).toBeNull();
  });

  it("rounds angles to 1 decimal place", () => {
    const analysis = createAnalysis({
      patientId: "p1",
      angles: { kneeAngle: 175.55, hipAngle: 178.123, ankleAngle: 90.456 },
      confidenceScore: 0.9,
    });

    expect(analysis.angles.kneeAngle).toBe(175.6);
    expect(analysis.angles.hipAngle).toBe(178.1);
    expect(analysis.angles.ankleAngle).toBe(90.5);
  });

  it("throws if patientId is empty", () => {
    expect(() =>
      createAnalysis({
        patientId: "",
        angles: validAngles,
        confidenceScore: 0.9,
      }),
    ).toThrow();
  });

  it("throws if confidenceScore is below 0", () => {
    expect(() =>
      createAnalysis({
        patientId: "p1",
        angles: validAngles,
        confidenceScore: -0.1,
      }),
    ).toThrow();
  });

  it("throws if confidenceScore is above 1", () => {
    expect(() =>
      createAnalysis({
        patientId: "p1",
        angles: validAngles,
        confidenceScore: 1.1,
      }),
    ).toThrow();
  });

  it("handles manual correction fields", () => {
    const analysis = createAnalysis({
      patientId: "p1",
      angles: validAngles,
      confidenceScore: 0.85,
      manualCorrectionApplied: true,
      manualCorrectionJoint: "knee",
    });

    expect(analysis.manualCorrectionApplied).toBe(true);
    expect(analysis.manualCorrectionJoint).toBe("knee");
  });

  it("createdAt is a valid ISO string", () => {
    const analysis = createAnalysis({
      patientId: "p1",
      angles: validAngles,
      confidenceScore: 0.8,
    });
    expect(() => new Date(analysis.createdAt)).not.toThrow();
  });

  it("accepts boundary values for confidence (0 and 1)", () => {
    expect(() =>
      createAnalysis({
        patientId: "p1",
        angles: validAngles,
        confidenceScore: 0,
      }),
    ).not.toThrow();
    expect(() =>
      createAnalysis({
        patientId: "p1",
        angles: validAngles,
        confidenceScore: 1,
      }),
    ).not.toThrow();
  });
});

describe("confidenceLabel", () => {
  it('returns "Élevée" for score >= 0.85', () => {
    expect(confidenceLabel(0.85)).toBe("Élevée");
    expect(confidenceLabel(0.99)).toBe("Élevée");
    expect(confidenceLabel(1.0)).toBe("Élevée");
  });

  it('returns "Moyenne" for score >= 0.60 and < 0.85', () => {
    expect(confidenceLabel(0.6)).toBe("Moyenne");
    expect(confidenceLabel(0.75)).toBe("Moyenne");
    expect(confidenceLabel(0.84)).toBe("Moyenne");
  });

  it('returns "Faible" for score < 0.60', () => {
    expect(confidenceLabel(0.0)).toBe("Faible");
    expect(confidenceLabel(0.5)).toBe("Faible");
    expect(confidenceLabel(0.59)).toBe("Faible");
  });
});
