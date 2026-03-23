import {
  validateAnatomicalProportions,
  type AnatomicalValidation,
} from "../anatomical-validation";
import type { PoseLandmarks } from "../angle-calculator";

/**
 * Helper to create landmarks with standard visible joints.
 * Positions form a plausible standing human:
 * - Hips at y=0.4, knees at y=0.6, ankles at y=0.8
 * - Left side at x=0.45, right side at x=0.55
 */
function createPlausibleLandmarks(
  overrides: Partial<
    Record<number, { x: number; y: number; visibility?: number }>
  >,
): PoseLandmarks {
  const defaults: PoseLandmarks = {
    23: { x: 0.45, y: 0.4, visibility: 0.9 }, // left hip
    24: { x: 0.55, y: 0.4, visibility: 0.9 }, // right hip
    25: { x: 0.45, y: 0.6, visibility: 0.9 }, // left knee
    26: { x: 0.55, y: 0.6, visibility: 0.9 }, // right knee
    27: { x: 0.45, y: 0.8, visibility: 0.9 }, // left ankle
    28: { x: 0.55, y: 0.8, visibility: 0.9 }, // right ankle
  };

  return { ...defaults, ...overrides };
}

describe("validateAnatomicalProportions", () => {
  it("returns plausible for normal standing pose", () => {
    const landmarks = createPlausibleLandmarks({});
    const result = validateAnatomicalProportions(landmarks);

    expect(result.isPlausible).toBe(true);
    expect(result.warnings).toHaveLength(0);
    expect(result.femurTibiaRatio).toBeCloseTo(1.0);
    expect(result.symmetryScore).toBe(1.0);
  });

  it("warns when femur/tibia ratio is too high (left)", () => {
    // Move left knee very close to hip => long tibia, short femur ratio becomes extreme
    const landmarks = createPlausibleLandmarks({
      25: { x: 0.45, y: 0.41, visibility: 0.9 }, // knee almost at hip
    });
    const result = validateAnatomicalProportions(landmarks);

    expect(result.isPlausible).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes("fémur/tibia gauche"))).toBe(
      true,
    );
  });

  it("warns when femur/tibia ratio is too low (right)", () => {
    // Move right knee very close to ankle => long femur, short tibia
    const landmarks = createPlausibleLandmarks({
      26: { x: 0.55, y: 0.79, visibility: 0.9 }, // knee almost at ankle
    });
    const result = validateAnatomicalProportions(landmarks);

    expect(result.isPlausible).toBe(false);
    expect(result.warnings.some((w) => w.includes("fémur/tibia droit"))).toBe(
      true,
    );
  });

  it("warns when left knee is not between hip and ankle vertically", () => {
    const landmarks = createPlausibleLandmarks({
      25: { x: 0.45, y: 0.3, visibility: 0.9 }, // knee ABOVE hip
    });
    const result = validateAnatomicalProportions(landmarks);

    expect(result.isPlausible).toBe(false);
    expect(result.warnings.some((w) => w.includes("genou gauche"))).toBe(true);
  });

  it("warns when right knee is not between hip and ankle vertically", () => {
    const landmarks = createPlausibleLandmarks({
      26: { x: 0.55, y: 0.9, visibility: 0.9 }, // knee BELOW ankle
    });
    const result = validateAnatomicalProportions(landmarks);

    expect(result.isPlausible).toBe(false);
    expect(result.warnings.some((w) => w.includes("genou droit"))).toBe(true);
  });

  it("warns on significant left/right asymmetry", () => {
    const landmarks = createPlausibleLandmarks({
      // Left leg is much longer than right
      27: { x: 0.45, y: 0.95, visibility: 0.9 }, // left ankle much lower
      28: { x: 0.55, y: 0.5, visibility: 0.9 }, // right ankle much higher
    });
    const result = validateAnatomicalProportions(landmarks);

    expect(result.symmetryScore).toBeLessThan(0.7);
    expect(result.warnings.some((w) => w.includes("Asymétrie"))).toBe(true);
  });

  it("returns plausible when landmarks have low visibility (cannot validate)", () => {
    const landmarks: PoseLandmarks = {
      23: { x: 0.45, y: 0.4, visibility: 0.1 },
      24: { x: 0.55, y: 0.4, visibility: 0.1 },
      25: { x: 0.45, y: 0.6, visibility: 0.1 },
      26: { x: 0.55, y: 0.6, visibility: 0.1 },
      27: { x: 0.45, y: 0.8, visibility: 0.1 },
      28: { x: 0.55, y: 0.8, visibility: 0.1 },
    };
    const result = validateAnatomicalProportions(landmarks);

    // With low visibility, nothing can be validated => assume plausible
    expect(result.isPlausible).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("returns plausible for empty landmarks", () => {
    const result = validateAnatomicalProportions({});
    expect(result.isPlausible).toBe(true);
    expect(result.femurTibiaRatio).toBeCloseTo(1.0);
    expect(result.symmetryScore).toBe(1.0);
  });

  it("handles partial landmarks (only one side visible)", () => {
    const landmarks: PoseLandmarks = {
      24: { x: 0.55, y: 0.4, visibility: 0.9 },
      26: { x: 0.55, y: 0.6, visibility: 0.9 },
      28: { x: 0.55, y: 0.8, visibility: 0.9 },
    };
    const result = validateAnatomicalProportions(landmarks);

    expect(result.isPlausible).toBe(true);
    expect(result.femurTibiaRatio).toBeCloseTo(1.0);
  });

  it("all warnings are in French", () => {
    // Create a pose with multiple issues
    const landmarks = createPlausibleLandmarks({
      25: { x: 0.45, y: 0.3, visibility: 0.9 }, // knee above hip
      26: { x: 0.55, y: 0.41, visibility: 0.9 }, // extreme ratio
      27: { x: 0.45, y: 0.95, visibility: 0.9 }, // asymmetry
    });
    const result = validateAnatomicalProportions(landmarks);

    for (const warning of result.warnings) {
      // Check that warnings contain French characters/words
      expect(warning).toMatch(/[éèêëàâùûïîç]|Vérifiez|genou|Rapport|Asymétrie/);
    }
  });
});
