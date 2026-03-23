/**
 * Web implementation of IPoseDetector using MediaPipe Tasks Vision.
 *
 * - Lazy-loads PoseLandmarker with pose_landmarker_heavy + pose_landmarker_full
 * - Uses GPU delegate with CPU fallback
 * - Maps MediaPipe NormalizedLandmark[] to PoseLandmarks format
 * - Multi-pass detection with visibility²-weighted smoothing
 * - Optional ROI crop for improved leg landmark accuracy
 * - Optional auto-rotation to correct tilted images
 * - Optional multi-model fusion (heavy + full) with visibility-weighted averaging
 * - Optional image quality check before detection
 * - Optional anatomical validation after detection
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
import { analyzeImageQuality, ImageQualityError } from "./image-quality";
import { validateAnatomicalProportions } from "./anatomical-validation";

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm";
// Note: Google Storage models use "latest" versioning (not npm semver)
const MODEL_URL_HEAVY =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task";
const MODEL_URL_FULL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task";

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

/** Landmark indices for legs (hips to feet) used in ROI crop */
const LEG_LANDMARK_INDICES = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32] as const;

/** ROI crop expansion margin (20% on each side) */
const ROI_MARGIN = 0.2;

/** Minimum tilt angle (degrees) to trigger auto-rotation correction */
const MIN_TILT_DEGREES = 2;

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
 * using visibility² as weight for each landmark. This gives high-confidence
 * detections significantly more influence (e.g. visibility 0.95 weighs ~3.6x
 * more than 0.5). Handles coordinate remapping for crop passes.
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
      // visibility² weighting: high-confidence detections dominate
      // Use at least a small weight so zero-visibility passes still contribute
      const weight = Math.max(vis * vis, 0.0001);

      // Remap crop landmarks back to original coordinate space
      const remapped =
        variations[p].type === "crop" && variations[p].cropPercent !== undefined
          ? remapCropLandmark(lm, variations[p].cropPercent!)
          : lm;

      sumX += remapped.x * weight;
      sumY += remapped.y * weight;
      sumZ += (remapped.z ?? 0) * weight;
      sumVis += vis * weight;
      weightSum += weight;
    }

    if (weightSum === 0) {
      averaged.push({ x: 0, y: 0, z: 0, visibility: 0 });
    } else {
      averaged.push({
        x: sumX / weightSum,
        y: sumY / weightSum,
        z: sumZ / weightSum,
        visibility: sumVis / weightSum,
      });
    }
  }

  return averaged;
}

/**
 * Calculate the tilt angle (in degrees) of the shoulder line.
 * Returns 0 if shoulders are not detected with sufficient confidence.
 */
export function calculateShoulderTilt(landmarks: NormalizedLandmark[]): number {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  if (!leftShoulder || !rightShoulder) return 0;
  if (
    (leftShoulder.visibility ?? 0) < MIN_VISIBILITY ||
    (rightShoulder.visibility ?? 0) < MIN_VISIBILITY
  ) {
    return 0;
  }

  const tiltRad = Math.atan2(
    rightShoulder.y - leftShoulder.y,
    rightShoulder.x - leftShoulder.x,
  );
  return tiltRad * (180 / Math.PI);
}

/**
 * Auto-rotate an image if the detected shoulder line is tilted beyond
 * the threshold. Runs a quick single detection, checks shoulder alignment,
 * and rotates the image to compensate if needed.
 *
 * Returns the (possibly rotated) image, whether rotation was applied,
 * and the detected tilt angle in degrees.
 */
export async function autoRotateIfNeeded(
  poseLandmarker: PoseLandmarker,
  image: HTMLImageElement,
): Promise<{ image: HTMLImageElement; rotated: boolean; angle: number }> {
  // Quick single detection to check tilt
  const quickResult = poseLandmarker.detect(image);
  if (!quickResult.landmarks || quickResult.landmarks.length === 0) {
    return { image, rotated: false, angle: 0 };
  }

  const tiltDeg = calculateShoulderTilt(quickResult.landmarks[0]);

  if (Math.abs(tiltDeg) < MIN_TILT_DEGREES) {
    return { image, rotated: false, angle: tiltDeg };
  }

  // Rotate the image to compensate for tilt
  const tiltRad = tiltDeg * (Math.PI / 180);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { image, rotated: false, angle: tiltDeg };

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-tiltRad);
  ctx.drawImage(image, -canvas.width / 2, -canvas.height / 2);

  const rotatedImage = await loadImageFromDataUrl(
    canvas.toDataURL("image/jpeg", 0.95),
  );
  return { image: rotatedImage, rotated: true, angle: tiltDeg };
}

/**
 * Compute the bounding box of leg landmarks (indices 23-32) from a
 * normalized landmark array. Returns null if no leg landmarks have
 * sufficient visibility.
 */
