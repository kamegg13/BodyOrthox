import type { Analysis } from "../../capture/domain/analysis";
import {
  calculateBilateralAngles,
  type BilateralAngles,
} from "../../capture/data/angle-calculator";
import { getActiveCalibrationModel } from "../../capture/calibration/calibration-store";
import {
  applyCalibrationToBilateral,
  applyCalibrationForSide,
} from "../../capture/calibration/apply-calibration";
import type { Side } from "../../capture/calibration/calibration-types";

type JointKey = "knee" | "hip" | "ankle";

const ANGLE_FIELD: Record<JointKey, keyof BilateralAngles["left"]> = {
  knee: "kneeAngle",
  hip: "hipAngle",
  ankle: "ankleAngle",
};

/** The side the single-value scalar angles / primary HKA are read from. */
function primarySide(bilateral: BilateralAngles): Side {
  return bilateral.rightHKA > 0 ? "right" : "left";
}

/**
 * Recompute bilateral angles so the HKA card and the PDF stay consistent with a
 * manual correction. The corrected value is a RAW angle (same space as
 * `analysis.angles`), while the stored HKA is calibrated — so we rebuild the raw
 * bilateral, apply the correction on the measured side, then re-apply the active
 * calibration exactly once, mirroring the capture pipeline (`bilateralFrom`).
 *
 * The knee angle IS the HKA (hip-knee-ankle mechanical-axis proxy), so a knee
 * correction also updates the side's HKA; a hip/ankle correction leaves it
 * untouched. Returns `undefined` when there is no measurement basis — we never
 * fabricate an angle.
 */
export function bilateralWithCorrection(
  analysis: Analysis,
  joint: JointKey,
  correctedAngle: number,
): BilateralAngles | undefined {
  const field = ANGLE_FIELD[joint];
  const model = getActiveCalibrationModel();

  // Preferred path: rebuild the raw bilateral from the landmarks, override the
  // corrected joint, then calibrate once (never double-applies calibration).
  if (analysis.allLandmarks) {
    const raw = calculateBilateralAngles(analysis.allLandmarks);
    const side = primarySide(raw);
    const overridden: BilateralAngles = {
      ...raw,
      [side]: { ...raw[side], [field]: correctedAngle },
      ...(joint === "knee"
        ? { [side === "right" ? "rightHKA" : "leftHKA"]: correctedAngle }
        : {}),
    };
    return model ? applyCalibrationToBilateral(overridden, model) : overridden;
  }

  // Fallback when landmarks are unavailable: override the stored (already
  // calibrated) bilateral, calibrating only the corrected value.
  const base = analysis.bilateralAngles;
  if (!base) return undefined;
  const side = primarySide(base);
  const calibratedHKA = model
    ? applyCalibrationForSide(correctedAngle, side, model)
    : correctedAngle;
  return {
    ...base,
    [side]: { ...base[side], [field]: correctedAngle },
    ...(joint === "knee"
      ? { [side === "right" ? "rightHKA" : "leftHKA"]: calibratedHKA }
      : {}),
  };
}
