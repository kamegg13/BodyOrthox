/**
 * Converts pose landmarks to articular angles.
 * Uses vector math on 2D/3D joint coordinates.
 *
 * Landmark indices follow MediaPipe Pose / ML Kit conventions:
 *   11 = left_shoulder, 12 = right_shoulder
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

/** Minimum visibility below which a landmark is considered unreliable */
const MIN_LANDMARK_CONFIDENCE = 0.5;

/**
 * Check whether a landmark exists and has sufficient visibility confidence.
 */
export function isLandmarkReliable(
  landmark: Landmark | undefined,
): landmark is Landmark {
  return !!landmark && (landmark.visibility ?? 0) >= MIN_LANDMARK_CONFIDENCE;
}

export function angleBetweenThreePoints(
  a: Landmark,
  b: Landmark,
  c: Landmark,
): number {
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

/**
 * Check whether a landmark has meaningful Z depth information.
 * Z is considered available when it is defined and non-zero.
 */
function hasZDepth(lm: Landmark): boolean {
  return lm.z !== undefined && lm.z !== 0;
}

/**
 * Calculate the angle between three points using 3D coordinates.
 * Falls back to 2D when Z is unavailable on any of the three points.
 */
export function angleBetweenThreePoints3D(
  a: Landmark,
  b: Landmark,
  c: Landmark,
): number {
  if (!hasZDepth(a) && !hasZDepth(b) && !hasZDepth(c)) {
    return angleBetweenThreePoints(a, b, c);
  }

  const ba = {
    x: a.x - b.x,
    y: a.y - b.y,
    z: (a.z ?? 0) - (b.z ?? 0),
  };
  const bc = {
    x: c.x - b.x,
    y: c.y - b.y,
    z: (c.z ?? 0) - (b.z ?? 0),
  };

  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const magBa = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const magBc = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);

  if (magBa === 0 || magBc === 0) return 0;

  const cosAngle = dot / (magBa * magBc);
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  return (Math.acos(clampedCos) * 180) / Math.PI;
}

export function calculateKneeAngle(landmarks: PoseLandmarks): number {
  // Prefer right side (26 = right_knee, 24 = right_hip, 28 = right_ankle)
  const hip = isLandmarkReliable(landmarks[24])
    ? landmarks[24]
    : isLandmarkReliable(landmarks[23])
      ? landmarks[23]
      : undefined;
  const knee = isLandmarkReliable(landmarks[26])
    ? landmarks[26]
    : isLandmarkReliable(landmarks[25])
      ? landmarks[25]
      : undefined;
  const ankle = isLandmarkReliable(landmarks[28])
    ? landmarks[28]
    : isLandmarkReliable(landmarks[27])
      ? landmarks[27]
      : undefined;

  if (!hip || !knee || !ankle) return 0;
  return angleBetweenThreePoints3D(hip, knee, ankle);
}

export function calculateHipAngle(landmarks: PoseLandmarks): number {
  // right_shoulder (12), right_hip (24), right_knee (26)
  const shoulder = isLandmarkReliable(landmarks[12])
    ? landmarks[12]
    : isLandmarkReliable(landmarks[11])
      ? landmarks[11]
      : undefined;
  const hip = isLandmarkReliable(landmarks[24])
    ? landmarks[24]
    : isLandmarkReliable(landmarks[23])
      ? landmarks[23]
      : undefined;
  const knee = isLandmarkReliable(landmarks[26])
    ? landmarks[26]
    : isLandmarkReliable(landmarks[25])
      ? landmarks[25]
      : undefined;

  if (!shoulder || !hip || !knee) return 0;
  return angleBetweenThreePoints3D(shoulder, hip, knee);
}

export function calculateAnkleAngle(landmarks: PoseLandmarks): number {
  // right_knee (26), right_ankle (28), right_heel (30)
  const knee = isLandmarkReliable(landmarks[26])
    ? landmarks[26]
    : isLandmarkReliable(landmarks[25])
      ? landmarks[25]
      : undefined;
  const ankle = isLandmarkReliable(landmarks[28])
    ? landmarks[28]
    : isLandmarkReliable(landmarks[27])
      ? landmarks[27]
      : undefined;
  const heel = isLandmarkReliable(landmarks[30])
    ? landmarks[30]
    : isLandmarkReliable(landmarks[29])
      ? landmarks[29]
      : undefined;

  if (!knee || !ankle || !heel) return 0;
  return angleBetweenThreePoints3D(knee, ankle, heel);
}

