import { generateId } from "../../../shared/utils/generate-id";
import type { BilateralAngles, PoseLandmarks } from "../data/angle-calculator";

export interface ArticularAngles {
  readonly kneeAngle: number; // degrees, 1 decimal
  readonly hipAngle: number;
  readonly ankleAngle: number;
}

export interface Analysis {
  readonly id: string;
  readonly patientId: string;
  readonly createdAt: string; // ISO 8601 UTC
  readonly angles: ArticularAngles;
  readonly bilateralAngles?: BilateralAngles;
  readonly confidenceScore: number; // [0.0, 1.0]
  readonly manualCorrectionApplied: boolean;
  readonly manualCorrectionJoint: "knee" | "hip" | "ankle" | null;
  readonly capturedImageUrl?: string; // base64 data URL, optional
  readonly allLandmarks?: PoseLandmarks; // all 33 landmarks, optional
}

export interface CreateAnalysisInput {
  patientId: string;
  angles: ArticularAngles;
  bilateralAngles?: BilateralAngles;
  confidenceScore: number;
  manualCorrectionApplied?: boolean;
  manualCorrectionJoint?: "knee" | "hip" | "ankle" | null;
  capturedImageUrl?: string;
  allLandmarks?: PoseLandmarks;
}

export function createAnalysis(input: CreateAnalysisInput): Analysis {
  if (!input.patientId) throw new Error("patientId est obligatoire");
  if (input.confidenceScore < 0 || input.confidenceScore > 1) {
    throw new Error("confidenceScore doit être entre 0 et 1");
  }
  return {
    id: generateId(),
    patientId: input.patientId,
    createdAt: new Date().toISOString(),
    angles: {
      kneeAngle: Math.round(input.angles.kneeAngle * 10) / 10,
      hipAngle: Math.round(input.angles.hipAngle * 10) / 10,
      ankleAngle: Math.round(input.angles.ankleAngle * 10) / 10,
    },
    bilateralAngles: input.bilateralAngles,
    confidenceScore: input.confidenceScore,
    manualCorrectionApplied: input.manualCorrectionApplied ?? false,
    manualCorrectionJoint: input.manualCorrectionJoint ?? null,
    capturedImageUrl: input.capturedImageUrl,
    allLandmarks: input.allLandmarks,
  };
}

export function confidenceLabel(score: number): string {
  if (score >= 0.85) return "Élevée";
  if (score >= 0.6) return "Moyenne";
  return "Faible";
}
