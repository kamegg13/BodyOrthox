/**
 * Clinical reference norms for articular angles.
 * Based on standard physiotherapy reference values.
 */

import { Colors } from "../../../shared/design-system/colors";

export interface ReferenceNorm {
  readonly joint: "knee" | "hip" | "ankle";
  readonly label: string;
  readonly normalMin: number;
  readonly normalMax: number;
  readonly unit: string;
}

export const REFERENCE_NORMS: Record<string, ReferenceNorm> = {
  knee: {
    joint: "knee",
    label: "Genou",
    normalMin: 170,
    normalMax: 180, // near full extension in frontal standing
    unit: "°",
  },
  hip: {
    joint: "hip",
    label: "Hanche",
    normalMin: 170,
    normalMax: 180, // full extension range in standing
    unit: "°",
  },
  ankle: {
    joint: "ankle",
    label: "Cheville",
    normalMin: 170,
    normalMax: 180, // frontal standing: knee-ankle-foot nearly straight
    unit: "°",
  },
};

export type DeviationLevel = "normal" | "mild" | "moderate" | "severe";

export interface AngleAssessment {
  value: number;
  norm: ReferenceNorm;
  deviation: number;
  level: DeviationLevel;
  isWithinNorm: boolean;
}

export function assessAngle(
  joint: "knee" | "hip" | "ankle",
  value: number,
): AngleAssessment {
  const norm = REFERENCE_NORMS[joint];
  if (!norm) throw new Error(`Unknown joint: ${joint}`);
  const isWithinNorm = value >= norm.normalMin && value <= norm.normalMax;
  const deviation = isWithinNorm
    ? 0
    : value < norm.normalMin
      ? norm.normalMin - value
      : value - norm.normalMax;

  let level: DeviationLevel;
  if (isWithinNorm) level = "normal";
  else if (deviation <= 5) level = "mild";
  else if (deviation <= 15) level = "moderate";
  else level = "severe";

  return { value, norm, deviation, level, isWithinNorm };
}

export function deviationColor(level: DeviationLevel): string {
  switch (level) {
    case "normal":
      return Colors.success;
    case "mild":
      return Colors.warning;
    case "moderate":
      return Colors.warningModerate;
    case "severe":
      return Colors.error;
  }
}