export function computeLegBoundingBox(
  landmarks: NormalizedLandmark[],
): { minX: number; maxX: number; minY: number; maxY: number } | null {
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  let found = false;

  for (const i of LEG_LANDMARK_INDICES) {
    const lm = landmarks[i];
    if (lm && (lm.visibility ?? 0) > MIN_VISIBILITY) {
      minX = Math.min(minX, lm.x);
      maxX = Math.max(maxX, lm.x);
      minY = Math.min(minY, lm.y);
      maxY = Math.max(maxY, lm.y);
      found = true;
    }
  }

  return found ? { minX, maxX, minY, maxY } : null;
}

/**
 * Remap a normalized landmark from ROI crop coordinates back to full
 * image coordinates.
 */
export function remapRoiLandmark(
  landmark: NormalizedLandmark,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number,
): NormalizedLandmark {
  return {
    x: cropX + landmark.x * cropW,
    y: cropY + landmark.y * cropH,
    z: landmark.z,
    visibility: landmark.visibility,
  };
}

/**
 * Perform a second detection pass focused on the leg region (ROI crop).
 *
 * 1. Find bounding box of leg landmarks (23-32)
 * 2. Expand by ROI_MARGIN on each side
 * 3. Crop the image to this region
 * 4. Run detection on the cropped region
 * 5. Remap leg landmark coordinates back to full image space
 * 6. Merge: use ROI-detected leg landmarks (23-32) averaged with original,
 *    keep non-leg landmarks from the original detection
 */
export async function roiCropDetection(
  poseLandmarker: PoseLandmarker,
  image: HTMLImageElement,
  initialLandmarks: NormalizedLandmark[],
): Promise<NormalizedLandmark[] | null> {
  const bbox = computeLegBoundingBox(initialLandmarks);
  if (!bbox) return null;

  const { minX, maxX, minY, maxY } = bbox;
  const boxW = maxX - minX;
  const boxH = maxY - minY;

  // Expand by margin, clamped to [0, 1]
  const cropX = Math.max(0, minX - ROI_MARGIN * boxW);
  const cropY = Math.max(0, minY - ROI_MARGIN * boxH);
  const cropRight = Math.min(1, maxX + ROI_MARGIN * boxW);
  const cropBottom = Math.min(1, maxY + ROI_MARGIN * boxH);
  const cropW = cropRight - cropX;
  const cropH = cropBottom - cropY;

  if (cropW <= 0 || cropH <= 0) return null;

  // Crop and detect
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const srcX = cropX * image.naturalWidth;
  const srcY = cropY * image.naturalHeight;
  const srcW = cropW * image.naturalWidth;
  const srcH = cropH * image.naturalHeight;
  ctx.drawImage(
    image,
    srcX,
    srcY,
    srcW,
    srcH,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const croppedImage = await loadImageFromDataUrl(
    canvas.toDataURL("image/jpeg", 0.95),
  );

  try {
    const result = poseLandmarker.detect(croppedImage);

    if (!result.landmarks || result.landmarks.length === 0) return null;

    const roiLandmarks = result.landmarks[0];

    // Remap ALL landmarks back to full image coordinates
    // (we only use leg landmarks, but remap all for consistency)
    const remapped: NormalizedLandmark[] = roiLandmarks.map((lm) =>
      remapRoiLandmark(lm, cropX, cropY, cropW, cropH),
    );

    return remapped;
  } finally {
    cleanupImage(croppedImage);
  }
}

/**
 * Merge ROI crop results with original detection.
 * For leg landmarks (23-32): average the original and ROI detections,
 * weighted by visibility².
 * For non-leg landmarks (0-22): keep the original detection.
 */
export function mergeRoiResults(
  original: NormalizedLandmark[],
  roi: NormalizedLandmark[],
): NormalizedLandmark[] {
  const legIndexSet = new Set<number>(LEG_LANDMARK_INDICES);
  const merged: NormalizedLandmark[] = [];

  for (let i = 0; i < original.length; i++) {
    if (!legIndexSet.has(i) || !roi[i]) {
      merged.push(original[i]);
      continue;
    }

    const origLm = original[i];
    const roiLm = roi[i];
    const origWeight = (origLm.visibility ?? 0) ** 2 || 0.0001;
    const roiWeight = (roiLm.visibility ?? 0) ** 2 || 0.0001;
    const totalWeight = origWeight + roiWeight;

    merged.push({
      x: (origLm.x * origWeight + roiLm.x * roiWeight) / totalWeight,
      y: (origLm.y * origWeight + roiLm.y * roiWeight) / totalWeight,
      z:
        ((origLm.z ?? 0) * origWeight + (roiLm.z ?? 0) * roiWeight) /
        totalWeight,
      visibility:
        ((origLm.visibility ?? 0) * origWeight +
          (roiLm.visibility ?? 0) * roiWeight) /
        totalWeight,
    });
  }

  return merged;
}

/**
 * Fuse landmarks from two models by weighted average.
 * Weight = average visibility across all landmarks for that model.
 */
export function fuseMultiModelLandmarks(
  landmarksA: NormalizedLandmark[],
  landmarksB: NormalizedLandmark[],
): NormalizedLandmark[] {
  const avgVisibility = (lms: NormalizedLandmark[]): number => {
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

  const fused: NormalizedLandmark[] = [];
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

/** Options for the detect method */
export interface DetectOptions {
  /** Enable multi-pass analysis (5 passes averaged). Default: true */
  readonly multiPass?: boolean;
  /** Enable auto-rotation correction for tilted images. Default: true */
  readonly autoRotate?: boolean;
  /** Enable ROI crop for improved leg landmark accuracy. Default: true */
  readonly roiCrop?: boolean;
  /** Enable multi-model fusion (heavy + full). Default: true */
  readonly multiModel?: boolean;
  /** Enable image quality check before detection. Default: true */
  readonly imageQuality?: boolean;
  /** Enable anatomical validation after detection. Default: true */
  readonly anatomicalValidation?: boolean;
}

/**
 * Create a PoseLandmarker instance with GPU fallback to CPU.
 */
async function createLandmarker(
  vision: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
  modelUrl: string,
): Promise<PoseLandmarker> {
  try {
    return await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: modelUrl,
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      numPoses: 1,
      minPoseDetectionConfidence: 0.7,
      minPosePresenceConfidence: 0.7,
    });
  } catch {
    // GPU delegate failed — fall back to CPU
    return await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: modelUrl,
        delegate: "CPU",
      },
      runningMode: "IMAGE",
      numPoses: 1,
      minPoseDetectionConfidence: 0.7,
      minPosePresenceConfidence: 0.7,
    });
  }
}

