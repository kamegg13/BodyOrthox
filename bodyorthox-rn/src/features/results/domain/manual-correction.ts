import type { Analysis } from "../../capture/domain/analysis";

type JointKey = "knee" | "hip" | "ankle";

const JOINT_LABELS: Record<JointKey, string> = {
  knee: "Genou",
  hip: "Hanche",
  ankle: "Cheville",
};

const ANGLE_FIELD_MAP: Record<
  JointKey,
  "kneeAngle" | "hipAngle" | "ankleAngle"
> = {
  knee: "kneeAngle",
  hip: "hipAngle",
  ankle: "ankleAngle",
};

export interface ValidationResult {
  readonly valid: boolean;
  readonly error: string | null;
}

/**
 * Validates that a correction angle is a finite number between 0 and 360.
 */
export function validateCorrectionAngle(angle: number): ValidationResult {
  if (typeof angle !== "number" || isNaN(angle)) {
    return {
      valid: false,
      error: "L'angle corrigé doit être un nombre valide.",
    };
  }
  if (angle < 0 || angle > 360) {
    return {
      valid: false,
      error: "L'angle corrigé doit être entre 0 et 360 degrés.",
    };
  }
  return { valid: true, error: null };
}

/**
 * Returns a NEW Analysis with the corrected angle for the given joint.
 * The original Analysis is NOT mutated (immutable pattern).
 *
 * @throws if the angle is not a valid number or out of range [0, 360].
 */
export function updateAnalysisWithCorrection(
  analysis: Analysis,
  joint: JointKey,
  newAngle: number,
): Analysis {
  if (typeof newAngle !== "number" || isNaN(newAngle)) {
    throw new Error("L'angle corrigé doit être un nombre valide.");
  }
  if (newAngle < 0 || newAngle > 360) {
    throw new Error("L'angle corrigé doit être entre 0 et 360 degrés.");
  }

  const roundedAngle = Math.round(newAngle * 10) / 10;
  const angleField = ANGLE_FIELD_MAP[joint];

  return {
    ...analysis,
    angles: {
      ...analysis.angles,
      [angleField]: roundedAngle,
    },
    manualCorrectionApplied: true,
    manualCorrectionJoint: joint,
  };
}

/**
 * Returns the disclaimer text for a manually corrected joint.
 * Used when generating PDF reports (AC5).
 */
export function correctionDisclaimer(joint: JointKey): string {
  const label = JOINT_LABELS[joint];
  return `Données ${label} : estimées — vérification manuelle effectuée.`;
}

/**
 * Determines whether a joint has low confidence (< 0.60 threshold).
 */
export function isLowConfidence(score: number): boolean {
  return score < 0.6;
}