export function calculateConfidenceScore(landmarks: PoseLandmarks): number {
  const keyIndices = [11, 12, 23, 24, 25, 26, 27, 28];
  const visibilities = keyIndices
    .map((i) => landmarks[i]?.visibility ?? 0)
    .filter((v) => v > 0);

  if (visibilities.length === 0) return 0;
  return visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length;
}

// --- Bilateral HKA analysis ---

export interface SidedAngles {
  readonly kneeAngle: number;
  readonly hipAngle: number;
  readonly ankleAngle: number;
}

export interface BilateralAngles {
  readonly left: SidedAngles;
  readonly right: SidedAngles;
  /** HKA angle for left leg (hip-knee-ankle). ~180° = normal, <177° = varum, >183° = valgum */
  readonly leftHKA: number;
  /** HKA angle for right leg (hip-knee-ankle). ~180° = normal, <177° = varum, >183° = valgum */
  readonly rightHKA: number;
}

/**
 * Classify an HKA angle into a clinical category.
 * Normal: 177°–183°, Varum: <177°, Valgum: >183°
 */
export function classifyHKA(
  hkaAngle: number,
): "normal" | "varum" | "valgum" | "unavailable" {
  if (hkaAngle === 0) return "unavailable";
  if (hkaAngle < 177) return "varum";
  if (hkaAngle > 183) return "valgum";
  return "normal";
}

/**
 * French label for an HKA classification.
 */
export function hkaLabel(hkaAngle: number): string {
  const classification = classifyHKA(hkaAngle);
  switch (classification) {
    case "varum":
      return "Genu varum";
    case "valgum":
      return "Genu valgum";
    case "normal":
      return "Normal";
    case "unavailable":
      return "Non disponible";
  }
}

/**
 * Calculate angles for both legs separately from pose landmarks.
 * Uses confidence filtering — returns 0 for any angle where required
 * landmarks are below the confidence threshold.
 */
export function calculateBilateralAngles(
  landmarks: PoseLandmarks,
): BilateralAngles {
  // Left side: 11=left_shoulder, 23=left_hip, 25=left_knee, 27=left_ankle, 29=left_heel
  const leftShoulder = landmarks[11];
  const leftHip = landmarks[23];
  const leftKnee = landmarks[25];
  const leftAnkle = landmarks[27];
  const leftHeel = landmarks[29];

  // Right side: 12=right_shoulder, 24=right_hip, 26=right_knee, 28=right_ankle, 30=right_heel
  const rightShoulder = landmarks[12];
  const rightHip = landmarks[24];
  const rightKnee = landmarks[26];
  const rightAnkle = landmarks[28];
  const rightHeel = landmarks[30];

  const safeAngle = (
    a: Landmark | undefined,
    b: Landmark | undefined,
    c: Landmark | undefined,
  ): number => {
    if (
      !isLandmarkReliable(a) ||
      !isLandmarkReliable(b) ||
      !isLandmarkReliable(c)
    )
      return 0;
    return angleBetweenThreePoints3D(a, b, c);
  };

  return {
    left: {
      kneeAngle: safeAngle(leftHip, leftKnee, leftAnkle),
      hipAngle: safeAngle(leftShoulder, leftHip, leftKnee),
      ankleAngle: safeAngle(leftKnee, leftAnkle, leftHeel),
    },
    right: {
      kneeAngle: safeAngle(rightHip, rightKnee, rightAnkle),
      hipAngle: safeAngle(rightShoulder, rightHip, rightKnee),
      ankleAngle: safeAngle(rightKnee, rightAnkle, rightHeel),
    },
    leftHKA: safeAngle(leftHip, leftKnee, leftAnkle),
    rightHKA: safeAngle(rightHip, rightKnee, rightAnkle),
  };
}
