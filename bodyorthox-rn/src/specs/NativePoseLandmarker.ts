/**
 * TurboModule spec for the native MediaPipe PoseLandmarker (IMAGE mode).
 *
 * Android: MediaPipe Tasks Vision (com.google.mediapipe:tasks-vision)
 * iOS: MediaPipeTasksVision (CocoaPods)
 *
 * Contract:
 * - `imageBase64` is raw base64 (no `data:image/...;base64,` prefix).
 * - No pose detected resolves with `landmarks: []` (NOT a rejection) — the
 *   JS layer owns the user-facing NoPoseDetectedError message.
 * - Rejections use typed codes: E_INIT_FAILED (model missing/load failure),
 *   E_IMAGE_INVALID (base64/decode failure).
 * - Named per operation (detectFromImage) so a future LIVE_STREAM method can
 *   be added without breaking this one.
 */

import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface NativeLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface DetectFromImageOptions {
  /** Model file bundled with the app, e.g. "pose_landmarker_heavy.task" */
  modelAsset: string;
  /** "GPU" (native falls back to CPU on failure) or "CPU" */
  delegate: string;
  minPoseDetectionConfidence: number;
  minPosePresenceConfidence: number;
}

export interface DetectFromImageResult {
  /** 33 BlazePose landmarks, or [] when no pose was detected */
  landmarks: NativeLandmark[];
  /** Image dimensions after EXIF rotation was applied */
  width: number;
  height: number;
}

export interface Spec extends TurboModule {
  detectFromImage(
    imageBase64: string,
    options: DetectFromImageOptions,
  ): Promise<DetectFromImageResult>;
  /** Release all cached landmarker instances */
  dispose(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>("PoseLandmarker");
