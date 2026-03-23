import {
  calculateKneeAngle,
  calculateHipAngle,
  calculateAnkleAngle,
  calculateConfidenceScore,
  calculateBilateralAngles,
  classifyHKA,
  hkaLabel,
  isLandmarkReliable,
  angleBetweenThreePoints,
  angleBetweenThreePoints3D,
  PoseLandmarks,
} from "../angle-calculator";

// Landmarks for a person standing straight (approximate)
// All have visibility >= 0.5 so they pass the confidence filter
const straightStandingLandmarks: PoseLandmarks = {
  11: { x: 0.4, y: 0.2, visibility: 0.95 },
  12: { x: 0.6, y: 0.2, visibility: 0.95 },
  23: { x: 0.42, y: 0.5, visibility: 0.9 },
  24: { x: 0.58, y: 0.5, visibility: 0.9 },
  25: { x: 0.42, y: 0.72, visibility: 0.88 },
  26: { x: 0.58, y: 0.72, visibility: 0.88 },
  27: { x: 0.42, y: 0.92, visibility: 0.85 },
  28: { x: 0.58, y: 0.92, visibility: 0.85 },
  29: { x: 0.4, y: 0.96, visibility: 0.8 },
  30: { x: 0.6, y: 0.96, visibility: 0.8 },
};

describe("isLandmarkReliable", () => {
  it("returns true for landmark with visibility >= 0.5", () => {
    expect(isLandmarkReliable({ x: 0, y: 0, visibility: 0.5 })).toBe(true);
    expect(isLandmarkReliable({ x: 0, y: 0, visibility: 0.9 })).toBe(true);
  });

  it("returns false for landmark with visibility < 0.5", () => {
    expect(isLandmarkReliable({ x: 0, y: 0, visibility: 0.3 })).toBe(false);
    expect(isLandmarkReliable({ x: 0, y: 0, visibility: 0 })).toBe(false);
  });

  it("returns false for undefined landmark", () => {
    expect(isLandmarkReliable(undefined)).toBe(false);
  });

  it("returns false for landmark without visibility", () => {
    expect(isLandmarkReliable({ x: 0, y: 0 })).toBe(false);
  });
});

describe("angleBetweenThreePoints", () => {
  it("returns 180 for collinear points", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 0.5, y: 0 };
    const c = { x: 1, y: 0 };
    expect(angleBetweenThreePoints(a, b, c)).toBeCloseTo(180, 0);
  });

  it("returns 90 for perpendicular points", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 0, y: 1 };
    const c = { x: 1, y: 1 };
    expect(angleBetweenThreePoints(a, b, c)).toBeCloseTo(90, 0);
  });

  it("returns 0 when vectors have zero length", () => {
    const a = { x: 1, y: 1 };
    expect(angleBetweenThreePoints(a, a, a)).toBe(0);
  });
});

describe("angleBetweenThreePoints3D", () => {
  it("returns 180 for collinear points in 3D", () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 0.5, y: 0, z: 0 };
    const c = { x: 1, y: 0, z: 0 };
    expect(angleBetweenThreePoints3D(a, b, c)).toBeCloseTo(180, 0);
  });

  it("returns 90 for perpendicular points in 3D", () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 0, y: 1, z: 0 };
    const c = { x: 1, y: 1, z: 0 };
    expect(angleBetweenThreePoints3D(a, b, c)).toBeCloseTo(90, 0);
  });

  it("returns 90 for perpendicular points using z dimension", () => {
    const a = { x: 0, y: 0, z: 1 };
    const b = { x: 0, y: 0, z: 0 };
    const c = { x: 1, y: 0, z: 0 };
    expect(angleBetweenThreePoints3D(a, b, c)).toBeCloseTo(90, 0);
  });

  it("falls back to 2D when all z are 0", () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 0.5, y: 0, z: 0 };
    const c = { x: 1, y: 0, z: 0 };
    expect(angleBetweenThreePoints3D(a, b, c)).toBeCloseTo(
      angleBetweenThreePoints(a, b, c),
      5,
    );
  });

  it("falls back to 2D when z is undefined", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 0.5, y: 0 };
    const c = { x: 1, y: 0 };
    expect(angleBetweenThreePoints3D(a, b, c)).toBeCloseTo(180, 0);
  });

  it("returns 0 when vectors have zero length", () => {
    const a = { x: 1, y: 1, z: 1 };
    expect(angleBetweenThreePoints3D(a, a, a)).toBe(0);
  });

  it("considers z depth for angled limbs", () => {
    // Points forming a 3D angle where z makes a difference
    const a = { x: 0, y: 1, z: 0 };
    const b = { x: 0, y: 0, z: 0 };
    const c = { x: 0, y: 0, z: 1 };
    // ba = (0,1,0), bc = (0,0,1) → 90 degrees
    expect(angleBetweenThreePoints3D(a, b, c)).toBeCloseTo(90, 0);
  });
});

