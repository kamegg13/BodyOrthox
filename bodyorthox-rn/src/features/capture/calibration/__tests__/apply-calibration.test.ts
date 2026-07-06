import {
  applyLinear,
  applyCalibration,
  applyCalibrationToBilateral,
  applyCalibrationForSide,
} from "../apply-calibration";
import type { CalibrationModel, SideModel } from "../calibration-types";
import type { BilateralAngles } from "../../data/angle-calculator";

const sideModel = (a: number, b: number): SideModel => ({
  kind: "linear",
  coefficients: { a, b },
  n: 10,
});

const model: CalibrationModel = {
  version: 1,
  createdAt: "2026-06-06T00:00:00.000Z",
  left: sideModel(1, -3),
  right: sideModel(1, -2),
};

describe("applyLinear", () => {
  it("applies a*x + b", () => {
    expect(applyLinear(180, { a: 1.2, b: -36 })).toBeCloseTo(180, 9);
  });
});

describe("applyCalibration", () => {
  it("corrects a non-zero prediction", () => {
    expect(applyCalibration(180, sideModel(1, -3))).toBeCloseTo(177, 9);
  });
  it("passes 0 (unavailable) through untouched", () => {
    expect(applyCalibration(0, sideModel(1, -3))).toBe(0);
  });
});

describe("applyCalibrationToBilateral", () => {
  const bilateral: BilateralAngles = {
    left: { kneeAngle: 178, hipAngle: 175, ankleAngle: 90 },
    right: { kneeAngle: 179, hipAngle: 176, ankleAngle: 91 },
    leftHKA: 178,
    rightHKA: 179,
  };

  it("corrects both HKA values and rounds to 1 decimal", () => {
    const out = applyCalibrationToBilateral(bilateral, model);
    expect(out.leftHKA).toBe(175); // 178 - 3
    expect(out.rightHKA).toBe(177); // 179 - 2
  });

  it("does not mutate the input (immutability)", () => {
    applyCalibrationToBilateral(bilateral, model);
    expect(bilateral.leftHKA).toBe(178);
    expect(bilateral.rightHKA).toBe(179);
  });

  it("leaves per-joint angles untouched", () => {
    const out = applyCalibrationToBilateral(bilateral, model);
    expect(out.left).toEqual(bilateral.left);
  });

  it("keeps an unavailable HKA (0) as unavailable", () => {
    const out = applyCalibrationToBilateral(
      { ...bilateral, leftHKA: 0 },
      model,
    );
    expect(out.leftHKA).toBe(0);
  });
});

describe("applyCalibrationForSide", () => {
  it("dispatches on side", () => {
    expect(applyCalibrationForSide(180, "left", model)).toBe(177);
    expect(applyCalibrationForSide(180, "right", model)).toBe(178);
  });
});
