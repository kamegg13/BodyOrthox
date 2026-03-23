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
import { INotificationService } from "../../../core/notifications/notification-types";

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
  processFrames(landmarks: PoseLandmarks, allLandmarks?: PoseLandmarks): void;
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
      set((state) => {
        state.phase = { type: "recording", frameCount: 0 };
        state.frameCount = 0;
      });
    },

    addFrame() {
      set((state) => {
        if (state.phase.type === "recording") {
          state.frameCount++;
          state.phase = { type: "recording", frameCount: state.frameCount };
        }
      });
    },

    processFrames(landmarks: PoseLandmarks, allLandmarks?: PoseLandmarks) {
      const kneeAngle = calculateKneeAngle(landmarks);
      const hipAngle = calculateHipAngle(landmarks);
      const ankleAngle = calculateAnkleAngle(landmarks);
      const confidenceScore = calculateConfidenceScore(landmarks);
      const bilateralAngles = calculateBilateralAngles(landmarks);

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
        };
      });
    },

    async saveAnalysis(
      patientId: string,
      correctedLandmarks?: PoseLandmarks,
    ): Promise<Analysis | null> {
      if (!_repository || !_pendingAngles) return null;
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
          ? calculateBilateralAngles(correctedLandmarks)
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
        _pendingAngles = null;
        _pendingBilateralAngles = null;
        _pendingConfidence = 0;
        return analysis;
      } catch {
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
