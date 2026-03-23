/**
 * Anatomical validation of detected pose landmarks.
 *
 * Checks that detected joint positions form a plausible human anatomy:
 * - Femur/tibia length ratio within normal range
 * - Knee located vertically between hip and ankle
 * - Left/right leg symmetry
 */

import type { PoseLandmarks, Landmark } from "./angle-calculator";

export interface AnatomicalValidation {
  readonly isPlausible: boolean;
  readonly warnings: readonly string[];
  readonly femurTibiaRatio: number;
  readonly symmetryScore: number;
}

/** Normal range for femur/tibia length ratio */
const FEMUR_TIBIA_RATIO_MIN = 0.7;
const FEMUR_TIBIA_RATIO_MAX = 1.5;

/** Minimum visibility to consider a landmark usable for validation */
const MIN_VALIDATION_VISIBILITY = 0.3;

/**
 * Euclidean distance between two landmarks (2D).
 */
function distance2D(a: Landmark, b: Landmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Check if a landmark is visible enough for validation.
 */
function isVisible(lm: Landmark | undefined): lm is Landmark {
  return lm !== undefined && (lm.visibility ?? 0) >= MIN_VALIDATION_VISIBILITY;
}

/**
 * Compute the femur/tibia ratio for one leg.
 * Returns null if landmarks are not sufficiently visible.
 *
 * @param hipIdx - Hip landmark index (23 left, 24 right)
 * @param kneeIdx - Knee landmark index (25 left, 26 right)
 * @param ankleIdx - Ankle landmark index (27 left, 28 right)
 */
function legFemurTibiaRatio(
  landmarks: PoseLandmarks,
  hipIdx: number,
  kneeIdx: number,
  ankleIdx: number,
): number | null {
  const hip = landmarks[hipIdx];
  const knee = landmarks[kneeIdx];
  const ankle = landmarks[ankleIdx];

  if (!isVisible(hip) || !isVisible(knee) || !isVisible(ankle)) return null;

  const femur = distance2D(hip, knee);
  const tibia = distance2D(knee, ankle);

  if (tibia === 0) return null;

  return femur / tibia;
}

/**
 * Check that the knee is vertically between the hip and ankle.
 * In normalized coordinates, y increases downward, so:
 * hip.y < knee.y < ankle.y (roughly).
 *
 * Returns true if the ordering is plausible, false otherwise.
 */
function isKneeBetweenHipAndAnkle(
  landmarks: PoseLandmarks,
  hipIdx: number,
  kneeIdx: number,
  ankleIdx: number,
): boolean | null {
  const hip = landmarks[hipIdx];
  const knee = landmarks[kneeIdx];
  const ankle = landmarks[ankleIdx];

  if (!isVisible(hip) || !isVisible(knee) || !isVisible(ankle)) return null;

  const minY = Math.min(hip.y, ankle.y);
  const maxY = Math.max(hip.y, ankle.y);

  return knee.y >= minY && knee.y <= maxY;
}

/**
 * Compute a symmetry score between left and right legs.
 * 1.0 = perfect symmetry, 0.0 = completely asymmetric.
 * Based on ratio of leg lengths (hip-to-ankle distance).
 */
function computeSymmetryScore(landmarks: PoseLandmarks): number {
  const leftHip = landmarks[23];
  const leftAnkle = landmarks[27];
  const rightHip = landmarks[24];
  const rightAnkle = landmarks[28];

  if (
    !isVisible(leftHip) ||
    !isVisible(leftAnkle) ||
    !isVisible(rightHip) ||
    !isVisible(rightAnkle)
  ) {
    return 1.0; // Cannot assess — assume symmetric
  }

  const leftLen = distance2D(leftHip, leftAnkle);
  const rightLen = distance2D(rightHip, rightAnkle);

  if (leftLen === 0 && rightLen === 0) return 1.0;

  const maxLen = Math.max(leftLen, rightLen);
  if (maxLen === 0) return 1.0;

  const minLen = Math.min(leftLen, rightLen);
  return minLen / maxLen;
}

/**
 * Validate that detected landmarks form a plausible human anatomy.
 *
 * Checks:
 * 1. Femur/tibia ratio within [0.7, 1.5] for each visible leg
 * 2. Knee positioned vertically between hip and ankle
 * 3. Symmetry between left and right legs
 */
export function validateAnatomicalProportions(
  landmarks: PoseLandmarks,
): AnatomicalValidation {
  const warnings: string[] = [];

  // Femur/tibia ratio checks
  const leftRatio = legFemurTibiaRatio(landmarks, 23, 25, 27);
  const rightRatio = legFemurTibiaRatio(landmarks, 24, 26, 28);

  // Use average of available ratios, or 1.0 as default
  const ratios = [leftRatio, rightRatio].filter((r): r is number => r !== null);
  const femurTibiaRatio =
    ratios.length > 0
      ? ratios.reduce((sum, r) => sum + r, 0) / ratios.length
      : 1.0;

  if (leftRatio !== null) {
    if (
      leftRatio < FEMUR_TIBIA_RATIO_MIN ||
      leftRatio > FEMUR_TIBIA_RATIO_MAX
    ) {
      warnings.push(
        `Rapport fémur/tibia gauche anormal (${leftRatio.toFixed(2)}). Vérifiez le positionnement du patient.`,
      );
    }
  }

  if (rightRatio !== null) {
    if (
      rightRatio < FEMUR_TIBIA_RATIO_MIN ||
      rightRatio > FEMUR_TIBIA_RATIO_MAX
    ) {
      warnings.push(
        `Rapport fémur/tibia droit anormal (${rightRatio.toFixed(2)}). Vérifiez le positionnement du patient.`,
      );
    }
  }

  // Knee vertical position checks
  const leftKneeOk = isKneeBetweenHipAndAnkle(landmarks, 23, 25, 27);
  const rightKneeOk = isKneeBetweenHipAndAnkle(landmarks, 24, 26, 28);

  if (leftKneeOk === false) {
    warnings.push(
      "Le genou gauche semble mal positionné par rapport à la hanche et la cheville.",
    );
  }
  if (rightKneeOk === false) {
    warnings.push(
      "Le genou droit semble mal positionné par rapport à la hanche et la cheville.",
    );
  }

  // Symmetry check
  const symmetryScore = computeSymmetryScore(landmarks);
  if (symmetryScore < 0.7) {
    warnings.push(
      `Asymétrie importante détectée entre les jambes (score: ${(symmetryScore * 100).toFixed(0)}%). Vérifiez que le patient est bien de face.`,
    );
  }

  return {
    isPlausible: warnings.length === 0,
    warnings,
    femurTibiaRatio,
    symmetryScore,
  };
}
