/**
 * Honest evaluation metrics for HKA calibration.
 *
 * Two principles drive this module:
 *  1. Out-of-sample only. Error measured on the same data used to fit is
 *     optimistic and worthless. At small N the correct tool is leave-one-out
 *     cross-validation (LOOCV) — see {@link leaveOneOut}.
 *  2. Report what calibration CANNOT fix. A linear correction removes bias but
 *     not the variance from limb rotation / camera perspective. Bland-Altman
 *     limits of agreement quantify that irreducible spread — see
 *     {@link blandAltman}.
 */

import type {
  CalibrationKind,
  CalibrationSample,
  HkaCategory,
  HkaThresholds,
  Side,
} from "./calibration-types";
import { applyCalibration, applyLinear } from "./apply-calibration";
import { fitSideModel } from "./fit-calibration";

// ---------------------------------------------------------------------------
// Scalar error metrics
// ---------------------------------------------------------------------------

/** Mean absolute error of a list of residuals (predicted - truth). */
export function mae(residuals: readonly number[]): number {
  if (residuals.length === 0) return 0;
  return residuals.reduce((s, r) => s + Math.abs(r), 0) / residuals.length;
}

/** Root mean squared error of residuals. */
export function rmse(residuals: readonly number[]): number {
  if (residuals.length === 0) return 0;
  const ms = residuals.reduce((s, r) => s + r * r, 0) / residuals.length;
  return Math.sqrt(ms);
}

/** Mean signed residual (systematic bias). */
export function meanBias(residuals: readonly number[]): number {
  if (residuals.length === 0) return 0;
  return residuals.reduce((s, r) => s + r, 0) / residuals.length;
}

export interface BlandAltmanResult {
  /** Mean difference (method - reference), i.e. residual bias. */
  readonly bias: number;
  /** Standard deviation of the differences. */
  readonly sd: number;
  /** Lower limit of agreement: bias - 1.96·SD. */
  readonly lowerLoA: number;
  /** Upper limit of agreement: bias + 1.96·SD. */
  readonly upperLoA: number;
  readonly n: number;
}

/**
 * Bland-Altman agreement between a method and a reference.
 *
 * `differences[i] = method[i] - reference[i]`. The limits of agreement
 * (bias ± 1.96·SD) describe the range in which 95% of disagreements fall —
 * the part of the error a bias correction cannot remove.
 *
 * SD uses the sample standard deviation (n-1). Needs at least 2 points.
 */
export function blandAltman(differences: readonly number[]): BlandAltmanResult {
  const n = differences.length;
  if (n < 2) {
    const bias = n === 1 ? differences[0] : 0;
    return { bias, sd: 0, lowerLoA: bias, upperLoA: bias, n };
  }
  const bias = meanBias(differences);
  const variance =
    differences.reduce((s, d) => s + (d - bias) ** 2, 0) / (n - 1);
  const sd = Math.sqrt(variance);
  return {
    bias,
    sd,
    lowerLoA: bias - 1.96 * sd,
    upperLoA: bias + 1.96 * sd,
    n,
  };
}

// ---------------------------------------------------------------------------
// Leave-one-out cross-validation
// ---------------------------------------------------------------------------

export interface LoocvResult {
  /** Out-of-sample corrected prediction for each input sample (same order). */
  readonly corrected: readonly number[];
  /** corrected[i] - groundTruth[i]. */
  readonly residuals: readonly number[];
  readonly mae: number;
  readonly rmse: number;
  readonly bias: number;
  readonly blandAltman: BlandAltmanResult;
}

/**
 * Leave-one-out cross-validation of a calibration kind over one side's samples.
 *
 * For each sample i: refit the model on every OTHER same-side sample, then
 * predict i. The residuals are genuinely out-of-sample. With fewer than 3
 * samples LOOCV is unstable, so we fall back to in-sample residuals and the
 * caller should treat the numbers as indicative only.
 */
export function leaveOneOut(
  sideSamples: readonly CalibrationSample[],
  kind: CalibrationKind,
): LoocvResult {
  const n = sideSamples.length;
  const corrected: number[] = [];
  const residuals: number[] = [];

  for (let i = 0; i < n; i++) {
    const heldOut = sideSamples[i];
    const train = sideSamples.filter((_, j) => j !== i);

    // Need ≥2 points to fit a line; otherwise the held-out fit degrades
    // gracefully via fitSideModel (offset / identity).
    const model =
      train.length === 0
        ? fitSideModel([heldOut], kind) // single point: offset onto itself
        : fitSideModel(train, kind);

    const pred = applyLinear(heldOut.predictedHKA, model.coefficients);
    corrected.push(pred);
    residuals.push(pred - heldOut.groundTruthHKA);
  }

  return {
    corrected,
    residuals,
    mae: mae(residuals),
    rmse: rmse(residuals),
    bias: meanBias(residuals),
    blandAltman: blandAltman(residuals),
  };
}

/**
 * In-sample residuals: fit on all samples, predict the same samples.
 * Optimistic — provided only to contrast against LOOCV.
 */
