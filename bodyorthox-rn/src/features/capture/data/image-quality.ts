/**
 * Image quality analysis for pose detection.
 *
 * Checks brightness, contrast, and sharpness of an image before
 * running ML inference. Uses canvas downsampling to 200x200 for speed.
 */

/** Minimum image dimension (width or height) in pixels */
const MIN_RESOLUTION = 480;

/** Acceptable brightness range (0-1 scale) */
const BRIGHTNESS_MIN = 0.15;
const BRIGHTNESS_MAX = 0.85;

/** Minimum acceptable contrast (0-1 scale) */
const CONTRAST_MIN = 0.15;

/** Minimum acceptable sharpness (Laplacian variance, 0-1 scale) */
const SHARPNESS_MIN = 0.1;

/** Downsampled size for fast analysis */
const ANALYSIS_SIZE = 200;

export interface ImageQualityResult {
  readonly isAcceptable: boolean;
  readonly issues: readonly string[];
  readonly brightnessScore: number;
  readonly contrastScore: number;
  readonly sharpnessScore: number;
}

export class ImageQualityError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Qualité d'image insuffisante : ${issues.join(" ; ")}`);
    this.name = "ImageQualityError";
    this.issues = issues;
  }
}

/**
 * Extract grayscale pixel data from an image, downsampled to ANALYSIS_SIZE.
 * Returns a Float32Array of luminance values [0, 1] and the canvas dimensions.
 */
function extractGrayscaleData(image: HTMLImageElement): {
  data: Float32Array;
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
} {
  const canvas = document.createElement("canvas");
  const aspectRatio = image.naturalWidth / image.naturalHeight;

  let w: number;
  let h: number;
  if (aspectRatio >= 1) {
    w = ANALYSIS_SIZE;
    h = Math.round(ANALYSIS_SIZE / aspectRatio);
  } else {
    h = ANALYSIS_SIZE;
    w = Math.round(ANALYSIS_SIZE * aspectRatio);
  }

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { data: new Float32Array(0), width: 0, height: 0, canvas };
  }

  ctx.drawImage(image, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const pixels = imageData.data;
  const gray = new Float32Array(w * h);

  for (let i = 0; i < gray.length; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    // ITU-R BT.601 luminance
    gray[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  return { data: gray, width: w, height: h, canvas };
}

/**
 * Compute mean brightness (0-1).
 */
function computeBrightness(data: Float32Array): number {
  if (data.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  return sum / data.length;
}

/**
 * Compute contrast as standard deviation of luminance (0-1 range, typically 0-0.5).
 */
function computeContrast(data: Float32Array, mean: number): number {
  if (data.length === 0) return 0;
  let sumSq = 0;
  for (let i = 0; i < data.length; i++) {
    const diff = data[i] - mean;
    sumSq += diff * diff;
  }
  return Math.sqrt(sumSq / data.length);
}

/**
 * Compute sharpness via Laplacian variance.
 * Applies a 3x3 Laplacian kernel and returns the variance of the response,
 * normalized to a 0-1 scale (capped at 1).
 */
function computeSharpness(
  data: Float32Array,
  width: number,
  height: number,
): number {
  if (width < 3 || height < 3) return 0;

  let sum = 0;
  let sumSq = 0;
  let count = 0;

  // Laplacian kernel: [0, 1, 0; 1, -4, 1; 0, 1, 0]
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const center = data[y * width + x];
      const top = data[(y - 1) * width + x];
      const bottom = data[(y + 1) * width + x];
      const left = data[y * width + (x - 1)];
      const right = data[y * width + (x + 1)];

      const laplacian = top + bottom + left + right - 4 * center;
      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }

  if (count === 0) return 0;

  const mean = sum / count;
  const variance = sumSq / count - mean * mean;

  // Normalize: typical sharp images have variance ~0.01-0.05, blurry ~0.001
  // Scale so that 0.01 variance maps to ~0.5 sharpness
  return Math.min(1, variance * 50);
}

/**
 * Analyze image quality for pose detection suitability.
 *
 * Checks:
 * 1. Resolution (minimum 480px on smallest side)
 * 2. Brightness (not too dark or too bright)
 * 3. Contrast (sufficient variation)
 * 4. Sharpness (not too blurry, via Laplacian variance)
 *
 * Downsamples to 200x200 for fast analysis.
 */
export function analyzeImageQuality(
  image: HTMLImageElement,
): ImageQualityResult {
  const issues: string[] = [];

  // Resolution check (on original image)
  const minDim = Math.min(image.naturalWidth, image.naturalHeight);
  if (minDim < MIN_RESOLUTION) {
    issues.push(
      `Résolution insuffisante (${image.naturalWidth}x${image.naturalHeight}). Minimum requis : ${MIN_RESOLUTION}px.`,
    );
  }

  // Extract downsampled grayscale for fast analysis
  const { data, width, height, canvas } = extractGrayscaleData(image);

  // Clean up canvas
  canvas.width = 0;
  canvas.height = 0;

  if (data.length === 0) {
    return {
      isAcceptable: false,
      issues: ["Impossible d'analyser la qualité de l'image."],
      brightnessScore: 0,
      contrastScore: 0,
      sharpnessScore: 0,
    };
  }

  const brightnessScore = computeBrightness(data);
  const contrastScore = computeContrast(data, brightnessScore);
  const sharpnessScore = computeSharpness(data, width, height);

  if (brightnessScore < BRIGHTNESS_MIN) {
    issues.push(
      `Image trop sombre (luminosité : ${(brightnessScore * 100).toFixed(0)}%). Améliorez l'éclairage.`,
    );
  } else if (brightnessScore > BRIGHTNESS_MAX) {
    issues.push(
      `Image trop claire (luminosité : ${(brightnessScore * 100).toFixed(0)}%). Réduisez l'éclairage ou l'exposition.`,
    );
  }

  if (contrastScore < CONTRAST_MIN) {
    issues.push(
      `Contraste insuffisant (${(contrastScore * 100).toFixed(0)}%). Assurez-vous que le patient se détache de l'arrière-plan.`,
    );
  }

  if (sharpnessScore < SHARPNESS_MIN) {
    issues.push(
      `Image floue (netteté : ${(sharpnessScore * 100).toFixed(0)}%). Stabilisez l'appareil et faites la mise au point.`,
    );
  }

  return {
    isAcceptable: issues.length === 0,
    brightnessScore,
    contrastScore,
    sharpnessScore,
    issues,
  };
}