/**
 * Run a single detection on a PoseLandmarker, returning the first pose
 * landmarks or null if no pose was detected.
 */
function detectSingle(
  landmarker: PoseLandmarker,
  image: HTMLImageElement,
): NormalizedLandmark[] | null {
  const result = landmarker.detect(image);
  if (!result.landmarks || result.landmarks.length === 0) return null;
  return result.landmarks[0];
}

class MediaPipePoseDetector implements IPoseDetector {
  private heavyLandmarker: PoseLandmarker | null = null;
  private fullLandmarker: PoseLandmarker | null = null;
  private initPromise: Promise<void> | null = null;
  private ready = false;
  private detectOptions: DetectOptions = {
    multiPass: true,
    autoRotate: true,
    roiCrop: true,
    multiModel: true,
    imageQuality: true,
    anatomicalValidation: true,
  };

  /**
   * Configure detection options (e.g. disabling features for testing).
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

      // Initialize both models in parallel
      const [heavy, full] = await Promise.all([
        createLandmarker(vision, MODEL_URL_HEAVY),
        createLandmarker(vision, MODEL_URL_FULL).catch(() => null),
      ]);

      this.heavyLandmarker = heavy;
      this.fullLandmarker = full;

      this.ready = true;
    } catch (error) {
      this.initPromise = null;
      throw new Error(
        `Impossible d'initialiser MediaPipe Pose : ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get the primary landmarker (heavy model).
   * Used for operations that need a single landmarker (auto-rotate, ROI crop).
   */
  private get primaryLandmarker(): PoseLandmarker {
    const landmarker = this.heavyLandmarker ?? this.fullLandmarker;
    if (!landmarker) {
      throw new Error("Le modèle ML n'est pas initialisé. Veuillez patienter.");
    }
    return landmarker;
  }