export function inSampleResiduals(
  sideSamples: readonly CalibrationSample[],
  kind: CalibrationKind,
): number[] {
  if (sideSamples.length === 0) return [];
  const model = fitSideModel(sideSamples, kind);
  return sideSamples.map(
    (s) => applyCalibration(s.predictedHKA, model) - s.groundTruthHKA,
  );
}

// ---------------------------------------------------------------------------
// Clinical decision metrics
// ---------------------------------------------------------------------------

/** Classify an HKA angle into a clinical category given thresholds. */
export function classifyByThresholds(
  hka: number,
  thresholds: HkaThresholds,
): HkaCategory {
  if (hka < thresholds.varumBelow) return "varum";
  if (hka > thresholds.valgumAbove) return "valgum";
  return "normal";
}

export const CATEGORIES: readonly HkaCategory[] = ["varum", "normal", "valgum"];

export interface ConfusionMatrix {
  /** matrix[trueCat][predCat] = count. */
  readonly matrix: Readonly<Record<HkaCategory, Readonly<Record<HkaCategory, number>>>>;
  readonly total: number;
  /** Fraction on the diagonal. */
  readonly accuracy: number;
  /** Mean of per-class recall over classes that actually occur. */
  readonly balancedAccuracy: number;
}

function emptyMatrix(): Record<HkaCategory, Record<HkaCategory, number>> {
  const m = {} as Record<HkaCategory, Record<HkaCategory, number>>;
  for (const t of CATEGORIES) {
    m[t] = { varum: 0, normal: 0, valgum: 0 };
  }
  return m;
}

/**
 * Build a confusion matrix from paired (predicted category, true category).
 * `balancedAccuracy` averages recall only over classes present in the truth,
 * so an absent class does not deflate the score.
 */
export function confusionMatrix(
  predicted: readonly HkaCategory[],
  truth: readonly HkaCategory[],
): ConfusionMatrix {
  if (predicted.length !== truth.length) {
    throw new Error("confusionMatrix: length mismatch");
  }
  const matrix = emptyMatrix();
  for (let i = 0; i < truth.length; i++) {
    matrix[truth[i]][predicted[i]] += 1;
  }

  const total = truth.length;
  let correct = 0;
  for (const c of CATEGORIES) correct += matrix[c][c];

  const recalls: number[] = [];
  for (const c of CATEGORIES) {
    const support = CATEGORIES.reduce((s, p) => s + matrix[c][p], 0);
    if (support > 0) recalls.push(matrix[c][c] / support);
  }
  const balancedAccuracy =
    recalls.length > 0
      ? recalls.reduce((s, r) => s + r, 0) / recalls.length
      : 0;

  return {
    matrix,
    total,
    accuracy: total > 0 ? correct / total : 0,
    balancedAccuracy,
  };
}

// ---------------------------------------------------------------------------
// Empirical threshold re-derivation
// ---------------------------------------------------------------------------

export interface ThresholdSweepResult {
  readonly thresholds: HkaThresholds;
  readonly balancedAccuracy: number;
}

/**
 * Search for the (varumBelow, valgumAbove) thresholds on a measured HKA that
 * best reproduce the clinical category derived from radiographic ground truth.
 *
 * `measured` are the photo/calibrated HKA values; `truthCategory` is the
 * reference label per sample (typically derived from the radiographic HKA with
 * standard clinical cutoffs). Returns the threshold pair maximizing balanced
 * accuracy over a grid. This empirically validates / replaces hand-set cutoffs.
 */
export function sweepThresholds(
  measured: readonly number[],
  truthCategory: readonly HkaCategory[],
  options?: {
    readonly min?: number;
    readonly max?: number;
    readonly step?: number;
  },
): ThresholdSweepResult {
  if (measured.length !== truthCategory.length) {
    throw new Error("sweepThresholds: length mismatch");
  }
  const min = options?.min ?? 165;
  const max = options?.max ?? 195;
  const step = options?.step ?? 0.5;

  let best: ThresholdSweepResult = {
    thresholds: { varumBelow: 177, valgumAbove: 183 },
    balancedAccuracy: -1,
  };

  for (let varum = min; varum <= max; varum += step) {
    for (let valgum = varum; valgum <= max; valgum += step) {
      const thresholds: HkaThresholds = {
        varumBelow: varum,
        valgumAbove: valgum,
      };
      const predicted = measured.map((m) =>
        classifyByThresholds(m, thresholds),
      );
      const ba = confusionMatrix(predicted, truthCategory).balancedAccuracy;
      if (ba > best.balancedAccuracy) {
        best = { thresholds, balancedAccuracy: ba };
      }
    }
  }
  return best;
}

/** Pull the (predicted, groundTruth) HKA arrays out of samples for a side. */
export function sideArrays(samples: readonly CalibrationSample[], side: Side): {
  predicted: number[];
  truth: number[];
} {
  const filtered = samples.filter((s) => s.side === side);
  return {
    predicted: filtered.map((s) => s.predictedHKA),
    truth: filtered.map((s) => s.groundTruthHKA),
  };
}
