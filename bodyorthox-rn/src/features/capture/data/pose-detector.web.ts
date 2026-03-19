/**
 * Web implementation of IPoseDetector using MediaPipe Tasks Vision.
 *
 * - Lazy-loads PoseLandmarker with pose_landmarker_lite model from CDN
 * - Uses GPU delegate with CPU fallback
 * - Maps MediaPipe NormalizedLandmark[] to PoseLandmarks format
 */

import {
  PoseLandmarker,
  FilesetResolver,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import type { IPoseDetector, PoseDetectionResult } from "./pose-detector";
import {
  calculateConfidenceScore,
  type PoseLandmarks,
} from "./angle-calculator";

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/0.10.32/pose_landmarker_lite.task";

/** MediaPipe landmark indices relevant for orthopaedic analysis */
const RELEVANT_INDICES = [11, 12, 23, 24, 25, 26, 27, 28, 29, 30] as const;

/** Minimum visibility below which a landmark is considered undetected */
const MIN_VISIBILITY = 0.3;

/**
 * Convert MediaPipe NormalizedLandmark[] (33 points) to our PoseLandmarks
 * format, keeping only the indices relevant for angle calculation.
 */
export function mediapipeToPoseLandmarks(
  mpLandmarks: NormalizedLandmark[],
): PoseLandmarks {
  const result: PoseLandmarks = {};
  for (const i of RELEVANT_INDICES) {
    const lm = mpLandmarks[i];
    if (lm) {
      result[i] = {
        x: lm.x,
        y: lm.y,
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

class MediaPipePoseDetector implements IPoseDetector {
  private poseLandmarker: PoseLandmarker | null = null;
  private initPromise: Promise<void> | null = null;
  private ready = false;

  async initialize(): Promise<void> {
    if (this.ready) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

      try {
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          numPoses: 1,
        });
      } catch {
        // GPU delegate failed — fall back to CPU
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "CPU",
          },
          runningMode: "IMAGE",
          numPoses: 1,
        });
      }

      this.ready = true;
    } catch (error) {
      this.initPromise = null;
      throw new Error(
        `Impossible d'initialiser MediaPipe Pose : ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async detect(imageDataUrl: string): Promise<PoseDetectionResult> {
    if (!this.poseLandmarker) {
      throw new Error("Le modèle ML n'est pas initialisé. Veuillez patienter.");
    }

    const image = await this.loadImage(imageDataUrl);
    try {
      const result = this.poseLandmarker.detect(image);

      if (!result.landmarks || result.landmarks.length === 0) {
        throw new NoPoseDetectedError(
          "Aucune personne détectée. Assurez-vous que le patient est entièrement visible dans la photo.",
        );
      }

      const landmarks = mediapipeToPoseLandmarks(result.landmarks[0]);

      if (!hasValidPose(landmarks)) {
        throw new NoPoseDetectedError(
          "Aucune personne détectée. Assurez-vous que le patient est entièrement visible dans la photo.",
        );
      }

      const confidenceScore = calculateConfidenceScore(landmarks);

      return { landmarks, confidenceScore };
    } finally {
      // Clean up HTMLImageElement to prevent memory leaks
      image.onload = null;
      image.onerror = null;
      image.src = "";
    }
  }

  dispose(): void {
    this.poseLandmarker?.close();
    this.poseLandmarker = null;
    this.ready = false;
    this.initPromise = null;
  }

  isReady(): boolean {
    return this.ready;
  }

  private loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error("Impossible de charger l'image pour l'analyse."));
      img.src = dataUrl;
    });
  }
}

export class NoPoseDetectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoPoseDetectedError";
  }
}

/** Singleton instance */
let instance: IPoseDetector | null = null;

export function getPoseDetector(): IPoseDetector {
  if (!instance) {
    instance = new MediaPipePoseDetector();
  }
  return instance;
}
