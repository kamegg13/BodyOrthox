/**
 * Web implementation of IPoseDetector using MediaPipe Tasks Vision.
 *
 * - Lazy-loads PoseLandmarker with pose_landmarker_heavy model from CDN
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
// Note: Google Storage models use "latest" versioning (not npm semver)
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task";

/** MediaPipe landmark indices relevant for orthopaedic analysis */
const RELEVANT_INDICES = [11, 12, 23, 24, 25, 26, 27, 28, 29, 30] as const;

/** Minimum visibility below which a landmark is considered undetected */
const MIN_VISIBILITY = 0.3;

/** Minimum dimension (longest side) for image upscaling */
const MIN_DIMENSION = 1920;

/** Crop percentages for multi-pass center-crop variations */
const CROP_PERCENTAGES = [0.95, 0.9] as const;

/** Brightness multipliers for multi-pass brightness variations */
const BRIGHTNESS_MULTIPLIERS = [1.05, 0.95] as const;

/**
 * Describes a pass variation for coordinate remapping.
 * 'original' and 'brightness' passes need no remapping.
 * 'crop' passes need remapping back to original coordinate space.
 */
interface PassVariation {
  readonly type: "original" | "crop" | "brightness";
  /** For crop passes: the crop percentage (e.g. 0.95, 0.9) */
  readonly cropPercent?: number;
}

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
  mpLandmarks: NormalizedLandmark[],
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
 * Load an HTMLImageElement from a data URL.
 */
function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Impossible de charger l'image pour l'analyse."));
    img.src = dataUrl;
  });
}

/**
 * Clean up an HTMLImageElement to prevent memory leaks.
 */
function cleanupImage(image: HTMLImageElement): void {
  image.onload = null;
  image.onerror = null;
  image.src = "";
}

/**
 * Upscale an image so its longest side is at least MIN_DIMENSION pixels.
 * Returns the original image if it is already large enough.
 */
export async function upscaleImage(
  image: HTMLImageElement,
): Promise<HTMLImageElement> {
  const maxDim = Math.max(image.naturalWidth, image.naturalHeight);
  if (maxDim >= MIN_DIMENSION) return image;

  const scale = MIN_DIMENSION / maxDim;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return image;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const upscaled = await loadImageFromDataUrl(
    canvas.toDataURL("image/jpeg", 0.95),
  );
  return upscaled;
}

/**
 * Create image variations for multi-pass analysis.
 * Returns: [original, 95% crop, 90% crop, +5% brightness, -5% brightness]
 * Also returns PassVariation metadata for coordinate remapping.
 */
export async function createVariations(
  image: HTMLImageElement,
): Promise<{ images: HTMLImageElement[]; variations: PassVariation[] }> {
  const images: HTMLImageElement[] = [image];
  const variations: PassVariation[] = [{ type: "original" }];

  // Center-crop variations
  for (const cropPercent of CROP_PERCENTAGES) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    const cropX = (image.naturalWidth * (1 - cropPercent)) / 2;
    const cropY = (image.naturalHeight * (1 - cropPercent)) / 2;
    const cropW = image.naturalWidth * cropPercent;
    const cropH = image.naturalHeight * cropPercent;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const variation = await loadImageFromDataUrl(
      canvas.toDataURL("image/jpeg", 0.95),
    );
    images.push(variation);
    variations.push({ type: "crop", cropPercent });
  }

  // Brightness variations
  for (const brightness of BRIGHTNESS_MULTIPLIERS) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.filter = `brightness(${brightness})`;
    ctx.drawImage(image, 0, 0);

    const variation = await loadImageFromDataUrl(
      canvas.toDataURL("image/jpeg", 0.95),
    );
    images.push(variation);
    variations.push({ type: "brightness" });
  }

  return { images, variations };
}

/**
 * Remap a landmark's x/y from a center-cropped image back to the original
 * image coordinate space. The detection ran on the cropped region scaled
 * to the full canvas, so normalized coords need offset + scale adjustment.
 */
export function remapCropLandmark(
  landmark: NormalizedLandmark,
  cropPercent: number,
): NormalizedLandmark {
  const offset = (1 - cropPercent) / 2;
  return {
    x: offset + landmark.x * cropPercent,
    y: offset + landmark.y * cropPercent,
    z: landmark.z,
    visibility: landmark.visibility,
  };
}

/**
 * Average multiple sets of NormalizedLandmark[] into a single set,
 * weighted by visibility. Handles coordinate remapping for crop passes.
 */
