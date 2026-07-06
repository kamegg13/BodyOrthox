/**
 * End-to-end calibration report.
 *
 * Ties fitting + evaluation together:
 *  1. For each side, score identity / offset / linear by LOOCV MAE.
 *  2. Select the SIMPLEST model that meaningfully beats the simpler one
 *     (parsimony — at small N, chasing a 0.1° gain is chasing noise).
 *  3. Fit the chosen kind on all of that side's data → the shippable model.
 *  4. Report the honest out-of-sample picture: LOOCV error, Bland-Altman
 *     limits of agreement (the irreducible part), and clinical confusion at
 *     the decision boundary — plus empirically re-derived thresholds.
 */

import type {
  CalibrationKind,
  CalibrationModel,
  CalibrationSample,
  HkaCategory,
  HkaThresholds,
  Side,
  SideModel,
} from "./calibration-types";
import { fitSideModel } from "./fit-calibration";
import {
  classifyByThresholds,
  confusionMatrix,
  leaveOneOut,
  sweepThresholds,
  type BlandAltmanResult,
  type ConfusionMatrix,
  type LoocvResult,
  type ThresholdSweepResult,
} from "./eval-metrics";

/** Clinical cutoffs applied to RADIOGRAPHIC HKA to define the truth label. */
export const DEFAULT_TRUTH_THRESHOLDS: HkaThresholds = {
  varumBelow: 177,
  valgumAbove: 183,
};

/** Thresholds the app currently applies to the raw photo HKA (175/180). */
export const APP_RAW_THRESHOLDS: HkaThresholds = {
  varumBelow: 175,
  valgumAbove: 180,
};

const KINDS: readonly CalibrationKind[] = ["identity", "offset", "linear"];

export interface CandidateScore {
  readonly kind: CalibrationKind;
  readonly loocvMae: number;
  readonly loocvRmse: number;
  readonly loocvBias: number;
}

export interface SideReport {
  readonly side: Side;
  readonly n: number;
  readonly candidates: readonly CandidateScore[];
  readonly chosen: CalibrationKind;
  readonly model: SideModel;
  /** LOOCV MAE of the identity model — the error before any calibration. */
  readonly baselineMae: number;
  readonly loocv: LoocvResult;
  readonly blandAltman: BlandAltmanResult;
  /** Confusion of RAW predicted HKA (app thresholds) vs truth category. */
  readonly clinicalRaw: ConfusionMatrix;
  /** Confusion of LOOCV-corrected HKA (truth thresholds) vs truth category. */
  readonly clinicalCalibrated: ConfusionMatrix;
  /** Thresholds re-derived on the LOOCV-corrected HKA. */
  readonly suggestedThresholds: ThresholdSweepResult;
}

export interface CalibrationReport {
  readonly generatedAt: string;
  readonly truthThresholds: HkaThresholds;
  readonly appThresholds: HkaThresholds;
  readonly left: SideReport;
  readonly right: SideReport;
  readonly model: CalibrationModel;
}

export interface ReportOptions {
  /** Cutoffs applied to radiographic HKA to label truth categories. */
  readonly truthThresholds?: HkaThresholds;
  /** Cutoffs the app currently applies to raw HKA, for the baseline confusion. */
  readonly appThresholds?: HkaThresholds;
  /**
   * Minimum LOOCV-MAE improvement (degrees) required to adopt a more complex
   * model. Guards against overfitting noise at small N.
   */
  readonly parsimonyMargin?: number;
}

function scoreCandidates(
  sideSamples: readonly CalibrationSample[],
): CandidateScore[] {
  return KINDS.map((kind) => {
    const r = leaveOneOut(sideSamples, kind);
    return { kind, loocvMae: r.mae, loocvRmse: r.rmse, loocvBias: r.bias };
  });
}

/**
 * Pick the simplest kind whose LOOCV MAE beats the current best by at least
 * `margin`. Order matters: identity → offset → linear.
 */
export function selectKind(
  candidates: readonly CandidateScore[],
  margin: number,
): CalibrationKind {
  const byKind = new Map(candidates.map((c) => [c.kind, c.loocvMae]));
  let chosen: CalibrationKind = "identity";
  let bestMae = byKind.get("identity") ?? Infinity;
  for (const kind of ["offset", "linear"] as const) {
    const mae = byKind.get(kind);
    if (mae !== undefined && mae < bestMae - margin) {
      chosen = kind;
      bestMae = mae;
    }
  }
  return chosen;
}

function buildSideReport(
  side: Side,
  sideSamples: readonly CalibrationSample[],
  truthThresholds: HkaThresholds,
  appThresholds: HkaThresholds,
  margin: number,
): SideReport {
  const candidates = scoreCandidates(sideSamples);
  const chosen = selectKind(candidates, margin);
  const model = fitSideModel(sideSamples, chosen);
  const loocv = leaveOneOut(sideSamples, chosen);
  const baselineMae =
    candidates.find((c) => c.kind === "identity")?.loocvMae ?? 0;

  const truthCategories: HkaCategory[] = sideSamples.map((s) =>
    classifyByThresholds(s.groundTruthHKA, truthThresholds),
  );

  const rawCategories: HkaCategory[] = sideSamples.map((s) =>
    classifyByThresholds(s.predictedHKA, appThresholds),
  );
  const calibratedCategories: HkaCategory[] = loocv.corrected.map((hka) =>
    classifyByThresholds(hka, truthThresholds),
  );

  return {
    side,
    n: sideSamples.length,
    candidates,
    chosen,
    model,
    baselineMae,
    loocv,
    blandAltman: loocv.blandAltman,
    clinicalRaw: confusionMatrix(rawCategories, truthCategories),
    clinicalCalibrated: confusionMatrix(calibratedCategories, truthCategories),
    suggestedThresholds: sweepThresholds(loocv.corrected, truthCategories),
  };
}

