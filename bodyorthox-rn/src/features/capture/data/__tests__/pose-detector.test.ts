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
  mediapipeToAllLandmarks,
  hasValidPose,
  NoPoseDetectedError,
  getPoseDetector,
  remapCropLandmark,
  averageLandmarks,
  calculateShoulderTilt,
  computeLegBoundingBox,
  remapRoiLandmark,
  mergeRoiResults,
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

    // Verify values are correctly mapped (including z coordinate)
    expect(result[11]).toEqual({ x: 0.11, y: 0.22, z: 0, visibility: 0.9 });
    expect(result[24]).toEqual({ x: 0.24, y: 0.48, z: 0, visibility: 0.9 });
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

describe("mediapipeToAllLandmarks", () => {
  it("should extract all 33 landmark indices", () => {
    const mpLandmarks = Array.from({ length: 33 }, (_, i) => ({
      x: i * 0.01,
      y: i * 0.02,
      z: 0,
      visibility: 0.9,
    }));

    const result = mediapipeToAllLandmarks(mpLandmarks);

    const resultIndices = Object.keys(result)
      .map(Number)
      .sort((a, b) => a - b);
    const expectedIndices = Array.from({ length: 33 }, (_, i) => i);
    expect(resultIndices).toEqual(expectedIndices);
  });

  it("should handle missing visibility by defaulting to 0", () => {
    const mpLandmarks = Array.from({ length: 33 }, (_, i) => ({
      x: i * 0.01,
      y: i * 0.02,
      z: 0,
    }));

    const result = mediapipeToAllLandmarks(
      mpLandmarks as Array<{
        x: number;
        y: number;
        z: number;
        visibility?: number;
      }>,
    );

    expect(result[0]?.visibility).toBe(0);
    expect(result[32]?.visibility).toBe(0);
  });

  it("should skip undefined entries gracefully", () => {
    const mpLandmarks: Array<
      { x: number; y: number; visibility: number } | undefined
    > = new Array(33).fill(undefined);
    mpLandmarks[0] = { x: 0.1, y: 0.2, visibility: 0.95 };
    mpLandmarks[32] = { x: 0.5, y: 0.5, visibility: 0.9 };

    const result = mediapipeToAllLandmarks(
      mpLandmarks as Array<{ x: number; y: number; visibility: number }>,
    );

    expect(result[0]).toBeDefined();
    expect(result[32]).toBeDefined();
    expect(result[15]).toBeUndefined();
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

describe("mediapipeToPoseLandmarks z-coordinate", () => {
  it("should include z coordinate from MediaPipe landmarks", () => {
    const mpLandmarks = Array.from({ length: 33 }, (_, i) => ({
      x: i * 0.01,
      y: i * 0.02,
      z: i * 0.001,
      visibility: 0.9,
    }));

    const result = mediapipeToPoseLandmarks(mpLandmarks);

    expect(result[11]?.z).toBeCloseTo(0.011, 5);
    expect(result[24]?.z).toBeCloseTo(0.024, 5);
  });

  it("should default z to 0 when not provided", () => {
    const mpLandmarks = Array.from({ length: 33 }, (_, i) => ({
      x: i * 0.01,
      y: i * 0.02,
      visibility: 0.9,
    }));

    const result = mediapipeToPoseLandmarks(
      mpLandmarks as Array<{
        x: number;
        y: number;
        z?: number;
        visibility: number;
      }>,
    );

    expect(result[11]?.z).toBe(0);
  });
});

describe("remapCropLandmark", () => {
  it("should remap center of cropped image to center of original", () => {
    const landmark = { x: 0.5, y: 0.5, z: 0.1, visibility: 0.9 };
    const remapped = remapCropLandmark(landmark, 0.95);

    // Center should map to center: offset + 0.5 * cropPercent
    // = (1-0.95)/2 + 0.5 * 0.95 = 0.025 + 0.475 = 0.5
    expect(remapped.x).toBeCloseTo(0.5, 5);
    expect(remapped.y).toBeCloseTo(0.5, 5);
  });

  it("should remap top-left corner back to crop origin", () => {
    const landmark = { x: 0, y: 0, z: 0, visibility: 0.9 };
    const remapped = remapCropLandmark(landmark, 0.9);

    // offset = (1-0.9)/2 = 0.05
    expect(remapped.x).toBeCloseTo(0.05, 5);
    expect(remapped.y).toBeCloseTo(0.05, 5);
  });

  it("should remap bottom-right corner to crop end", () => {
    const landmark = { x: 1, y: 1, z: 0, visibility: 0.9 };
    const remapped = remapCropLandmark(landmark, 0.9);

    // offset + 1 * 0.9 = 0.05 + 0.9 = 0.95
    expect(remapped.x).toBeCloseTo(0.95, 5);
    expect(remapped.y).toBeCloseTo(0.95, 5);
  });

  it("should preserve z and visibility", () => {
    const landmark = { x: 0.5, y: 0.5, z: 0.3, visibility: 0.85 };
    const remapped = remapCropLandmark(landmark, 0.95);

    expect(remapped.z).toBe(0.3);
    expect(remapped.visibility).toBe(0.85);
  });
});

describe("averageLandmarks", () => {
  it("should return input directly for single result", () => {
    const landmarks = [
      { x: 0.5, y: 0.5, z: 0.1, visibility: 0.9 },
      { x: 0.3, y: 0.7, z: 0.2, visibility: 0.8 },
    ];
    const variations = [{ type: "original" as const }];

    const averaged = averageLandmarks([landmarks], variations);
    expect(averaged).toBe(landmarks);
  });

  it("should average two identical results to the same values", () => {
    const lm1 = [{ x: 0.5, y: 0.5, z: 0.1, visibility: 0.9 }];
    const lm2 = [{ x: 0.5, y: 0.5, z: 0.1, visibility: 0.9 }];
    const variations = [
      { type: "original" as const },
      { type: "brightness" as const },
    ];

    const averaged = averageLandmarks([lm1, lm2], variations);
    expect(averaged[0].x).toBeCloseTo(0.5, 5);
    expect(averaged[0].y).toBeCloseTo(0.5, 5);
    expect(averaged[0].z).toBeCloseTo(0.1, 5);
    expect(averaged[0].visibility).toBeCloseTo(0.9, 5);
  });

  it("should weight by visibility", () => {
    // High visibility landmark at x=0.4, low visibility at x=0.6
    const lm1 = [{ x: 0.4, y: 0.5, z: 0, visibility: 0.9 }];
    const lm2 = [{ x: 0.6, y: 0.5, z: 0, visibility: 0.1 }];
    const variations = [
      { type: "original" as const },
      { type: "brightness" as const },
    ];

    const averaged = averageLandmarks([lm1, lm2], variations);
    // Should be closer to 0.4 due to higher weight of first pass
    expect(averaged[0].x).toBeLessThan(0.5);
  });

  it("should remap crop variation coordinates before averaging", () => {
    // Original: landmark at center (0.5, 0.5)
    const lm1 = [{ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }];
    // 90% crop: landmark at center (0.5, 0.5) should remap to (0.5, 0.5)
    const lm2 = [{ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }];
    const variations = [
      { type: "original" as const },
      { type: "crop" as const, cropPercent: 0.9 },
    ];

    const averaged = averageLandmarks([lm1, lm2], variations);
    // Center remaps to center, so average should still be ~0.5
    expect(averaged[0].x).toBeCloseTo(0.5, 3);
    expect(averaged[0].y).toBeCloseTo(0.5, 3);
  });

  it("should return empty array for empty input", () => {
    const averaged = averageLandmarks([], []);
    expect(averaged).toEqual([]);
  });

  it("should give high-visibility pass much more weight (visibility²)", () => {
    // Pass 1: visibility 0.9 → weight = 0.81
    // Pass 2: visibility 0.3 → weight = 0.09
    // Ratio ~9:1, so result should be very close to pass 1
    const lm1 = [{ x: 0.2, y: 0.3, z: 0.1, visibility: 0.9 }];
    const lm2 = [{ x: 0.8, y: 0.7, z: 0.5, visibility: 0.3 }];
    const variations = [
      { type: "original" as const },
      { type: "brightness" as const },
    ];

    const averaged = averageLandmarks([lm1, lm2], variations);
    // With weights 0.81 and 0.09: x = (0.2*0.81 + 0.8*0.09) / 0.90 = 0.26
    expect(averaged[0].x).toBeCloseTo(0.26, 1);
    expect(averaged[0].y).toBeCloseTo(0.34, 1);
  });

  it("should handle zero visibility with minimum weight floor", () => {
    const lm1 = [{ x: 0.5, y: 0.5, z: 0, visibility: 0 }];
    const lm2 = [{ x: 0.8, y: 0.8, z: 0, visibility: 0 }];
    const variations = [
      { type: "original" as const },
      { type: "brightness" as const },
    ];

    const averaged = averageLandmarks([lm1, lm2], variations);
    // Both have weight 0.0001, so simple average
    expect(averaged[0].x).toBeCloseTo(0.65, 3);
    expect(averaged[0].y).toBeCloseTo(0.65, 3);
  });
});

describe("calculateShoulderTilt", () => {
  it("should return 0 when shoulders are level", () => {
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0,
      y: 0,
      z: 0,
      visibility: 0,
    }));
    landmarks[11] = { x: 0.3, y: 0.4, z: 0, visibility: 0.9 };
    landmarks[12] = { x: 0.7, y: 0.4, z: 0, visibility: 0.9 };

    const tilt = calculateShoulderTilt(landmarks);
    expect(tilt).toBeCloseTo(0, 5);
  });

  it("should return positive angle when right shoulder is lower", () => {
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0,
      y: 0,
      z: 0,
      visibility: 0,
    }));
    landmarks[11] = { x: 0.3, y: 0.4, z: 0, visibility: 0.9 };
    landmarks[12] = { x: 0.7, y: 0.5, z: 0, visibility: 0.9 };

    const tilt = calculateShoulderTilt(landmarks);
    expect(tilt).toBeGreaterThan(0);
  });

  it("should return negative angle when right shoulder is higher", () => {
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0,
      y: 0,
      z: 0,
      visibility: 0,
    }));
    landmarks[11] = { x: 0.3, y: 0.5, z: 0, visibility: 0.9 };
    landmarks[12] = { x: 0.7, y: 0.4, z: 0, visibility: 0.9 };

    const tilt = calculateShoulderTilt(landmarks);
    expect(tilt).toBeLessThan(0);
  });

  it("should return 0 when left shoulder has low visibility", () => {
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0,
      y: 0,
      z: 0,
      visibility: 0,
    }));
    landmarks[11] = { x: 0.3, y: 0.4, z: 0, visibility: 0.1 };
    landmarks[12] = { x: 0.7, y: 0.6, z: 0, visibility: 0.9 };

    const tilt = calculateShoulderTilt(landmarks);
    expect(tilt).toBe(0);
  });

  it("should return 0 when shoulder landmarks are missing", () => {
    const landmarks: Array<{
      x: number;
      y: number;
      z: number;
      visibility: number;
    }> = [];

    const tilt = calculateShoulderTilt(landmarks);
    expect(tilt).toBe(0);
  });
});

