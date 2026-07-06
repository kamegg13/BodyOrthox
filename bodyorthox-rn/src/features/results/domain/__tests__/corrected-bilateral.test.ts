import { bilateralWithCorrection } from "../corrected-bilateral";
import { __resetCalibrationStoreForTests } from "../../../capture/calibration/calibration-store";
import { calculateBilateralAngles } from "../../../capture/data/angle-calculator";
import type { Analysis } from "../../../capture/domain/analysis";
import type {
  BilateralAngles,
  PoseLandmarks,
} from "../../../capture/data/angle-calculator";

// Right leg reliable (visibility 1) → right side is the "primary" side.
// Left leg missing → its angles stay 0 (unavailable).
function rightLegLandmarks(): PoseLandmarks {
  const v = (x: number, y: number) => ({ x, y, visibility: 1 });
  return {
    12: v(0, -1), // right_shoulder
    24: v(0, 0), // right_hip
    26: v(0, 1), // right_knee
    28: v(0.05, 2), // right_ankle
    30: v(0.2, 2.1), // right_heel
  };
}

function buildAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    id: "a1",
    patientId: "p1",
    createdAt: "2026-03-15T10:30:00.000Z",
    angles: { kneeAngle: 5.2, hipAngle: 175, ankleAngle: 88.5 },
    confidenceScore: 0.5,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
    ...overrides,
  };
}

describe("bilateralWithCorrection", () => {
  beforeEach(() => {
    __resetCalibrationStoreForTests();
  });

  it("returns undefined when there is no measurement basis", () => {
    const analysis = buildAnalysis(); // no landmarks, no bilateralAngles
    expect(bilateralWithCorrection(analysis, "knee", 7.5)).toBeUndefined();
  });

  it("reflects a knee correction in the measured side's HKA (from landmarks)", () => {
    const analysis = buildAnalysis({ allLandmarks: rightLegLandmarks() });

    const result = bilateralWithCorrection(analysis, "knee", 176.4);

    expect(result).toBeDefined();
    // Right side is primary (reliable) → both its kneeAngle and HKA follow.
    expect(result!.right.kneeAngle).toBe(176.4);
    expect(result!.rightHKA).toBe(176.4);
    // The other side is left untouched (unavailable).
    expect(result!.leftHKA).toBe(0);
  });

  it("does not change HKA for a hip/ankle correction", () => {
    const landmarks = rightLegLandmarks();
    const analysis = buildAnalysis({ allLandmarks: landmarks });
    const rawHKA = calculateBilateralAngles(landmarks).rightHKA;

    const result = bilateralWithCorrection(analysis, "hip", 160)!;

    expect(result.right.hipAngle).toBe(160);
    // HKA is the knee-based mechanical axis — a hip correction leaves it as measured.
    expect(result.rightHKA).toBe(rawHKA);
  });

  it("falls back to the stored bilateral when landmarks are absent", () => {
    const stored: BilateralAngles = {
      left: { kneeAngle: 0, hipAngle: 0, ankleAngle: 0 },
      right: { kneeAngle: 170, hipAngle: 172, ankleAngle: 90 },
      leftHKA: 0,
      rightHKA: 170,
    };
    const analysis = buildAnalysis({ bilateralAngles: stored });

    const result = bilateralWithCorrection(analysis, "knee", 178.2)!;

    expect(result.right.kneeAngle).toBe(178.2);
    expect(result.rightHKA).toBe(178.2);
  });

  it("never mutates the input analysis", () => {
    const analysis = buildAnalysis({ allLandmarks: rightLegLandmarks() });
    const snapshot = JSON.parse(JSON.stringify(analysis));

    bilateralWithCorrection(analysis, "knee", 42);

    expect(analysis).toEqual(snapshot);
  });
});