export function averageLandmarks(
  results: NormalizedLandmark[][],
  variations: PassVariation[],
): NormalizedLandmark[] {
  if (results.length === 0) return [];
  if (results.length === 1) return results[0];

  const landmarkCount = results[0].length;
  const averaged: NormalizedLandmark[] = [];

  for (let i = 0; i < landmarkCount; i++) {
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    let sumVis = 0;
    let weightSum = 0;

    for (let p = 0; p < results.length; p++) {
      const lm = results[p][i];
      if (!lm) continue;

      const vis = lm.visibility ?? 0;
      // Use at least a small weight so zero-visibility passes still contribute
      const weight = Math.max(vis, 0.01);

      // Remap crop landmarks back to original coordinate space
      const remapped =
        variations[p].type === "crop" && variations[p].cropPercent !== undefined
          ? remapCropLandmark(lm, variations[p].cropPercent!)
          : lm;

      sumX += remapped.x * weight;
      sumY += remapped.y * weight;
      sumZ += (remapped.z ?? 0) * weight;
      sumVis += vis;
      weightSum += weight;
    }

    if (weightSum === 0) {
      averaged.push({ x: 0, y: 0, z: 0, visibility: 0 });
    } else {
      averaged.push({
        x: sumX / weightSum,
        y: sumY / weightSum,
        z: sumZ / weightSum,
        visibility: sumVis / results.length,
      });
    }
  }

  return averaged;
}

/** Options for the detect method */
export interface DetectOptions {
  /** Enable multi-pass analysis (5 passes averaged). Default: true */
  readonly multiPass?: boolean;
}

class MediaPipePoseDetector implements IPoseDetector {
  private poseLandmarker: PoseLandmarker | null = null;
  private initPromise: Promise<void> | null = null;
  private ready = false;
  private detectOptions: DetectOptions = { multiPass: true };

  /**
   * Configure detection options (e.g. disabling multi-pass for testing).
   */
  setDetectOptions(options: DetectOptions): void {
    this.detectOptions = { ...this.detectOptions, ...options };
  }

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
          minPoseDetectionConfidence: 0.7,
          minPosePresenceConfidence: 0.7,
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
          minPoseDetectionConfidence: 0.7,
          minPosePresenceConfidence: 0.7,
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

    const useMultiPass = this.detectOptions.multiPass !== false;
    const baseImage = await loadImageFromDataUrl(imageDataUrl);

    try {
      // Step 1: Upscale to minimum dimension
      const upscaled = await upscaleImage(baseImage);
      const shouldCleanupUpscaled = upscaled !== baseImage;

      try {
        let mpLandmarks: NormalizedLandmark[];

        if (useMultiPass) {
          // Step 2: Create 5 variations
          const { images, variations } = await createVariations(upscaled);

          try {
            // Step 3: Run detection on each variation
            const passResults: NormalizedLandmark[][] = [];
            const successfulVariations: PassVariation[] = [];

            for (let i = 0; i < images.length; i++) {
              const result = this.poseLandmarker.detect(images[i]);
              if (result.landmarks && result.landmarks.length > 0) {
                passResults.push(result.landmarks[0]);
                successfulVariations.push(variations[i]);
              }
            }

            if (passResults.length === 0) {
              throw new NoPoseDetectedError(
                "Aucune personne détectée. Assurez-vous que le patient est entièrement visible dans la photo.",
              );
            }

            // Step 4: Average landmarks across successful passes
            mpLandmarks = averageLandmarks(passResults, successfulVariations);
          } finally {
            // Clean up variation images (skip index 0 = upscaled, cleaned separately)
            for (let i = 1; i < images.length; i++) {
              cleanupImage(images[i]);
            }
          }
        } else {
          // Single-pass mode
          const result = this.poseLandmarker.detect(upscaled);

          if (!result.landmarks || result.landmarks.length === 0) {
            throw new NoPoseDetectedError(
              "Aucune personne détectée. Assurez-vous que le patient est entièrement visible dans la photo.",
            );
          }

          mpLandmarks = result.landmarks[0];
        }

        const landmarks = mediapipeToPoseLandmarks(mpLandmarks);
        const allLandmarks = mediapipeToAllLandmarks(mpLandmarks);

        if (!hasValidPose(landmarks)) {
          throw new NoPoseDetectedError(
            "Aucune personne détectée. Assurez-vous que le patient est entièrement visible dans la photo.",
          );
        }

        const confidenceScore = calculateConfidenceScore(landmarks);

        return { landmarks, allLandmarks, confidenceScore };
      } finally {
        if (shouldCleanupUpscaled) {
          cleanupImage(upscaled);
        }
      }
    } finally {
      cleanupImage(baseImage);
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
