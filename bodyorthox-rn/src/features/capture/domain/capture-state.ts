import { ArticularAngles } from "./analysis";
import type { BilateralAngles } from "../data/angle-calculator";
import type { AnatomicalValidation } from "../data/anatomical-validation";

export type CapturePhase =
  | { type: "idle" }
  | { type: "requesting_permission" }
  | { type: "permission_denied"; message: string }
  | { type: "ready" }
  | { type: "recording"; frameCount: number }
  | { type: "processing" }
  | {
      type: "success";
      angles: ArticularAngles;
      bilateralAngles: BilateralAngles;
      confidenceScore: number;
      anatomicalValidation?: AnatomicalValidation;
    }
  | { type: "error"; message: string };

export function isCapturing(phase: CapturePhase): boolean {
  return phase.type === "recording" || phase.type === "processing";
}

export function isCompleted(phase: CapturePhase): boolean {
  return phase.type === "success";
}
