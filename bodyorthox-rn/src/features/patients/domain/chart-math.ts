/**
 * Helpers mathématiques purs du graphique de progression (ProgressionChart) —
 * extraits pour être testés isolément, sans dépendance à React Native.
 */
import { Analysis } from "../../capture/domain/analysis";
import { formatDisplayDate } from "../../../shared/utils/date-utils";
import { HKA_REF_MIN, HKA_REF_MAX, hkaDeviation, type HkaRangeStatus } from "../../../shared/domain/hka-range";

export interface ChartDataPoint {
  readonly date: string;
  readonly timestamp: number;
  readonly kneeAngle: number;
  readonly hipAngle: number;
  readonly ankleAngle: number;
}

/** Trie les analyses par date croissante et projette les seules valeurs utiles au graphique. */
export function prepareChartData(
  analyses: ReadonlyArray<Analysis>,
): ReadonlyArray<ChartDataPoint> {
  const sorted = [...analyses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return sorted.map((a) => ({
    date: formatDisplayDate(new Date(a.createdAt)),
    timestamp: new Date(a.createdAt).getTime(),
    kneeAngle: a.angles.kneeAngle,
    hipAngle: a.angles.hipAngle,
    ankleAngle: a.angles.ankleAngle,
  }));
}

/** Plage de l'axe Y — inclut toujours la plage de référence HKA, arrondie à la dizaine. */
export function getAngleRange(data: ReadonlyArray<ChartDataPoint>): {
  min: number;
  max: number;
} {
  if (data.length === 0) return { min: 0, max: 180 };

  const allValues = data.flatMap((d) => [d.kneeAngle, d.hipAngle, d.ankleAngle]);
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);

  // Extend range to include normal zone if it overlaps or is near
  const extendedMin = Math.min(rawMin, HKA_REF_MIN);
  const extendedMax = Math.max(rawMax, HKA_REF_MAX);

  // Round to nearest 10 for clean graduations
  const min = Math.max(0, Math.floor((extendedMin - 5) / 10) * 10);
  const max = Math.min(360, Math.ceil((extendedMax + 5) / 10) * 10);

  return { min, max };
}

/** Régression linéaire simple (moindres carrés) — utilisée pour les lignes de tendance. */
export function linearRegression(points: ReadonlyArray<{ x: number; y: number }>): {
  slope: number;
  intercept: number;
} {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;

  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/** Position factuelle d'un angle vs plage de référence — mêmes bornes que hka-range.ts. */
export function angleRangeStatus(angle: number): HkaRangeStatus {
  const deviation = hkaDeviation(angle);
  if (deviation === null) return "unavailable";
  return deviation === 0 ? "in_range" : "out_of_range";
}

/** Génère les graduations de l'axe Y tous les 10 degrés. */
export function generateYGraduations(min: number, max: number): ReadonlyArray<number> {
  const graduations: number[] = [];
  const start = Math.ceil(min / 10) * 10;
  for (let v = start; v <= max; v += 10) {
    graduations.push(v);
  }
  return graduations;
}