  async detect(imageDataUrl: string): Promise<PoseDetectionResult> {
    if (!this.heavyLandmarker && !this.fullLandmarker) {
      throw new Error("Le modèle ML n'est pas initialisé. Veuillez patienter.");
    }

    const useMultiPass = this.detectOptions.multiPass !== false;
    const useAutoRotate = this.detectOptions.autoRotate !== false;
    const useRoiCrop = this.detectOptions.roiCrop !== false;
    const useMultiModel =
      this.detectOptions.multiModel !== false &&
      this.heavyLandmarker !== null &&
      this.fullLandmarker !== null;
    const useImageQuality = this.detectOptions.imageQuality !== false;
    const useAnatomicalValidation =
      this.detectOptions.anatomicalValidation !== false;

    const baseImage = await loadImageFromDataUrl(imageDataUrl);

    try {
      // Step 0: Image quality check
      if (useImageQuality) {
        const quality = analyzeImageQuality(baseImage);
        if (!quality.isAcceptable) {
          throw new ImageQualityError(quality.issues);
        }
      }

      // Step 1: Upscale to minimum dimension
      const upscaled = await upscaleImage(baseImage);
      const shouldCleanupUpscaled = upscaled !== baseImage;

      try {
        // Step 2: Auto-rotate if needed
        let workingImage = upscaled;
        let shouldCleanupRotated = false;

        if (useAutoRotate) {
          const rotateResult = await autoRotateIfNeeded(
            this.primaryLandmarker,
            upscaled,
          );
          if (rotateResult.rotated) {
            workingImage = rotateResult.image;
            shouldCleanupRotated = true;
          }
        }

        try {
          let mpLandmarks: NormalizedLandmark[];

          if (useMultiPass) {
            mpLandmarks = await this.detectMultiPass(
              workingImage,
              useMultiModel,
            );
          } else {
            mpLandmarks = this.detectSinglePass(workingImage, useMultiModel);
          }

          // Step 6: ROI crop for legs
          if (useRoiCrop) {
            const roiResult = await roiCropDetection(
              this.primaryLandmarker,
              workingImage,
              mpLandmarks,
            );
            if (roiResult) {
              mpLandmarks = mergeRoiResults(mpLandmarks, roiResult);
            }
          }

          const landmarks = mediapipeToPoseLandmarks(mpLandmarks);
          const allLandmarks = mediapipeToAllLandmarks(mpLandmarks);

          if (!hasValidPose(landmarks)) {
            throw new NoPoseDetectedError(
              "Aucune personne détectée. Assurez-vous que le patient est entièrement visible dans la photo.",
            );
          }

          const confidenceScore = calculateConfidenceScore(landmarks);

          // Anatomical validation
          const anatomicalValidation = useAnatomicalValidation
            ? validateAnatomicalProportions(landmarks)
            : undefined;

          return {
            landmarks,
            allLandmarks,
            confidenceScore,
            anatomicalValidation,
          };
        } finally {
          if (shouldCleanupRotated) {
            cleanupImage(workingImage);
          }
        }
      } finally {
        if (shouldCleanupUpscaled) {
          cleanupImage(upscaled);
        }
      }
    } finally {
      cleanupImage(baseImage);
    }
  }

  /**
   * Run detection on a single image using one or both models.
   * If multiModel is enabled, fuses results from heavy + full models.
   */
  private detectOnImage(
    image: HTMLImageElement,
    useMultiModel: boolean,
  ): NormalizedLandmark[] | null {
    if (useMultiModel) {
      const heavyResult = this.heavyLandmarker
        ? detectSingle(this.heavyLandmarker, image)
        : null;
      const fullResult = this.fullLandmarker
        ? detectSingle(this.fullLandmarker, image)
        : null;

      if (heavyResult && fullResult) {
        return fuseMultiModelLandmarks(heavyResult, fullResult);
      }
      // Fallback to whichever model succeeded
      return heavyResult ?? fullResult;
    }

    return detectSingle(this.primaryLandmarker, image);
  }

  /**
   * Multi-pass detection: create 5 variations, detect on each, average.
   */
  private async detectMultiPass(
    workingImage: HTMLImageElement,
    useMultiModel: boolean,
  ): Promise<NormalizedLandmark[]> {
    const { images, variations } = await createVariations(workingImage);

    try {
      const passResults: NormalizedLandmark[][] = [];
      const successfulVariations: PassVariation[] = [];

      for (let i = 0; i < images.length; i++) {
        const result = this.detectOnImage(images[i], useMultiModel);
        if (result) {
          passResults.push(result);
          successfulVariations.push(variations[i]);
        }
      }

      if (passResults.length === 0) {
        throw new NoPoseDetectedError(
          "Aucune personne détectée. Assurez-vous que le patient est entièrement visible dans la photo.",
        );
      }

      return averageLandmarks(passResults, successfulVariations);
    } finally {
      // Clean up variation images (skip index 0 = workingImage)
      for (let i = 1; i < images.length; i++) {
        cleanupImage(images[i]);
      }
    }
  }

  /**
   * Single-pass detection on a single image.
   */
  private detectSinglePass(
    workingImage: HTMLImageElement,
    useMultiModel: boolean,
  ): NormalizedLandmark[] {
    const result = this.detectOnImage(workingImage, useMultiModel);

    if (!result) {
      throw new NoPoseDetectedError(
        "Aucune personne détectée. Assurez-vous que le patient est entièrement visible dans la photo.",
      );
    }

    return result;
  }

  dispose(): void {
    this.heavyLandmarker?.close();
    this.heavyLandmarker = null;
    this.fullLandmarker?.close();
    this.fullLandmarker = null;
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