describe("computeLegBoundingBox", () => {
  it("should compute bounding box from visible leg landmarks", () => {
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0,
      y: 0,
      z: 0,
      visibility: 0,
    }));
    // Set leg landmarks (23-32) with varying positions
    landmarks[23] = { x: 0.3, y: 0.5, z: 0, visibility: 0.9 };
    landmarks[24] = { x: 0.7, y: 0.5, z: 0, visibility: 0.9 };
    landmarks[25] = { x: 0.2, y: 0.7, z: 0, visibility: 0.8 };
    landmarks[26] = { x: 0.8, y: 0.7, z: 0, visibility: 0.8 };
    landmarks[27] = { x: 0.25, y: 0.9, z: 0, visibility: 0.7 };
    landmarks[28] = { x: 0.75, y: 0.9, z: 0, visibility: 0.7 };

    const bbox = computeLegBoundingBox(landmarks);
    expect(bbox).not.toBeNull();
    expect(bbox!.minX).toBeCloseTo(0.2, 5);
    expect(bbox!.maxX).toBeCloseTo(0.8, 5);
    expect(bbox!.minY).toBeCloseTo(0.5, 5);
    expect(bbox!.maxY).toBeCloseTo(0.9, 5);
  });

  it("should return null when no leg landmarks are visible", () => {
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.1, // below MIN_VISIBILITY
    }));

    const bbox = computeLegBoundingBox(landmarks);
    expect(bbox).toBeNull();
  });

  it("should ignore leg landmarks with low visibility", () => {
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0,
      y: 0,
      z: 0,
      visibility: 0,
    }));
    landmarks[23] = { x: 0.4, y: 0.6, z: 0, visibility: 0.9 };
    landmarks[24] = { x: 0.6, y: 0.6, z: 0, visibility: 0.9 };
    // Low visibility landmark that should be ignored
    landmarks[25] = { x: 0.1, y: 0.1, z: 0, visibility: 0.1 };

    const bbox = computeLegBoundingBox(landmarks);
    expect(bbox).not.toBeNull();
    expect(bbox!.minX).toBeCloseTo(0.4, 5);
    expect(bbox!.maxX).toBeCloseTo(0.6, 5);
  });
});

