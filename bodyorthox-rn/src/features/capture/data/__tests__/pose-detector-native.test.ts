/**
 * Tests for the native IPoseDetector implementation backed by the
 * NativePoseLandmarker TurboModule (mocked — no native runtime in jest).
 */

import type { NativeLandmark } from "../../../../specs/NativePoseLandmarker";

const mockDetectFromImage = jest.fn();
const mockDispose = jest.fn();

jest.mock("../../../../specs/NativePoseLandmarker", () => ({
  __esModule: true,
  default: {
    detectFromImage: (...args: unknown[]) => mockDetectFromImage(...args),
    dispose: () => mockDispose(),
  },
}));

import { NoPoseDetectedError } from "../pose-detector-shared";
import {
  NativePoseDetector,
  getPoseDetector,
} from "../pose-detector.native";

/** 33 landmarks, fully visible, at a given x */
function nativeLandmarks(x: number, visibility = 0.9): NativeLandmark[] {
  return Array.from({ length: 33 }, () => ({ x, y: 0.5, z: 0, visibility }));
}

function successResult(x: number, visibility = 0.9) {
  return { landmarks: nativeLandmarks(x, visibility), width: 1080, height: 1920 };
}

const DATA_URL = `data:image/jpeg;base64,SGVsbG8=`;

beforeEach(() => {
  mockDetectFromImage.mockReset();
  mockDispose.mockReset();
});

describe("NativePoseDetector.initialize", () => {
  it("marque le détecteur prêt sans appel natif (chargement lazy)", async () => {
    const detector = new NativePoseDetector();
    expect(detector.isReady()).toBe(false);
    await detector.initialize();
    expect(detector.isReady()).toBe(true);
    expect(mockDetectFromImage).not.toHaveBeenCalled();
  });
});

describe("NativePoseDetector.detect", () => {
  it("strippe le préfixe data: et appelle le module pour heavy ET full", async () => {
    mockDetectFromImage.mockResolvedValue(successResult(0.5));
    const detector = new NativePoseDetector();
    await detector.initialize();
    await detector.detect(DATA_URL);

    expect(mockDetectFromImage).toHaveBeenCalledTimes(2);
    const [b64Heavy, optsHeavy] = mockDetectFromImage.mock.calls[0];
    const [b64Full, optsFull] = mockDetectFromImage.mock.calls[1];
    expect(b64Heavy).toBe("SGVsbG8=");
    expect(b64Full).toBe("SGVsbG8=");
    expect(optsHeavy.modelAsset).toBe("pose_landmarker_heavy.task");
    expect(optsFull.modelAsset).toBe("pose_landmarker_full.task");
    expect(optsHeavy.delegate).toBe("GPU");
    expect(optsHeavy.minPoseDetectionConfidence).toBeCloseTo(0.7);
    expect(optsHeavy.minPosePresenceConfidence).toBeCloseTo(0.7);
  });

  it("accepte un base64 brut sans préfixe data:", async () => {
    mockDetectFromImage.mockResolvedValue(successResult(0.5));
    const detector = new NativePoseDetector();
    await detector.initialize();
    await detector.detect("SGVsbG8=");
    expect(mockDetectFromImage.mock.calls[0][0]).toBe("SGVsbG8=");
  });

  it("fusionne heavy+full et retourne un PoseDetectionResult complet", async () => {
    // heavy à x=0.4, full à x=0.6, mêmes visibilités → fusion à mi-chemin
    mockDetectFromImage
      .mockResolvedValueOnce(successResult(0.4))
      .mockResolvedValueOnce(successResult(0.6));
    const detector = new NativePoseDetector();
    await detector.initialize();
    const result = await detector.detect(DATA_URL);

    expect(result.landmarks[23]?.x).toBeCloseTo(0.5, 5);
    expect(Object.keys(result.allLandmarks)).toHaveLength(33);
    expect(result.confidenceScore).toBeGreaterThan(0);
    expect(result.anatomicalValidation).toBeDefined();
  });

  it("retombe sur heavy seul si full échoue", async () => {
    mockDetectFromImage
      .mockResolvedValueOnce(successResult(0.4))
      .mockRejectedValueOnce(new Error("E_INIT_FAILED"));
    const detector = new NativePoseDetector();
    await detector.initialize();
    const result = await detector.detect(DATA_URL);
    expect(result.landmarks[23]?.x).toBeCloseTo(0.4, 5);
  });

  it("retombe sur full seul si heavy échoue", async () => {
    mockDetectFromImage
      .mockRejectedValueOnce(new Error("E_INIT_FAILED"))
      .mockResolvedValueOnce(successResult(0.6));
    const detector = new NativePoseDetector();
    await detector.initialize();
    const result = await detector.detect(DATA_URL);
    expect(result.landmarks[23]?.x).toBeCloseTo(0.6, 5);
  });

  it("lève NoPoseDetectedError quand les deux modèles ne détectent rien", async () => {
    mockDetectFromImage.mockResolvedValue({
      landmarks: [],
      width: 1080,
      height: 1920,
    });
    const detector = new NativePoseDetector();
    await detector.initialize();
    await expect(detector.detect(DATA_URL)).rejects.toBeInstanceOf(
      NoPoseDetectedError,
    );
    await expect(detector.detect(DATA_URL)).rejects.toThrow(
      /Aucune personne détectée/,
    );
  });

  it("lève NoPoseDetectedError quand la pose est trop peu visible", async () => {
    mockDetectFromImage.mockResolvedValue({
      landmarks: nativeLandmarks(0.5, 0.05),
      width: 1080,
      height: 1920,
    });
    const detector = new NativePoseDetector();
    await detector.initialize();
    await expect(detector.detect(DATA_URL)).rejects.toBeInstanceOf(
      NoPoseDetectedError,
    );
  });

  it("propage l'erreur native quand les deux modèles échouent", async () => {
    mockDetectFromImage.mockRejectedValue(new Error("E_INIT_FAILED: modèle introuvable"));
    const detector = new NativePoseDetector();
    await detector.initialize();
    await expect(detector.detect(DATA_URL)).rejects.toThrow("E_INIT_FAILED");
  });
});

describe("NativePoseDetector.dispose", () => {
  it("libère les ressources natives et repasse non-prêt", async () => {
    const detector = new NativePoseDetector();
    await detector.initialize();
    detector.dispose();
    expect(mockDispose).toHaveBeenCalledTimes(1);
    expect(detector.isReady()).toBe(false);
  });
});

describe("getPoseDetector (natif)", () => {
  it("retourne un singleton", () => {
    expect(getPoseDetector()).toBe(getPoseDetector());
  });
});
