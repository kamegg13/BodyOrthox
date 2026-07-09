/**
 * Types for HKA calibration.
 *
 * Context: the pose pipeline (MediaPipe BlazePose) produces a 2D photo HKA
 * angle, which is a projection of the true 3D mechanical axis measured on a
 * radiograph (EOS). The two differ by a (mostly) systematic bias plus an
 * irreducible variance from limb rotation / camera perspective.
 *
 * Since BlazePose is not fine-tunable in JS, we do NOT touch the network.
 * Instead we learn a supervised correction `corrected = a * predicted + b`
 * per side, fitted against radiographic ground truth.
 *
 * At small N (< ~50 paired photos) anything richer than a per-side line
 * overfits, so the model is deliberately minimal. See {@link CalibrationKind}.
 */

export type Side = "left" | "right";

/**
 * One labeled calibration pair: what the pipeline predicted vs the
 * radiographic ground truth, for a single leg of a single capture.
 *
 * Optional contextual features are recorded for traceability and future
 * analysis but are intentionally NOT used by the linear model at small N.
 */
export interface CalibrationSample {
  readonly sampleId: string;
  readonly patientId?: string;
  readonly side: Side;
  /** HKA predicted by the pose pipeline, in degrees. */
  readonly predictedHKA: number;
  /** Ground-truth HKA from radiograph / EOS, in degrees. */
  readonly groundTruthHKA: number;

  // --- optional contextual features (recorded, not fitted at small N) ---
  readonly kneeAngle?: number;
  readonly cameraTilt?: number;
  readonly femurTibiaRatio?: number;
  readonly confidence?: number;
  readonly capturedAt?: string;
  readonly notes?: string;
}

/**
 * Model family, in increasing complexity / data appetite:
 * - `identity`: no correction (`a=1, b=0`) — the baseline to beat.
 * - `offset`:   constant bias removal (`a=1, b=mean(truth-pred)`) — 1 param.
 * - `linear`:   full per-side line (`a, b`) — 2 params.
 */
export type CalibrationKind = "identity" | "offset" | "linear";

export interface LinearCoefficients {
  /** Slope. 1 for identity/offset models. */
  readonly a: number;
  /** Intercept (degrees). 0 for identity. */
  readonly b: number;
}

export interface SideModel {
  readonly kind: CalibrationKind;
  readonly coefficients: LinearCoefficients;
  /** Number of samples used to fit this side. */
  readonly n: number;
}

export interface CalibrationModel {
  readonly version: 1;
  /** ISO 8601 UTC timestamp of when the model was fitted. */
  readonly createdAt: string;
  readonly left: SideModel;
  readonly right: SideModel;
  readonly metadata?: Readonly<Record<string, string | number>>;
}

/** Clinical category derived from an HKA angle. */
export type HkaCategory = "varum" | "normal" | "valgum";

/**
 * Decision thresholds on the HKA angle (degrees).
 * varum  := hka <  varumBelow
 * valgum := hka >  valgumAbove
 * normal := otherwise
 */
export interface HkaThresholds {
  readonly varumBelow: number;
  readonly valgumAbove: number;
}
