/**
 * Converts pose landmarks to articular angles.
 * Uses vector math on 2D/3D joint coordinates.
 *
 * Landmark indices follow MediaPipe Pose / ML Kit conventions:
 *   11 = left_shoulder, 13 = left_elbow, 15 = left_wrist
 *   23 = left_hip,  24 = right_hip
 *   25 = left_knee, 26 = right_knee
 *   27 = left_ankle, 28 = right_ankle
 *   29 = left_heel,  30 = right_heel
 */

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface PoseLandmarks {
  [index: number]: Landmark;
}

function angleBetweenThreePoints(a: Landmark, b: Landmark, c: Landmark): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };

  const dot = ba.x * bc.x + ba.y * bc.y;
  const magBa = Math.sqrt(ba.x ** 2 + ba.y ** 2);
  const magBc = Math.sqrt(bc.x ** 2 + bc.y ** 2);

  if (magBa === 0 || magBc === 0) return 0;

  const cosAngle = dot / (magBa * magBc);
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  return (Math.acos(clampedCos) * 180) / Math.PI;
}

export function calculateKneeAngle(landmarks: PoseLandmarks): number {
  // Prefer right side (26 = right_knee, 24 = right_hip, 28 = right_ankle)
  const hip = landmarks[24] ?? landmarks[23];
  const knee = landmarks[26] ?? landmarks[25];
  const ankle = landmarks[28] ?? landmarks[27];

  if (!hip || !knee || !ankle) return 0;
  return angleBetweenThreePoints(hip, knee, ankle);
}

export function calculateHipAngle(landmarks: PoseLandmarks): number {
  // right_shoulder (12), right_hip (24), right_knee (26)
  const shoulder = landmarks[12] ?? landmarks[11];
  const hip = landmarks[24] ?? landmarks[23];
  const knee = landmarks[26] ?? landmarks[25];

  if (!shoulder || !hip || !knee) return 0;
  return angleBetweenThreePoints(shoulder, hip, knee);
}

export function calculateAnkleAngle(landmarks: PoseLandmarks): number {
  // right_knee (26), right_ankle (28), right_heel (30)
  const knee = landmarks[26] ?? landmarks[25];
  const ankle = landmarks[28] ?? landmarks[27];
  const heel = landmarks[30] ?? landmarks[29];

  if (!knee || !ankle || !heel) return 0;
  return angleBetweenThreePoints(knee, ankle, heel);
}

export function calculateConfidenceScore(landmarks: PoseLandmarks): number {
  const keyIndices = [11, 12, 23, 24, 25, 26, 27, 28];
  const visibilities = keyIndices
    .map(i => landmarks[i]?.visibility ?? 0)
    .filter(v => v > 0);

  if (visibilities.length === 0) return 0;
  return visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length;
}