describe("calculateKneeAngle", () => {
  it("returns a number for valid landmarks", () => {
    const angle = calculateKneeAngle(straightStandingLandmarks);
    expect(typeof angle).toBe("number");
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThanOrEqual(180);
  });

  it("returns 0 when landmarks are missing", () => {
    const angle = calculateKneeAngle({});
    expect(angle).toBe(0);
  });

  it("falls back to left side when right has low visibility", () => {
    const leftOnly: PoseLandmarks = {
      23: { x: 0.4, y: 0.5, visibility: 0.9 },
      25: { x: 0.4, y: 0.72, visibility: 0.88 },
      27: { x: 0.4, y: 0.92, visibility: 0.85 },
      24: { x: 0.58, y: 0.5, visibility: 0.1 }, // low visibility
      26: { x: 0.58, y: 0.72, visibility: 0.1 },
      28: { x: 0.58, y: 0.92, visibility: 0.1 },
    };
    const angle = calculateKneeAngle(leftOnly);
    expect(typeof angle).toBe("number");
    expect(angle).toBeGreaterThan(0);
  });

  it("returns 0 when landmarks have low visibility", () => {
    const lowVis: PoseLandmarks = {
      23: { x: 0.4, y: 0.5, visibility: 0.1 },
      25: { x: 0.4, y: 0.72, visibility: 0.1 },
      27: { x: 0.4, y: 0.92, visibility: 0.1 },
      24: { x: 0.58, y: 0.5, visibility: 0.2 },
      26: { x: 0.58, y: 0.72, visibility: 0.2 },
      28: { x: 0.58, y: 0.92, visibility: 0.2 },
    };
    expect(calculateKneeAngle(lowVis)).toBe(0);
  });

  it("returns close to 180 for straight leg", () => {
    const vertical: PoseLandmarks = {
      24: { x: 0.5, y: 0.3, visibility: 0.9 },
      26: { x: 0.5, y: 0.6, visibility: 0.9 },
      28: { x: 0.5, y: 0.9, visibility: 0.9 },
    };
    const angle = calculateKneeAngle(vertical);
    expect(angle).toBeCloseTo(180, 0);
  });

  it("returns ~90 for right angle", () => {
    const rightAngle: PoseLandmarks = {
      24: { x: 0.5, y: 0.3, visibility: 0.9 },
      26: { x: 0.5, y: 0.6, visibility: 0.9 },
      28: { x: 0.8, y: 0.6, visibility: 0.9 },
    };
    const angle = calculateKneeAngle(rightAngle);
    expect(angle).toBeCloseTo(90, 0);
  });
});

describe("calculateHipAngle", () => {
  it("returns a number for valid landmarks", () => {
    const angle = calculateHipAngle(straightStandingLandmarks);
    expect(typeof angle).toBe("number");
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThanOrEqual(180);
  });

  it("returns 0 when landmarks missing", () => {
    expect(calculateHipAngle({})).toBe(0);
  });
});

