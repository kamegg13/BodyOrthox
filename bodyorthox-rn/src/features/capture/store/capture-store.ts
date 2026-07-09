import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { CapturePhase } from "../domain/capture-state";
import { Analysis, CreateAnalysisInput } from "../domain/analysis";
import { IAnalysisRepository } from "../data/analysis-repository";
import {
  calculateKneeAngle,
  calculateHipAngle,
  calculateAnkleAngle,
  calculateConfidenceScore,
  calculateBilateralAngles,
  PoseLandmarks,
} from "../data/angle-calculator";
import type { BilateralAngles } from "../data/angle-calculator";
import type { AnatomicalValidation } from "../data/anatomical-validation";
import { INotificationService } from "../../../core/notifications/notification-types";
import { getActiveCalibrationModel } from "../calibration/calibration-store";
import { applyCalibrationToBilateral } from "../calibration/apply-calibration";
import { ApiError } from "../../../core/api/api-client";

declare const __DEV__: boolean;

/**
 * Human-readable, cause-aware message for a failed analysis save.
 * Distinguishes auth/session errors from generic network failures so the
 * UI can surface something actionable instead of swallowing the error.
 */
function saveErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Session expirée — reconnectez-vous pour enregistrer l'analyse.";
    }
    return `Échec de l'enregistrement (code ${error.status}).`;
  }
  return "Impossible d'enregistrer l'analyse — vérifiez votre connexion.";
}

/**
 * Bilateral angles from landmarks, with the active HKA calibration applied
 * (if any). Single source of truth so the live preview and the persisted
 * analysis never disagree, and calibration is applied exactly once.
 */
function bilateralFrom(landmarks: PoseLandmarks): BilateralAngles {
  const raw = calculateBilateralAngles(landmarks);
  const model = getActiveCalibrationModel();
  return model ? applyCalibrationToBilateral(raw, model) : raw;
}

interface CaptureState {
  phase: CapturePhase;
  frameCount: number;
  luminosity: number; // 0-255
  isCorrectPosition: boolean;
  capturedImageUrl: string | null;
  detectedLandmarks: PoseLandmarks | null;
  allDetectedLandmarks: PoseLandmarks | null;
}

interface CaptureActions {
  setRepository(repo: IAnalysisRepository): void;
  setNotificationService(service: INotificationService): void;
  requestPermission(): void;
  permissionGranted(): void;
  permissionDenied(message: string): void;
  startRecording(): void;
  addFrame(): void;
  /** Current session token — capture before an async op, re-check on resolve. */
  sessionToken(): number;
  processFrames(
    landmarks: PoseLandmarks,
    allLandmarks?: PoseLandmarks,
    anatomicalValidation?: AnatomicalValidation,
    sessionToken?: number,
  ): void;
  saveAnalysis(
    patientId: string,
    correctedLandmarks?: PoseLandmarks,
  ): Promise<Analysis | null>;
  sendAnalysisReadyNotification(patientName: string): Promise<void>;
  setLuminosity(value: number): void;
  setCorrectPosition(correct: boolean): void;
  reset(): void;
  setError(message: string): void;
  setCapturedImageUrl(url: string | null): void;
}

// Module-level (non-reactive) — these don't trigger re-renders and are
// intentionally outside the Zustand store to avoid serialization issues.
let _repository: IAnalysisRepository | null = null;
let _notificationService: INotificationService | null = null;
let _pendingAngles: {
  kneeAngle: number;
  hipAngle: number;
  ankleAngle: number;
} | null = null;
let _pendingBilateralAngles: BilateralAngles | null = null;
let _pendingConfidence = 0;
// Monotonic session token. Incremented on every reset() and every analysis
// launch (startRecording). Async callbacks capture the token in flight and
// drop their result if the session has since changed — this prevents a slow
// resolution from one patient contaminating the next.
let _sessionToken = 0;

