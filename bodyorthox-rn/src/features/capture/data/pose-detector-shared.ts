/**
 * Pure functions shared between the web (MediaPipe WASM) and native
 * (TurboModule) pose detector implementations.
 *
 * Platform-neutral: no DOM, no @mediapipe/tasks-vision import (the web
 * NormalizedLandmark type is structurally compatible with LandmarkPoint).
 */

import type { PoseLandmarks } from "./angle-calculator";

/**
 * A single pose landmark in normalized coordinates.
 * Structurally compatible with MediaPipe's NormalizedLandmark.
 */
export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/** MediaPipe landmark indices relevant for orthopaedic analysis */
export const RELEVANT_INDICES = [11, 12, 23, 24, 25, 26, 27, 28, 29, 30] as const;

/** Minimum visibility below which a landmark is considered undetected */
export const MIN_VISIBILITY = 0.3;

/** User-facing message when no pose could be detected (single source of truth) */
export const NO_POSE_MESSAGE =
  "Aucune personne détectée. Assurez-vous que le patient est entièrement visible dans la photo.";

export class NoPoseDetectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoPoseDetectedError";
  }
}

/**
 * Convert MediaPipe landmarks (33 points) to our PoseLandmarks format,
 * keeping only the indices relevant for angle calculation.
 */
export function mediapipeToPoseLandmarks(
  mpLandmarks: LandmarkPoint[],
): PoseLandmarks {
  const result: PoseLandmarks = {};
  for (const i of RELEVANT_INDICES) {
    const lm = mpLandmarks[i];
    if (lm) {
      result[i] = {
        x: lm.x,
        y: lm.y,
        z: lm.z ?? 0,
        visibility: lm.visibility ?? 0,
      };
    }
  }
  return result;
}

/**
 * Convert ALL 33 MediaPipe landmarks to PoseLandmarks for full skeleton
 * visualization. This is separate from the angle-relevant subset.
 */
export function mediapipeToAllLandmarks(
  mpLandmarks: LandmarkPoint[],
): PoseLandmarks {
  const result: PoseLandmarks = {};
  for (let i = 0; i < mpLandmarks.length; i++) {
    const lm = mpLandmarks[i];
    if (lm) {
      result[i] = {
        x: lm.x,
        y: lm.y,
        z: lm.z ?? 0,
        visibility: lm.visibility ?? 0,
      };
    }
  }
  return result;
}

/**
 * Check whether the detected landmarks are usable (at least the key joints
 * have visibility above the minimum threshold).
 */
export function hasValidPose(landmarks: PoseLandmarks): boolean {
  // Must have at least hip, knee, and ankle on one side
  const requiredSets = [
    [23, 25, 27], // left side
    [24, 26, 28], // right side
  ];

  return requiredSets.some((indices) =>
    indices.every((i) => (landmarks[i]?.visibility ?? 0) >= MIN_VISIBILITY),
  );
}

/**
 * Fuse landmarks from two models by weighted average.
 * Weight = average visibility across all landmarks for that model.
 */
export function fuseMultiModelLandmarks(
  landmarksA: LandmarkPoint[],
  landmarksB: LandmarkPoint[],
): LandmarkPoint[] {
  const avgVisibility = (lms: LandmarkPoint[]): number => {
    if (lms.length === 0) return 0;
    let sum = 0;
    for (const lm of lms) {
      sum += lm.visibility ?? 0;
    }
    return sum / lms.length;
  };

  const weightA = avgVisibility(landmarksA);
  const weightB = avgVisibility(landmarksB);
  const totalWeight = weightA + weightB;

  if (totalWeight === 0) return landmarksA;

  const fused: LandmarkPoint[] = [];
  const count = Math.max(landmarksA.length, landmarksB.length);

  for (let i = 0; i < count; i++) {
    const a = landmarksA[i];
    const b = landmarksB[i];

    if (!a && !b) {
      fused.push({ x: 0, y: 0, z: 0, visibility: 0 });
      continue;
    }
    if (!a) {
      fused.push(b!);
      continue;
    }
    if (!b) {
      fused.push(a);
      continue;
    }

    fused.push({
      x: (a.x * weightA + b.x * weightB) / totalWeight,
      y: (a.y * weightA + b.y * weightB) / totalWeight,
      z: ((a.z ?? 0) * weightA + (b.z ?? 0) * weightB) / totalWeight,
      visibility:
        ((a.visibility ?? 0) * weightA + (b.visibility ?? 0) * weightB) /
        totalWeight,
    });
  }

  return fused;
}