describe("remapRoiLandmark", () => {
  it("should remap from ROI coordinates to full image coordinates", () => {
    // ROI crop starts at (0.2, 0.3) and is 0.5 wide, 0.4 tall
    const landmark = { x: 0.5, y: 0.5, z: 0.1, visibility: 0.9 };
    const remapped = remapRoiLandmark(landmark, 0.2, 0.3, 0.5, 0.4);

    // x = 0.2 + 0.5 * 0.5 = 0.45
    // y = 0.3 + 0.5 * 0.4 = 0.50
    expect(remapped.x).toBeCloseTo(0.45, 5);
    expect(remapped.y).toBeCloseTo(0.5, 5);
    expect(remapped.z).toBe(0.1);
    expect(remapped.visibility).toBe(0.9);
  });

  it("should remap top-left corner to crop origin", () => {
    const landmark = { x: 0, y: 0, z: 0, visibility: 0.9 };
    const remapped = remapRoiLandmark(landmark, 0.3, 0.4, 0.5, 0.3);

    expect(remapped.x).toBeCloseTo(0.3, 5);
    expect(remapped.y).toBeCloseTo(0.4, 5);
  });

  it("should remap bottom-right corner to crop end", () => {
    const landmark = { x: 1, y: 1, z: 0, visibility: 0.9 };
    const remapped = remapRoiLandmark(landmark, 0.3, 0.4, 0.5, 0.3);

    // x = 0.3 + 1 * 0.5 = 0.8
    // y = 0.4 + 1 * 0.3 = 0.7
    expect(remapped.x).toBeCloseTo(0.8, 5);
    expect(remapped.y).toBeCloseTo(0.7, 5);
  });
});