export const useCaptureStore = create<CaptureState & CaptureActions>()(
  immer((set, _get) => ({
    phase: { type: "idle" },
    frameCount: 0,
    luminosity: 128,
    isCorrectPosition: false,
    capturedImageUrl: null,
    detectedLandmarks: null,
    allDetectedLandmarks: null,

    setRepository(repo: IAnalysisRepository) {
      _repository = repo;
    },

    setNotificationService(service: INotificationService) {
      _notificationService = service;
    },

    requestPermission() {
      set((state) => {
        state.phase = { type: "requesting_permission" };
      });
    },

    permissionGranted() {
      set((state) => {
        state.phase = { type: "ready" };
      });
    },

    permissionDenied(message: string) {
      set((state) => {
        state.phase = { type: "permission_denied", message };
      });
    },

    startRecording() {
      // New analysis launch — invalidate any in-flight callback from a
      // previous attempt/patient.
      _sessionToken++;
      set((state) => {
        state.phase = { type: "recording", frameCount: 0 };
        state.frameCount = 0;
      });
    },

    sessionToken() {
      return _sessionToken;
    },

    addFrame() {
      set((state) => {
        if (state.phase.type === "recording") {
          state.frameCount++;
          state.phase = { type: "recording", frameCount: state.frameCount };
        }
      });
    },

    processFrames(
      landmarks: PoseLandmarks,
      allLandmarks?: PoseLandmarks,
      anatomicalValidation?: AnatomicalValidation,
      sessionToken?: number,
    ) {
      // Drop results from a stale session (patient switched / screen remounted).
      if (sessionToken !== undefined && sessionToken !== _sessionToken) return;

      const kneeAngle = calculateKneeAngle(landmarks);
      const hipAngle = calculateHipAngle(landmarks);
      const ankleAngle = calculateAnkleAngle(landmarks);
      const confidenceScore = calculateConfidenceScore(landmarks);
      const bilateralAngles = bilateralFrom(landmarks);

      _pendingAngles = { kneeAngle, hipAngle, ankleAngle };
      _pendingBilateralAngles = bilateralAngles;
      _pendingConfidence = confidenceScore;

      set((state) => {
        state.detectedLandmarks = landmarks;
        state.allDetectedLandmarks = allLandmarks ?? null;
        state.phase = {
          type: "success",
          angles: { kneeAngle, hipAngle, ankleAngle },
          bilateralAngles,
          confidenceScore,
          anatomicalValidation: anatomicalValidation
            ? {
                ...anatomicalValidation,
                warnings: [...anatomicalValidation.warnings],
              }
            : undefined,
        };
      });
    },

    async saveAnalysis(
      patientId: string,
      correctedLandmarks?: PoseLandmarks,
    ): Promise<Analysis | null> {
      if (!_repository || !_pendingAngles) return null;
      const token = _sessionToken;
      try {
        const state = _get();
        const hasCorrectedLandmarks = !!correctedLandmarks;

        // If corrected landmarks are provided, recalculate angles from them
        const angles = hasCorrectedLandmarks
          ? {
              kneeAngle: calculateKneeAngle(correctedLandmarks),
              hipAngle: calculateHipAngle(correctedLandmarks),
              ankleAngle: calculateAnkleAngle(correctedLandmarks),
            }
          : _pendingAngles;

        const bilateralAngles = hasCorrectedLandmarks
          ? bilateralFrom(correctedLandmarks)
          : (_pendingBilateralAngles ?? undefined);

        const input: CreateAnalysisInput = {
          patientId,
          angles,
          bilateralAngles,
          confidenceScore: _pendingConfidence,
          capturedImageUrl: state.capturedImageUrl ?? undefined,
          allLandmarks:
            correctedLandmarks ?? state.allDetectedLandmarks ?? undefined,
          manualCorrectionApplied: hasCorrectedLandmarks,
        };
        const analysis = await _repository.create(input);
        // Session changed while the create was in flight (patient switch) —
        // discard silently without touching the new session's pending state.
        if (token !== _sessionToken) return null;
        _pendingAngles = null;
        _pendingBilateralAngles = null;
        _pendingConfidence = 0;
        return analysis;
      } catch (error) {
        if (__DEV__) {
          console.error("[capture-store] saveAnalysis failed:", error);
        }
        // Only surface / clean up if this is still the active session.
        if (token !== _sessionToken) return null;
        _pendingAngles = null;
        _pendingBilateralAngles = null;
        _pendingConfidence = 0;
        set((state) => {
          state.phase = { type: "error", message: saveErrorMessage(error) };
        });
        return null;
      }
    },

    async sendAnalysisReadyNotification(patientName: string): Promise<void> {
      if (!_notificationService) return;

      const phase = _get().phase;
      if (phase.type !== "success") return;

      // Request permission contextually (the service handles deduplication)
      await _notificationService.requestPermission();
      await _notificationService.sendAnalysisReady(patientName, phase.angles);
    },

    setLuminosity(value: number) {
      set((state) => {
        state.luminosity = Math.max(0, Math.min(255, value));
      });
    },

    setCorrectPosition(correct: boolean) {
      set((state) => {
        state.isCorrectPosition = correct;
      });
    },

    reset() {
      // Invalidate any in-flight async callback tied to the previous session.
      _sessionToken++;
      _pendingAngles = null;
      _pendingBilateralAngles = null;
      _pendingConfidence = 0;
      set((state) => {
        state.phase = { type: "idle" };
        state.frameCount = 0;
        state.luminosity = 128;
        state.isCorrectPosition = false;
        state.capturedImageUrl = null;
        state.detectedLandmarks = null;
        state.allDetectedLandmarks = null;
      });
    },

    setError(message: string) {
      set((state) => {
        state.phase = { type: "error", message };
      });
    },

    setCapturedImageUrl(url: string | null) {
      set((state) => {
        state.capturedImageUrl = url;
      });
    },
  })),
);
