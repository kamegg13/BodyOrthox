/**
 * Apply a fitted calibration model in the inference path.
 */

import type {
  BilateralAngles,
  SidedAngles,
} from "../data/angle-calculator";
import { sideModelFor } from "./fit-calibration";
import type {
  CalibrationModel,
  LinearCoefficients,
  Side,
  SideModel,
} from "./calibration-types";

/** Apply a side model's line to a single predicted HKA value. */
export function applyLinear(
  predictedHKA: number,
  coefficients: LinearCoefficients,
): number {
  return coefficients.a * predictedHKA + coefficients.b;
}

/**
 * Correct a predicted HKA for one side.
 *
 * A predicted value of 0 means "unavailable" upstream (missing landmarks);
 * we pass it through untouched so calibration never invents an angle.
 */
export function applyCalibration(
  predictedHKA: number,
  sideModel: SideModel,
): number {
  if (predictedHKA === 0) return 0;
  return applyLinear(predictedHKA, sideModel.coefficients);
}

/** Round to one decimal, matching the precision used across the app. */
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/**
 * Apply calibration to a bilateral result, correcting `leftHKA` / `rightHKA`.
 *
 * Returns a NEW object (immutable). The per-joint angles are left as-is — the
 * calibration is fitted on the HKA mechanical-axis proxy only.
 */
export function applyCalibrationToBilateral(
  bilateral: BilateralAngles,
  model: CalibrationModel,
): BilateralAngles {
  return {
    ...bilateral,
    leftHKA: round1(applyCalibration(bilateral.leftHKA, model.left)),
    rightHKA: round1(applyCalibration(bilateral.rightHKA, model.right)),
  };
}

/** Correct a single HKA given the model and the side it belongs to. */
export function applyCalibrationForSide(
  predictedHKA: number,
  side: Side,
  model: CalibrationModel,
): number {
  return round1(applyCalibration(predictedHKA, sideModelFor(model, side)));
}

// Re-export for callers that only need the angle types nearby.
export type { SidedAngles };