describe("mergeRoiResults", () => {
  it("should keep non-leg landmarks from original", () => {
    const original = Array.from({ length: 33 }, (_, i) => ({
      x: i * 0.01,
      y: i * 0.02,
      z: 0,
      visibility: 0.9,
    }));
    const roi = Array.from({ length: 33 }, (_, i) => ({
      x: 0.99,
      y: 0.99,
      z: 0,
      visibility: 0.9,
    }));

    const merged = mergeRoiResults(original, roi);

    // Non-leg landmarks (e.g. index 11) should be unchanged from original
    expect(merged[11].x).toBeCloseTo(0.11, 5);
    expect(merged[11].y).toBeCloseTo(0.22, 5);
  });

  it("should average leg landmarks weighted by visibility²", () => {
    const original = Array.from({ length: 33 }, () => ({
      x: 0.4,
      y: 0.4,
      z: 0,
      visibility: 0.9,
    }));
    const roi = Array.from({ length: 33 }, () => ({
      x: 0.6,
      y: 0.6,
      z: 0,
      visibility: 0.9,
    }));

    const merged = mergeRoiResults(original, roi);

    // Leg landmark (index 23): equal visibility → average of 0.4 and 0.6
    expect(merged[23].x).toBeCloseTo(0.5, 5);
    expect(merged[23].y).toBeCloseTo(0.5, 5);
  });

  it("should favor higher-visibility detection for leg landmarks", () => {
    const original = Array.from({ length: 33 }, () => ({
      x: 0.3,
      y: 0.3,
      z: 0,
      visibility: 0.9, // weight = 0.81
    }));
    const roi = Array.from({ length: 33 }, () => ({
      x: 0.7,
      y: 0.7,
      z: 0,
      visibility: 0.3, // weight = 0.09
    }));

    const merged = mergeRoiResults(original, roi);

    // Leg landmark should be closer to original (0.3) due to higher weight
    expect(merged[25].x).toBeLessThan(0.5);
  });

  it("should use original when ROI landmark is missing", () => {
    const original = Array.from({ length: 33 }, (_, i) => ({
      x: i * 0.01,
      y: i * 0.02,
      z: 0,
      visibility: 0.9,
    }));
    // ROI with fewer landmarks than expected
    const roi: Array<{
      x: number;
      y: number;
      z: number;
      visibility: number;
    }> = [];

    const merged = mergeRoiResults(original, roi);

    // Should fall back to original for all landmarks
    expect(merged[23].x).toBeCloseTo(0.23, 5);
  });
});
