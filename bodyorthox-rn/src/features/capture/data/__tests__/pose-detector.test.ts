import type { PoseLandmarks } from "../angle-calculator";

/**
 * We test the pure mapping/validation functions exported from the web
 * implementation. The MediaPipe SDK itself is not available in the test
 * environment (it requires WASM + browser), so we test the functions
 * that transform its output.
 *
 * We import them via require to avoid the MediaPipe SDK import at module
 * scope — the test runner doesn't have WASM support.
 */

// Mock @mediapipe/tasks-vision so the module can be loaded in Node
jest.mock("@mediapipe/tasks-vision", () => ({
  PoseLandmarker: {
    createFromOptions: jest.fn(),
  },
  FilesetResolver: {
    forVisionTasks: jest.fn(),
  },
}));

// Now we can safely import the pure functions
import {
  mediapipeToPoseLandmarks,
  hasValidPose,
  NoPoseDetectedError,
  getPoseDetector,
} from "../pose-detector.web";
import { calculateConfidenceScore } from "../angle-calculator";

describe("mediapipeToPoseLandmarks", () => {
  it("should extract only relevant landmark indices (11,12,23-30)", () => {
    // Create a 33-point array (MediaPipe full pose)
    const mpLandmarks = Array.from({ length: 33 }, (_, i) => ({
      x: i * 0.01,
      y: i * 0.02,
      z: 0,
      visibility: 0.9,
    }));

    const result = mediapipeToPoseLandmarks(mpLandmarks);

    // Should only have the 10 relevant indices
    const expectedIndices = [11, 12, 23, 24, 25, 26, 27, 28, 29, 30];
    const resultIndices = Object.keys(result).map(Number);
    expect(resultIndices.sort((a, b) => a - b)).toEqual(expectedIndices);

    // Verify values are correctly mapped
    expect(result[11]).toEqual({ x: 0.11, y: 0.22, visibility: 0.9 });
    expect(result[24]).toEqual({ x: 0.24, y: 0.48, visibility: 0.9 });
  });

  it("should handle missing visibility by defaulting to 0", () => {
    const mpLandmarks = Array.from({ length: 33 }, (_, i) => ({
      x: i * 0.01,
      y: i * 0.02,
      z: 0,
      // visibility intentionally omitted
    }));

    const result = mediapipeToPoseLandmarks(
      mpLandmarks as Array<{
        x: number;
        y: number;
        z: number;
        visibility?: number;
      }>,
    );

    expect(result[11]?.visibility).toBe(0);
  });

  it("should skip missing landmarks gracefully", () => {
    // Sparse array — only a few landmarks present
    const mpLandmarks: Array<
      { x: number; y: number; visibility: number } | undefined
    > = new Array(33).fill(undefined);
    mpLandmarks[11] = { x: 0.4, y: 0.2, visibility: 0.95 };
    mpLandmarks[24] = { x: 0.5, y: 0.5, visibility: 0.9 };

    const result = mediapipeToPoseLandmarks(
      mpLandmarks as Array<{ x: number; y: number; visibility: number }>,
    );

    expect(result[11]).toBeDefined();
    expect(result[24]).toBeDefined();
    expect(result[12]).toBeUndefined();
    expect(result[23]).toBeUndefined();
  });
});

describe("calculateConfidenceScore", () => {
  it("should return average visibility of present landmarks", () => {
    const landmarks: PoseLandmarks = {
      11: { x: 0, y: 0, visibility: 0.9 },
      12: { x: 0, y: 0, visibility: 0.8 },
      23: { x: 0, y: 0, visibility: 0.7 },
    };

    const confidence = calculateConfidenceScore(landmarks);
    expect(confidence).toBeCloseTo(0.8, 5);
  });

  it("should return 0 when no landmarks have visibility", () => {
    const landmarks: PoseLandmarks = {};
    expect(calculateConfidenceScore(landmarks)).toBe(0);
  });

  it("should exclude landmarks with visibility 0", () => {
    const landmarks: PoseLandmarks = {
      11: { x: 0, y: 0, visibility: 0.9 },
      12: { x: 0, y: 0, visibility: 0 },
      23: { x: 0, y: 0, visibility: 0.5 },
    };

    const confidence = calculateConfidenceScore(landmarks);
    // Only 0.9 and 0.5 should count
    expect(confidence).toBeCloseTo(0.7, 5);
  });
});

describe("hasValidPose", () => {
  it("should return true when right side has sufficient visibility", () => {
    const landmarks: PoseLandmarks = {
      24: { x: 0, y: 0, visibility: 0.9 }, // right hip
      26: { x: 0, y: 0, visibility: 0.8 }, // right knee
      28: { x: 0, y: 0, visibility: 0.7 }, // right ankle
    };

    expect(hasValidPose(landmarks)).toBe(true);
  });

  it("should return true when left side has sufficient visibility", () => {
    const landmarks: PoseLandmarks = {
      23: { x: 0, y: 0, visibility: 0.5 }, // left hip
      25: { x: 0, y: 0, visibility: 0.6 }, // left knee
      27: { x: 0, y: 0, visibility: 0.4 }, // left ankle
    };

    expect(hasValidPose(landmarks)).toBe(true);
  });

  it("should return false when all landmarks have low visibility", () => {
    const landmarks: PoseLandmarks = {
      24: { x: 0, y: 0, visibility: 0.1 },
      26: { x: 0, y: 0, visibility: 0.2 },
      28: { x: 0, y: 0, visibility: 0.1 },
      23: { x: 0, y: 0, visibility: 0.15 },
      25: { x: 0, y: 0, visibility: 0.1 },
      27: { x: 0, y: 0, visibility: 0.2 },
    };

    expect(hasValidPose(landmarks)).toBe(false);
  });

  it("should return false when landmarks are missing", () => {
    const landmarks: PoseLandmarks = {};
    expect(hasValidPose(landmarks)).toBe(false);
  });

  it("should return false when only partial landmarks on each side", () => {
    const landmarks: PoseLandmarks = {
      24: { x: 0, y: 0, visibility: 0.9 }, // right hip
      // right knee missing
      28: { x: 0, y: 0, visibility: 0.9 }, // right ankle
      23: { x: 0, y: 0, visibility: 0.9 }, // left hip
      25: { x: 0, y: 0, visibility: 0.9 }, // left knee
      // left ankle missing
    };

    expect(hasValidPose(landmarks)).toBe(false);
  });
});

describe("NoPoseDetectedError", () => {
  it("should have correct name and message", () => {
    const error = new NoPoseDetectedError("test message");
    expect(error.name).toBe("NoPoseDetectedError");
    expect(error.message).toBe("test message");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("getPoseDetector", () => {
  it("should return a singleton instance", () => {
    const detector1 = getPoseDetector();
    const detector2 = getPoseDetector();
    expect(detector1).toBe(detector2);
  });

  it("should implement the IPoseDetector interface", () => {
    const detector = getPoseDetector();
    expect(typeof detector.initialize).toBe("function");
    expect(typeof detector.detect).toBe("function");
    expect(typeof detector.isReady).toBe("function");
    expect(typeof detector.dispose).toBe("function");
  });
});
