/**
 * Native implementation of IPoseDetector backed by the NativePoseLandmarker
 * TurboModule (MediaPipe Tasks Vision, IMAGE mode, on-device).
 *
 * Mirrors the web pipeline's multi-model strategy: heavy + full detections
 * fused with the shared visibility-weighted average. The canvas-based web
 * preprocessing (multipass, upscale, ROI crop) is intentionally omitted in
 * v1 — mobile photos are high-resolution and EXIF rotation is handled by
 * the native module. Parity is validated by the calibration protocol
 * (data/calibration/native-vs-web.csv, tolerance ±2° HKA).
 */

import NativePoseLandmarker, {
  type DetectFromImageOptions,
  type NativeLandmark,
} from "../../../specs/NativePoseLandmarker";
import type { IPoseDetector, PoseDetectionResult } from "./pose-detector";
import { calculateConfidenceScore } from "./angle-calculator";
import { validateAnatomicalProportions } from "./anatomical-validation";
import {
  NO_POSE_MESSAGE,
  NoPoseDetectedError,
  fuseMultiModelLandmarks,
  hasValidPose,
  mediapipeToAllLandmarks,
  mediapipeToPoseLandmarks,
} from "./pose-detector-shared";

const MODEL_HEAVY = "pose_landmarker_heavy.task";
const MODEL_FULL = "pose_landmarker_full.task";

const BASE_OPTIONS: Omit<DetectFromImageOptions, "modelAsset"> = {
  delegate: "GPU",
  minPoseDetectionConfidence: 0.7,
  minPosePresenceConfidence: 0.7,
};

/** Strip an optional `data:image/...;base64,` prefix from a data URL. */
export function stripDataUrlPrefix(imageDataUrl: string): string {
  const commaIndex = imageDataUrl.indexOf(",");
  return imageDataUrl.startsWith("data:") && commaIndex !== -1
    ? imageDataUrl.slice(commaIndex + 1)
    : imageDataUrl;
}

/**
 * Run one model detection; returns null when the model found no pose
 * (empty landmarks) so callers can fall back to the other model.
 */
async function detectWithModel(
  imageBase64: string,
  modelAsset: string,
): Promise<NativeLandmark[] | null> {
  const result = await NativePoseLandmarker.detectFromImage(imageBase64, {
    ...BASE_OPTIONS,
    modelAsset,
  });
  return result.landmarks.length > 0 ? result.landmarks : null;
}

export class NativePoseDetector implements IPoseDetector {
  private ready = false;

  async initialize(): Promise<void> {
    // Model loading is lazy on the native side (first detectFromImage call
    // creates and caches the landmarker), so there is nothing to await here.
    this.ready = true;
  }

  async detect(imageDataUrl: string): Promise<PoseDetectionResult> {
    const imageBase64 = stripDataUrlPrefix(imageDataUrl);

    const [heavySettled, fullSettled] = await Promise.allSettled([
      detectWithModel(imageBase64, MODEL_HEAVY),
      detectWithModel(imageBase64, MODEL_FULL),
    ]);

    const heavy =
      heavySettled.status === "fulfilled" ? heavySettled.value : null;
    const full = fullSettled.status === "fulfilled" ? fullSettled.value : null;

    // Both models errored (not "no pose") — surface the native failure
    if (
      heavySettled.status === "rejected" &&
      fullSettled.status === "rejected"
    ) {
      throw heavySettled.reason;
    }

    const mpLandmarks =
      heavy && full ? fuseMultiModelLandmarks(heavy, full) : (heavy ?? full);

    if (!mpLandmarks) {
      throw new NoPoseDetectedError(NO_POSE_MESSAGE);
    }

    const landmarks = mediapipeToPoseLandmarks(mpLandmarks);
    const allLandmarks = mediapipeToAllLandmarks(mpLandmarks);

    if (!hasValidPose(landmarks)) {
      throw new NoPoseDetectedError(NO_POSE_MESSAGE);
    }

    return {
      landmarks,
      allLandmarks,
      confidenceScore: calculateConfidenceScore(landmarks),
      anatomicalValidation: validateAnatomicalProportions(landmarks),
    };
  }

  isReady(): boolean {
    return this.ready;
  }

  dispose(): void {
    NativePoseLandmarker.dispose();
    this.ready = false;
  }
}

/** Singleton instance */
let instance: IPoseDetector | null = null;

export function getPoseDetector(): IPoseDetector {
  if (!instance) {
    instance = new NativePoseDetector();
  }
  return instance;
}
