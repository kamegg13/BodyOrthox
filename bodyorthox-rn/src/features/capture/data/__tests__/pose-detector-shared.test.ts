/**
 * Tests for pose-detector-shared — pure functions shared between the web
 * (MediaPipe WASM) and native (TurboModule) pose detector implementations.
 * No @mediapipe/tasks-vision import: the shared module must stay
 * platform-neutral.
 */

import {
  mediapipeToPoseLandmarks,
  mediapipeToAllLandmarks,
  hasValidPose,
  fuseMultiModelLandmarks,
  NoPoseDetectedError,
  NO_POSE_MESSAGE,
  RELEVANT_INDICES,
  MIN_VISIBILITY,
  type LandmarkPoint,
} from "../pose-detector-shared";

function makeLandmarks(
  count: number,
  overrides: Record<number, Partial<LandmarkPoint>> = {},
): LandmarkPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.9,
    ...overrides[i],
  }));
}

describe("mediapipeToPoseLandmarks (shared)", () => {
  it("extrait uniquement les indices pertinents (11,12,23-30)", () => {
    const result = mediapipeToPoseLandmarks(makeLandmarks(33));
    expect(Object.keys(result).map(Number).sort((a, b) => a - b)).toEqual([
      ...RELEVANT_INDICES,
    ]);
  });

  it("ignore les indices absents du tableau d'entrée", () => {
    const result = mediapipeToPoseLandmarks(makeLandmarks(12));
    expect(result[11]).toBeDefined();
    expect(result[23]).toBeUndefined();
  });

  it("normalise z et visibility manquants à 0", () => {
    const lms = makeLandmarks(33);
    lms[11] = { x: 0.1, y: 0.2 } as LandmarkPoint;
    const result = mediapipeToPoseLandmarks(lms);
    expect(result[11]).toEqual({ x: 0.1, y: 0.2, z: 0, visibility: 0 });
  });
});

describe("mediapipeToAllLandmarks (shared)", () => {
  it("convertit les 33 landmarks", () => {
    const result = mediapipeToAllLandmarks(makeLandmarks(33));
    expect(Object.keys(result)).toHaveLength(33);
  });
});

describe("hasValidPose (shared)", () => {
  it("valide quand hanche+genou+cheville gauches sont visibles", () => {
    const lms = makeLandmarks(33);
    const landmarks = mediapipeToPoseLandmarks(lms);
    expect(hasValidPose(landmarks)).toBe(true);
  });

  it("rejette quand aucun côté n'a la visibilité minimale", () => {
    const lms = makeLandmarks(33);
    for (const i of [23, 24, 25, 26, 27, 28]) {
      lms[i] = { ...lms[i], visibility: MIN_VISIBILITY - 0.01 };
    }
    expect(hasValidPose(mediapipeToPoseLandmarks(lms))).toBe(false);
  });

  it("valide avec un seul côté complet (droit)", () => {
    const lms = makeLandmarks(33);
    for (const i of [23, 25, 27]) {
      lms[i] = { ...lms[i], visibility: 0 };
    }
    expect(hasValidPose(mediapipeToPoseLandmarks(lms))).toBe(true);
  });
});

describe("fuseMultiModelLandmarks (shared)", () => {
  it("pondère par la visibilité moyenne de chaque modèle", () => {
    // Modèle A : visibilité 0.8 partout ; modèle B : 0.4 partout
    const a = makeLandmarks(2, {
      0: { x: 0.0, visibility: 0.8 },
      1: { x: 0.0, visibility: 0.8 },
    });
    const b = makeLandmarks(2, {
      0: { x: 1.0, visibility: 0.4 },
      1: { x: 1.0, visibility: 0.4 },
    });
    const fused = fuseMultiModelLandmarks(a, b);
    // x = (0*0.8 + 1*0.4) / 1.2 = 0.333…
    expect(fused[0].x).toBeCloseTo(0.4 / 1.2, 5);
    expect(fused).toHaveLength(2);
  });

  it("retourne le landmark de l'autre modèle si l'un est absent à un index", () => {
    const a = makeLandmarks(1, { 0: { x: 0.2, visibility: 0.9 } });
    const b: LandmarkPoint[] = [];
    const fused = fuseMultiModelLandmarks(a, b);
    expect(fused[0].x).toBeCloseTo(0.2, 5);
  });

  it("retourne A si les deux visibilités moyennes sont nulles", () => {
    const a = makeLandmarks(1, { 0: { x: 0.3, visibility: 0 } });
    const b = makeLandmarks(1, { 0: { x: 0.7, visibility: 0 } });
    const fused = fuseMultiModelLandmarks(a, b);
    expect(fused[0].x).toBeCloseTo(0.3, 5);
  });

  it("ne mute pas les tableaux d'entrée", () => {
    const a = makeLandmarks(2, { 0: { x: 0.1, visibility: 0.5 } });
    const b = makeLandmarks(2, { 0: { x: 0.9, visibility: 0.5 } });
    const aCopy = JSON.parse(JSON.stringify(a));
    fuseMultiModelLandmarks(a, b);
    expect(a).toEqual(aCopy);
  });
});

describe("NoPoseDetectedError (shared)", () => {
  it("porte le nom et le message utilisateur français", () => {
    const err = new NoPoseDetectedError(NO_POSE_MESSAGE);
    expect(err.name).toBe("NoPoseDetectedError");
    expect(err.message).toContain("Aucune personne détectée");
  });
});