describe("calculateAnkleAngle", () => {
  it("returns a number for valid landmarks", () => {
    const angle = calculateAnkleAngle(straightStandingLandmarks);
    expect(typeof angle).toBe("number");
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThanOrEqual(180);
  });

  it("returns 0 when landmarks missing", () => {
    expect(calculateAnkleAngle({})).toBe(0);
  });

  it("falls back to foot_index when heel has low visibility", () => {
    const withFootIndex: PoseLandmarks = {
      25: { x: 0.42, y: 0.72, visibility: 0.88 },
      26: { x: 0.58, y: 0.72, visibility: 0.88 },
      27: { x: 0.42, y: 0.92, visibility: 0.85 },
      28: { x: 0.58, y: 0.92, visibility: 0.85 },
      29: { x: 0.4, y: 0.96, visibility: 0.1 }, // low visibility heel
      30: { x: 0.6, y: 0.96, visibility: 0.1 }, // low visibility heel
      31: { x: 0.43, y: 0.97, visibility: 0.8 }, // foot_index (toes)
      32: { x: 0.59, y: 0.97, visibility: 0.8 }, // foot_index (toes)
    };
    const angle = calculateAnkleAngle(withFootIndex);
    expect(angle).toBeGreaterThan(0);
  });
});

describe("calculateConfidenceScore", () => {
  it("returns average visibility of key landmarks", () => {
    const score = calculateConfidenceScore(straightStandingLandmarks);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("returns 0 when all landmarks have zero visibility", () => {
    const landmarks: PoseLandmarks = {
      11: { x: 0, y: 0, visibility: 0 },
      12: { x: 0, y: 0, visibility: 0 },
    };
    expect(calculateConfidenceScore(landmarks)).toBe(0);
  });

  it("returns 0 for empty landmarks", () => {
    expect(calculateConfidenceScore({})).toBe(0);
  });

  it("returns 1 for all perfect visibility", () => {
    const perfect: PoseLandmarks = {
      11: { x: 0, y: 0, visibility: 1 },
      12: { x: 0, y: 0, visibility: 1 },
      23: { x: 0, y: 0, visibility: 1 },
      24: { x: 0, y: 0, visibility: 1 },
      25: { x: 0, y: 0, visibility: 1 },
      26: { x: 0, y: 0, visibility: 1 },
      27: { x: 0, y: 0, visibility: 1 },
      28: { x: 0, y: 0, visibility: 1 },
    };
    expect(calculateConfidenceScore(perfect)).toBe(1);
  });
});

describe("calculateBilateralAngles", () => {
  it("calculates angles for both legs with reliable landmarks", () => {
    const result = calculateBilateralAngles(straightStandingLandmarks);

    expect(result.left.kneeAngle).toBeGreaterThan(0);
    expect(result.right.kneeAngle).toBeGreaterThan(0);
    expect(result.leftHKA).toBeGreaterThan(0);
    expect(result.rightHKA).toBeGreaterThan(0);
    expect(result.left.hipAngle).toBeGreaterThan(0);
    expect(result.right.hipAngle).toBeGreaterThan(0);
    expect(result.left.ankleAngle).toBeGreaterThan(0);
    expect(result.right.ankleAngle).toBeGreaterThan(0);
  });

  it("returns 0 for sides with unreliable landmarks", () => {
    const rightOnly: PoseLandmarks = {
      12: { x: 0.6, y: 0.2, visibility: 0.95 },
      24: { x: 0.58, y: 0.5, visibility: 0.9 },
      26: { x: 0.58, y: 0.72, visibility: 0.88 },
      28: { x: 0.58, y: 0.92, visibility: 0.85 },
      30: { x: 0.6, y: 0.96, visibility: 0.8 },
      // Left side has low visibility
      11: { x: 0.4, y: 0.2, visibility: 0.1 },
      23: { x: 0.42, y: 0.5, visibility: 0.1 },
      25: { x: 0.42, y: 0.72, visibility: 0.1 },
      27: { x: 0.42, y: 0.92, visibility: 0.1 },
      29: { x: 0.4, y: 0.96, visibility: 0.1 },
    };

    const result = calculateBilateralAngles(rightOnly);

    expect(result.right.kneeAngle).toBeGreaterThan(0);
    expect(result.rightHKA).toBeGreaterThan(0);
    expect(result.left.kneeAngle).toBe(0);
    expect(result.leftHKA).toBe(0);
  });

  it("returns all zeros for empty landmarks", () => {
    const result = calculateBilateralAngles({});

    expect(result.left.kneeAngle).toBe(0);
    expect(result.left.hipAngle).toBe(0);
    expect(result.left.ankleAngle).toBe(0);
    expect(result.right.kneeAngle).toBe(0);
    expect(result.right.hipAngle).toBe(0);
    expect(result.right.ankleAngle).toBe(0);
    expect(result.leftHKA).toBe(0);
    expect(result.rightHKA).toBe(0);
  });

  it("HKA matches knee angle for same landmarks", () => {
    const result = calculateBilateralAngles(straightStandingLandmarks);
    // leftHKA = angle(leftHip, leftKnee, leftAnkle) = left.kneeAngle
    expect(result.leftHKA).toBeCloseTo(result.left.kneeAngle, 5);
    expect(result.rightHKA).toBeCloseTo(result.right.kneeAngle, 5);
  });

  it("uses foot_index as fallback when heels have low visibility", () => {
    const withFootIndex: PoseLandmarks = {
      11: { x: 0.4, y: 0.2, visibility: 0.95 },
      12: { x: 0.6, y: 0.2, visibility: 0.95 },
      23: { x: 0.42, y: 0.5, visibility: 0.9 },
      24: { x: 0.58, y: 0.5, visibility: 0.9 },
      25: { x: 0.42, y: 0.72, visibility: 0.88 },
      26: { x: 0.58, y: 0.72, visibility: 0.88 },
      27: { x: 0.42, y: 0.92, visibility: 0.85 },
      28: { x: 0.58, y: 0.92, visibility: 0.85 },
      29: { x: 0.4, y: 0.96, visibility: 0.1 }, // low visibility heel
      30: { x: 0.6, y: 0.96, visibility: 0.1 }, // low visibility heel
      31: { x: 0.43, y: 0.97, visibility: 0.8 }, // foot_index left
      32: { x: 0.59, y: 0.97, visibility: 0.8 }, // foot_index right
    };

    const result = calculateBilateralAngles(withFootIndex);
    expect(result.left.ankleAngle).toBeGreaterThan(0);
    expect(result.right.ankleAngle).toBeGreaterThan(0);
  });

  it("detects genu varum in bow-legged landmarks", () => {
    // Simulate bow legs: knees deviate outward
    const bowLegged: PoseLandmarks = {
      11: { x: 0.4, y: 0.2, visibility: 0.95 },
      12: { x: 0.6, y: 0.2, visibility: 0.95 },
      23: { x: 0.45, y: 0.5, visibility: 0.9 },
      24: { x: 0.55, y: 0.5, visibility: 0.9 },
      25: { x: 0.35, y: 0.7, visibility: 0.88 }, // left knee pushed outward
      26: { x: 0.65, y: 0.7, visibility: 0.88 }, // right knee pushed outward
      27: { x: 0.45, y: 0.92, visibility: 0.85 },
      28: { x: 0.55, y: 0.92, visibility: 0.85 },
      29: { x: 0.44, y: 0.96, visibility: 0.8 },
      30: { x: 0.56, y: 0.96, visibility: 0.8 },
    };

    const result = calculateBilateralAngles(bowLegged);
    // Bow legs = HKA angle less than 180
    expect(result.leftHKA).toBeLessThan(180);
    expect(result.rightHKA).toBeLessThan(180);
  });
});

describe("classifyHKA", () => {
  it("classifies varum for angle < 175", () => {
    expect(classifyHKA(170)).toBe("varum");
    expect(classifyHKA(174.9)).toBe("varum");
  });

  it("classifies normal for 175-180", () => {
    expect(classifyHKA(175)).toBe("normal");
    expect(classifyHKA(177)).toBe("normal");
    expect(classifyHKA(180)).toBe("normal");
  });

  it("classifies valgum for angle > 180", () => {
    expect(classifyHKA(180.1)).toBe("valgum");
    expect(classifyHKA(190)).toBe("valgum");
  });

  it("classifies unavailable for 0", () => {
    expect(classifyHKA(0)).toBe("unavailable");
  });
});

describe("hkaLabel", () => {
  it("returns French labels", () => {
    expect(hkaLabel(170)).toBe("Genu varum");
    expect(hkaLabel(177)).toBe("Normal");
    expect(hkaLabel(190)).toBe("Genu valgum");
    expect(hkaLabel(0)).toBe("Non disponible");
  });
});