/**
 * Build the full calibration report. Pure: `generatedAt` is injected so the
 * report (and the embedded model) is reproducible.
 */
export function buildCalibrationReport(
  samples: readonly CalibrationSample[],
  generatedAt: string,
  options?: ReportOptions,
): CalibrationReport {
  const truthThresholds = options?.truthThresholds ?? DEFAULT_TRUTH_THRESHOLDS;
  const appThresholds = options?.appThresholds ?? APP_RAW_THRESHOLDS;
  const margin = options?.parsimonyMargin ?? 0.1;

  const left = samples.filter((s) => s.side === "left");
  const right = samples.filter((s) => s.side === "right");

  const leftReport = buildSideReport(
    "left",
    left,
    truthThresholds,
    appThresholds,
    margin,
  );
  const rightReport = buildSideReport(
    "right",
    right,
    truthThresholds,
    appThresholds,
    margin,
  );

  const model: CalibrationModel = {
    version: 1,
    createdAt: generatedAt,
    left: leftReport.model,
    right: rightReport.model,
    metadata: {
      leftN: leftReport.n,
      rightN: rightReport.n,
      leftKind: leftReport.chosen,
      rightKind: rightReport.chosen,
    },
  };

  return {
    generatedAt,
    truthThresholds,
    appThresholds,
    left: leftReport,
    right: rightReport,
    model,
  };
}

// ---------------------------------------------------------------------------
// Text formatting
// ---------------------------------------------------------------------------

const f1 = (v: number) => v.toFixed(1);
const f2 = (v: number) => v.toFixed(2);

function formatSide(r: SideReport): string {
  const lines: string[] = [];
  lines.push(`── Côté ${r.side === "left" ? "GAUCHE" : "DROIT"} (n=${r.n}) ──`);
  if (r.n === 0) {
    lines.push("  Aucun échantillon.");
    return lines.join("\n");
  }

  lines.push("  Sélection de modèle (LOOCV MAE, ° — plus bas = mieux) :");
  for (const c of r.candidates) {
    const mark = c.kind === r.chosen ? " ◄ retenu" : "";
    lines.push(
      `    ${c.kind.padEnd(9)} MAE=${f2(c.loocvMae)}  RMSE=${f2(c.loocvRmse)}  biais=${f2(c.loocvBias)}${mark}`,
    );
  }

  const { coefficients: co } = r.model;
  const sign = co.b >= 0 ? "+" : "−";
  lines.push(
    `  Modèle retenu : ${r.chosen} → corrigé = ${f2(co.a)}·prédit ${sign} ${f2(Math.abs(co.b))}`,
  );
  lines.push(
    `  Gain vs brut : MAE ${f2(r.baselineMae)}° → ${f2(r.loocv.mae)}° (out-of-sample)`,
  );

  const ba = r.blandAltman;
  lines.push(
    `  Bland-Altman (résiduel après calibration) : biais ${f2(ba.bias)}°, ` +
      `limites d'agrément [${f2(ba.lowerLoA)}° ; ${f2(ba.upperLoA)}°]`,
  );
  lines.push(
    `    → variance irréductible (rotation/perspective) ≈ ±${f1(1.96 * ba.sd)}°`,
  );

  lines.push(
    `  Classification clinique (équilibrée) : brut ${(r.clinicalRaw.balancedAccuracy * 100).toFixed(0)}%` +
      ` → calibré ${(r.clinicalCalibrated.balancedAccuracy * 100).toFixed(0)}%`,
  );
  const st = r.suggestedThresholds;
  lines.push(
    `  Seuils empiriques suggérés (sur HKA calibré) : varum<${f1(st.thresholds.varumBelow)}°, ` +
      `valgum>${f1(st.thresholds.valgumAbove)}° (acc. équilibrée ${(st.balancedAccuracy * 100).toFixed(0)}%)`,
  );

  return lines.join("\n");
}

/** Render a human-readable text report. */
export function formatCalibrationReport(report: CalibrationReport): string {
  const lines: string[] = [];
  lines.push("═══════════════════════════════════════════════════════");
  lines.push(" RAPPORT DE CALIBRATION HKA — BodyOrthox");
  lines.push(`  généré : ${report.generatedAt}`);
  lines.push(
    `  seuils vérité (radio) : varum<${report.truthThresholds.varumBelow}°, valgum>${report.truthThresholds.valgumAbove}°`,
  );
  lines.push("═══════════════════════════════════════════════════════");
  lines.push("");
  lines.push(formatSide(report.left));
  lines.push("");
  lines.push(formatSide(report.right));
  lines.push("");
  lines.push("Note : toutes les erreurs sont en validation croisée");
  lines.push("leave-one-out (out-of-sample). La calibration retire le BIAIS ;");
  lines.push("les limites d'agrément quantifient ce qu'elle ne peut PAS retirer.");
  return lines.join("\n");
}
