import {
  calculateKneeAngle,
  calculateHipAngle,
  calculateAnkleAngle,
  calculateConfidenceScore,
  PoseLandmarks,
} from '../angle-calculator';

// Landmarks for a person standing straight (approximate)
const straightStandingLandmarks: PoseLandmarks = {
  11: { x: 0.4, y: 0.2, visibility: 0.95 },
  12: { x: 0.6, y: 0.2, visibility: 0.95 },
  23: { x: 0.42, y: 0.5, visibility: 0.9 },
  24: { x: 0.58, y: 0.5, visibility: 0.9 },
  25: { x: 0.42, y: 0.72, visibility: 0.88 },
  26: { x: 0.58, y: 0.72, visibility: 0.88 },
  27: { x: 0.42, y: 0.92, visibility: 0.85 },
  28: { x: 0.58, y: 0.92, visibility: 0.85 },
  29: { x: 0.40, y: 0.96, visibility: 0.80 },
  30: { x: 0.60, y: 0.96, visibility: 0.80 },
};

describe('calculateKneeAngle', () => {
  it('returns a number for valid landmarks', () => {
    const angle = calculateKneeAngle(straightStandingLandmarks);
    expect(typeof angle).toBe('number');
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThanOrEqual(180);
  });

  it('returns 0 when landmarks are missing', () => {
    const angle = calculateKneeAngle({});
    expect(angle).toBe(0);
  });

  it('falls back to left side when right is missing', () => {
    const leftOnly: PoseLandmarks = {
      23: { x: 0.4, y: 0.5 },
      25: { x: 0.4, y: 0.72 },
      27: { x: 0.4, y: 0.92 },
    };
    const angle = calculateKneeAngle(leftOnly);
    expect(typeof angle).toBe('number');
  });

  it('returns close to 180 for straight leg', () => {
    // Perfect vertical line: hip, knee, ankle all on x=0.5
    const vertical: PoseLandmarks = {
      24: { x: 0.5, y: 0.3 },
      26: { x: 0.5, y: 0.6 },
      28: { x: 0.5, y: 0.9 },
    };
    const angle = calculateKneeAngle(vertical);
    expect(angle).toBeCloseTo(180, 0);
  });

  it('returns ~90 for right angle', () => {
    const rightAngle: PoseLandmarks = {
      24: { x: 0.5, y: 0.3 },
      26: { x: 0.5, y: 0.6 },
      28: { x: 0.8, y: 0.6 }, // horizontal from knee
    };
    const angle = calculateKneeAngle(rightAngle);
    expect(angle).toBeCloseTo(90, 0);
  });
});

describe('calculateHipAngle', () => {
  it('returns a number for valid landmarks', () => {
    const angle = calculateHipAngle(straightStandingLandmarks);
    expect(typeof angle).toBe('number');
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThanOrEqual(180);
  });

  it('returns 0 when landmarks missing', () => {
    expect(calculateHipAngle({})).toBe(0);
  });
});

describe('calculateAnkleAngle', () => {
  it('returns a number for valid landmarks', () => {
    const angle = calculateAnkleAngle(straightStandingLandmarks);
    expect(typeof angle).toBe('number');
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThanOrEqual(180);
  });

  it('returns 0 when landmarks missing', () => {
    expect(calculateAnkleAngle({})).toBe(0);
  });
});

describe('calculateConfidenceScore', () => {
  it('returns average visibility of key landmarks', () => {
    const score = calculateConfidenceScore(straightStandingLandmarks);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('returns 0 when all landmarks have zero visibility', () => {
    const landmarks: PoseLandmarks = {
      11: { x: 0, y: 0, visibility: 0 },
      12: { x: 0, y: 0, visibility: 0 },
    };
    expect(calculateConfidenceScore(landmarks)).toBe(0);
  });

  it('returns 0 for empty landmarks', () => {
    expect(calculateConfidenceScore({})).toBe(0);
  });

  it('returns 1 for all perfect visibility', () => {
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
