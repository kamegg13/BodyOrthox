/**
 * Closed-form fitting of per-side HKA calibration models.
 *
 * No external ML library: ordinary least squares for `y = a*x + b` has a
 * closed form, which is the right tool for N in the tens. Richer models are
 * intentionally not offered here — they overfit at this sample size.
 */

import type {
  CalibrationKind,
  CalibrationModel,
  CalibrationSample,
  LinearCoefficients,
  Side,
  SideModel,
} from "./calibration-types";

/** Identity correction: leaves the prediction unchanged. */
export function fitIdentity(): LinearCoefficients {
  return { a: 1, b: 0 };
}

/**
 * Offset-only correction: removes the mean bias.
 * `b = mean(y - x)`, slope fixed at 1. The most robust correction at very
 * small N because it spends a single degree of freedom.
 */
export function fitOffset(xs: readonly number[], ys: readonly number[]): LinearCoefficients {
  if (xs.length !== ys.length) {
    throw new Error("fitOffset: xs and ys must have the same length");
  }
  if (xs.length === 0) {
    throw new Error("fitOffset: need at least one sample");
  }
  const meanDiff =
    xs.reduce((sum, x, i) => sum + (ys[i] - x), 0) / xs.length;
  return { a: 1, b: meanDiff };
}

/**
 * Ordinary least squares for `y = a*x + b`.
 *
 * Throws when fewer than 2 points are given, or when the design is degenerate
 * (all x equal → slope undefined). Callers fall back to {@link fitOffset} in
 * that case via {@link fitSideModel}.
 */
export function fitLinear(xs: readonly number[], ys: readonly number[]): LinearCoefficients {
  if (xs.length !== ys.length) {
    throw new Error("fitLinear: xs and ys must have the same length");
  }
  const n = xs.length;
  if (n < 2) {
    throw new Error("fitLinear: need at least 2 samples");
  }

  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i];
    const y = ys[i];
    sx += x;
    sy += y;
    sxx += x * x;
    sxy += x * y;
  }

  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-9) {
    throw new Error("fitLinear: degenerate design (no variance in x)");
  }

  const a = (n * sxy - sx * sy) / denom;
  const b = (sy - a * sx) / n;
  return { a, b };
}

/**
 * Fit a single side with the requested model kind.
 *
 * `linear` automatically degrades to `offset` (then `identity`) when there is
 * not enough data / variance — the returned {@link SideModel.kind} reflects
 * what was actually fitted, never what was requested.
 */
export function fitSideModel(
  samples: readonly CalibrationSample[],
  kind: CalibrationKind,
): SideModel {
  const xs = samples.map((s) => s.predictedHKA);
  const ys = samples.map((s) => s.groundTruthHKA);
  const n = samples.length;

  if (kind === "identity" || n === 0) {
    return { kind: "identity", coefficients: fitIdentity(), n };
  }

  if (kind === "offset" || n === 1) {
    return { kind: "offset", coefficients: fitOffset(xs, ys), n };
  }

  // kind === "linear"
  try {
    return { kind: "linear", coefficients: fitLinear(xs, ys), n };
  } catch {
    // Degenerate (no variance in x): fall back to a robust offset.
    return { kind: "offset", coefficients: fitOffset(xs, ys), n };
  }
}

/** Split samples by side. */
export function splitBySide(samples: readonly CalibrationSample[]): {
  left: CalibrationSample[];
  right: CalibrationSample[];
} {
  const left: CalibrationSample[] = [];
  const right: CalibrationSample[] = [];
  for (const s of samples) {
    (s.side === "left" ? left : right).push(s);
  }
  return { left, right };
}

/**
 * Fit a full {@link CalibrationModel} (both sides) at a fixed timestamp.
 *
 * The timestamp is injected (not `new Date()`) so fitting stays pure and
 * deterministic — important for reproducible, versionable models.
 */
export function fitCalibrationModel(
  samples: readonly CalibrationSample[],
  kind: CalibrationKind,
  createdAt: string,
  metadata?: Readonly<Record<string, string | number>>,
): CalibrationModel {
  const { left, right } = splitBySide(samples);
  return {
    version: 1,
    createdAt,
    left: fitSideModel(left, kind),
    right: fitSideModel(right, kind),
    ...(metadata ? { metadata } : {}),
  };
}

/** Convenience: pick the side model for a given side. */
export function sideModelFor(model: CalibrationModel, side: Side): SideModel {
  return side === "left" ? model.left : model.right;
}
