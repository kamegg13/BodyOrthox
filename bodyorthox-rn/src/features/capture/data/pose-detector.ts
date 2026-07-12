/**
 * IPoseDetector — platform-agnostic interface for pose detection.
 *
 * Web implementation uses MediaPipe Tasks Vision (WASM).
 * Native implementation uses the NativePoseLandmarker TurboModule
 * (MediaPipe Tasks Vision native SDKs, on-device).
 *
 * Webpack resolves `.web.ts` for web builds; the re-export below
 * provides the default (native) implementation for TypeScript / Metro.
 */

import { PoseLandmarks } from "./angle-calculator";
import type { AnatomicalValidation } from "./anatomical-validation";

export interface PoseDetectionResult {
  landmarks: PoseLandmarks;
  allLandmarks: PoseLandmarks;
  confidenceScore: number;
  anatomicalValidation?: AnatomicalValidation;
}

export interface IPoseDetector {
  initialize(): Promise<void>;
  detect(imageDataUrl: string): Promise<PoseDetectionResult>;
  isReady(): boolean;
  dispose(): void;
}

export { getPoseDetector } from "./pose-detector.native";
