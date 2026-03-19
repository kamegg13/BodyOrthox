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
  PoseLandmarks,
} from "../data/angle-calculator";

interface CaptureState {
  phase: CapturePhase;
  frameCount: number;
  luminosity: number; // 0-255
  isCorrectPosition: boolean;
  capturedImageUrl: string | null;
}

interface CaptureActions {
  setRepository(repo: IAnalysisRepository): void;
  requestPermission(): void;
  permissionGranted(): void;
  permissionDenied(message: string): void;
  startRecording(): void;
  addFrame(): void;
  processFrames(landmarks: PoseLandmarks): void;
  saveAnalysis(patientId: string): Promise<Analysis | null>;
  setLuminosity(value: number): void;
  setCorrectPosition(correct: boolean): void;
  reset(): void;
  setError(message: string): void;
  setCapturedImageUrl(url: string | null): void;
}

let _repository: IAnalysisRepository | null = null;
let _pendingAngles: {
  kneeAngle: number;
  hipAngle: number;
  ankleAngle: number;
} | null = null;
let _pendingConfidence = 0;

export const useCaptureStore = create<CaptureState & CaptureActions>()(
  immer((set, _get) => ({
    phase: { type: "idle" },
    frameCount: 0,
    luminosity: 128,
    isCorrectPosition: false,
    capturedImageUrl: null,

    setRepository(repo: IAnalysisRepository) {
      _repository = repo;
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

    processFrames(landmarks: PoseLandmarks) {
      const kneeAngle = calculateKneeAngle(landmarks);
      const hipAngle = calculateHipAngle(landmarks);
      const ankleAngle = calculateAnkleAngle(landmarks);
      const confidenceScore = calculateConfidenceScore(landmarks);

      _pendingAngles = { kneeAngle, hipAngle, ankleAngle };
      _pendingConfidence = confidenceScore;

      set((state) => {
        state.phase = {
          type: "success",
          angles: { kneeAngle, hipAngle, ankleAngle },
          confidenceScore,
        };
      });
    },

    async saveAnalysis(patientId: string): Promise<Analysis | null> {
      if (!_repository || !_pendingAngles) return null;
      try {
        const input: CreateAnalysisInput = {
          patientId,
          angles: _pendingAngles,
          confidenceScore: _pendingConfidence,
        };
        const analysis = await _repository.create(input);
        _pendingAngles = null;
        _pendingConfidence = 0;
        return analysis;
      } catch {
        return null;
      }
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
      _pendingConfidence = 0;
      set((state) => {
        state.phase = { type: "idle" };
        state.frameCount = 0;
        state.luminosity = 128;
        state.isCorrectPosition = false;
        state.capturedImageUrl = null;
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
