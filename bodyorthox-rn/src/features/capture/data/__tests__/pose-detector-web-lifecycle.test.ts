/**
 * Tests des branches de logique de pose-detector.web.ts qui n'étaient pas
 * couvertes par pose-detector.test.ts (fonctions pures mathématiques) :
 * - fonctions dépendantes du DOM (canvas/Image) : upscaleImage,
 *   createVariations, autoRotateIfNeeded, roiCropDetection
 * - cycle de vie de MediaPipePoseDetector (initialize/dispose/isReady)
 * - gestion d'erreur de detect() avant initialisation
 *
 * L'environnement de test Jest (react-native-env) est un environnement Node
 * sans DOM : document/Image/window n'existent pas nativement, donc on les
 * mocke manuellement au global, comme le fait déjà image-quality.test.ts.
 * Le SDK MediaPipe réel (WASM) n'est jamais exécuté ici.
 */

jest.mock("@mediapipe/tasks-vision", () => ({
  PoseLandmarker: {
    createFromOptions: jest.fn(),
  },
  FilesetResolver: {
    forVisionTasks: jest.fn(),
  },
}));

import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import {
  autoRotateIfNeeded,
  createVariations,
  getPoseDetector,
  roiCropDetection,
  upscaleImage,
} from "../pose-detector.web";

// ---------------------------------------------------------------------------
// Mock canvas 2D + Image pour les fonctions dépendantes du DOM
// ---------------------------------------------------------------------------

function createMockCtx() {
  return {
    imageSmoothingEnabled: false,
    imageSmoothingQuality: "",
    filter: "",
    drawImage: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
  };
}

type MockCanvas = {
  width: number;
  height: number;
  ctx: ReturnType<typeof createMockCtx>;
  getContext: jest.Mock;
  toDataURL: jest.Mock;
};

let createdCanvases: MockCanvas[] = [];
let canvasCallIndex = 0;
let failCanvasIndexes: number[] = [];

function createMockCanvas(): MockCanvas {
  const idx = canvasCallIndex++;
  const ctx = createMockCtx();
  const available = !failCanvasIndexes.includes(idx);
  const canvas: MockCanvas = {
    width: 0,
    height: 0,
    ctx,
    getContext: jest.fn(() => (available ? ctx : null)),
    toDataURL: jest.fn(() => "data:image/jpeg;base64,mock"),
  };
  createdCanvases.push(canvas);
  return canvas;
}

class MockImage {
  naturalWidth = 0;
  naturalHeight = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = "";
  set src(value: string) {
    this._src = value;
    queueMicrotask(() => this.onload?.());
  }
  get src(): string {
    return this._src;
  }
}

beforeEach(() => {
  createdCanvases = [];
  canvasCallIndex = 0;
  failCanvasIndexes = [];

  (global as unknown as { document: { createElement: jest.Mock } }).document =
    {
      createElement: jest.fn((tag: string) =>
        tag === "canvas" ? createMockCanvas() : {},
      ),
    };
  (global as unknown as { Image: typeof MockImage }).Image = MockImage;
});

afterEach(() => {
  jest.clearAllMocks();
});

function makeImage(width: number, height: number) {
  return { naturalWidth: width, naturalHeight: height } as HTMLImageElement;
}

function makeFullLandmarkSet(
  overrides: Record<number, Partial<NormalizedLandmark>> = {},
): NormalizedLandmark[] {
  return Array.from({ length: 33 }, (_, i) => ({
    x: 0,
    y: 0,
    z: 0,
    visibility: 0,
    ...overrides[i],
  }));
}

// ---------------------------------------------------------------------------
// upscaleImage
// ---------------------------------------------------------------------------

describe("upscaleImage", () => {
  it("retourne la même image quand elle atteint déjà la dimension minimale (1920px)", async () => {
    const image = makeImage(1920, 1080);
    const result = await upscaleImage(image);
    expect(result).toBe(image);
    expect(createdCanvases).toHaveLength(0);
  });

  it("agrandit une petite image pour que son côté le plus long atteigne 1920px", async () => {
    const image = makeImage(640, 480);
    const result = await upscaleImage(image);

    expect(result).not.toBe(image);
    expect(createdCanvases).toHaveLength(1);
    // scale = 1920/640 = 3
    expect(createdCanvases[0].width).toBe(1920);
    expect(createdCanvases[0].height).toBe(1440);
    expect(createdCanvases[0].toDataURL).toHaveBeenCalledWith(
      "image/jpeg",
      0.95,
    );
  });

  it("retourne l'image d'origine si le contexte 2D du canvas est indisponible", async () => {
    failCanvasIndexes = [0];
    const image = makeImage(640, 480);
    const result = await upscaleImage(image);
    expect(result).toBe(image);
  });
});

// ---------------------------------------------------------------------------
// createVariations
// ---------------------------------------------------------------------------

describe("createVariations", () => {
  it("crée 5 variations (original + 2 recadrages + 2 luminosités)", async () => {
    const image = makeImage(1920, 1080);
    const { images, variations } = await createVariations(image);

    expect(images).toHaveLength(5);
    expect(variations).toEqual([
      { type: "original" },
      { type: "crop", cropPercent: 0.95 },
      { type: "crop", cropPercent: 0.9 },
      { type: "brightness" },
      { type: "brightness" },
    ]);
  });

  it("ignore une variation dont le contexte 2D du canvas est indisponible", async () => {
    // Le premier canvas créé correspond au recadrage à 95%.
    failCanvasIndexes = [0];
    const image = makeImage(1920, 1080);
    const { images, variations } = await createVariations(image);

    expect(images).toHaveLength(4);
    expect(variations).toEqual([
      { type: "original" },
      { type: "crop", cropPercent: 0.9 },
      { type: "brightness" },
      { type: "brightness" },
    ]);
  });
});

// ---------------------------------------------------------------------------
// autoRotateIfNeeded
// ---------------------------------------------------------------------------

describe("autoRotateIfNeeded", () => {
  function makeLandmarker(detectResult: { landmarks: NormalizedLandmark[][] }) {
    return { detect: jest.fn(() => detectResult) } as unknown as PoseLandmarker;
  }

  it("ne fait rien si aucune pose n'est détectée sur la passe rapide", async () => {
    const landmarker = makeLandmarker({ landmarks: [] });
    const image = makeImage(1000, 1000);

    const result = await autoRotateIfNeeded(landmarker, image);

    expect(result).toEqual({ image, rotated: false, angle: 0 });
    expect(createdCanvases).toHaveLength(0);
  });

  it("ignore une inclinaison trop faible (< 2°)", async () => {
    const landmarks = makeFullLandmarkSet({
      11: { x: 0.3, y: 0.4, visibility: 0.9 },
      12: { x: 0.7, y: 0.401, visibility: 0.9 },
    });
    const landmarker = makeLandmarker({ landmarks: [landmarks] });
    const image = makeImage(1000, 1000);

    const result = await autoRotateIfNeeded(landmarker, image);

    expect(result.rotated).toBe(false);
    expect(createdCanvases).toHaveLength(0);
  });

  it("ignore une inclinaison trop forte (> 30°, probable erreur de détection)", async () => {
    const landmarks = makeFullLandmarkSet({
      11: { x: 0.3, y: 0.1, visibility: 0.9 },
      12: { x: 0.7, y: 0.9, visibility: 0.9 },
    });
    const landmarker = makeLandmarker({ landmarks: [landmarks] });
    const image = makeImage(1000, 1000);

    const result = await autoRotateIfNeeded(landmarker, image);

    expect(result.rotated).toBe(false);
    expect(Math.abs(result.angle)).toBeGreaterThan(30);
    expect(createdCanvases).toHaveLength(0);
  });

  it("effectue la rotation pour une inclinaison corrigible (entre 2° et 30°)", async () => {
    const landmarks = makeFullLandmarkSet({
      11: { x: 0.3, y: 0.4, visibility: 0.9 },
      12: { x: 0.7, y: 0.45, visibility: 0.9 },
    });
    const landmarker = makeLandmarker({ landmarks: [landmarks] });
    const image = makeImage(1000, 1000);

    const result = await autoRotateIfNeeded(landmarker, image);

    expect(result.rotated).toBe(true);
    expect(result.image).not.toBe(image);
    expect(createdCanvases).toHaveLength(1);
    expect(createdCanvases[0].ctx.rotate).toHaveBeenCalled();
    expect(createdCanvases[0].ctx.translate).toHaveBeenCalled();
  });

  it("ne tourne pas l'image quand le contexte 2D du canvas est indisponible", async () => {
    failCanvasIndexes = [0];
    const landmarks = makeFullLandmarkSet({
      11: { x: 0.3, y: 0.4, visibility: 0.9 },
      12: { x: 0.7, y: 0.45, visibility: 0.9 },
    });
    const landmarker = makeLandmarker({ landmarks: [landmarks] });
    const image = makeImage(1000, 1000);

    const result = await autoRotateIfNeeded(landmarker, image);

    expect(result.rotated).toBe(false);
    expect(result.image).toBe(image);
  });
});

// ---------------------------------------------------------------------------
// roiCropDetection
// ---------------------------------------------------------------------------

describe("roiCropDetection", () => {
  function makeLandmarker(detectResult: { landmarks: NormalizedLandmark[][] }) {
    return { detect: jest.fn(() => detectResult) } as unknown as PoseLandmarker;
  }

  function makeVisibleLegLandmarks(): NormalizedLandmark[] {
    return makeFullLandmarkSet({
      23: { x: 0.3, y: 0.5, visibility: 0.9 },
      24: { x: 0.7, y: 0.5, visibility: 0.9 },
      25: { x: 0.25, y: 0.7, visibility: 0.8 },
      26: { x: 0.75, y: 0.7, visibility: 0.8 },
      27: { x: 0.28, y: 0.9, visibility: 0.7 },
      28: { x: 0.72, y: 0.9, visibility: 0.7 },
    });
  }

  it("retourne null quand aucun landmark de jambe n'est visible (pas de bounding box)", async () => {
    const landmarker = makeLandmarker({ landmarks: [] });
    const image = makeImage(1000, 1000);
    const initial = makeFullLandmarkSet();

    const result = await roiCropDetection(landmarker, image, initial);

    expect(result).toBeNull();
    expect(createdCanvases).toHaveLength(0);
  });

  it("retourne null quand le contexte 2D du canvas est indisponible", async () => {
    failCanvasIndexes = [0];
    const landmarker = makeLandmarker({ landmarks: [] });
    const image = makeImage(1000, 1000);

    const result = await roiCropDetection(
      landmarker,
      image,
      makeVisibleLegLandmarks(),
    );

    expect(result).toBeNull();
  });

  it("retourne null quand la passe ROI ne détecte aucune pose", async () => {
    const landmarker = makeLandmarker({ landmarks: [] });
    const image = makeImage(1000, 1000);

    const result = await roiCropDetection(
      landmarker,
      image,
      makeVisibleLegLandmarks(),
    );

    expect(result).toBeNull();
  });

  it("retourne les landmarks remappés dans l'espace image complet quand la détection ROI réussit", async () => {
    const roiLandmarks = makeFullLandmarkSet({
      23: { x: 0.5, y: 0.5, visibility: 0.9 },
    });
    const landmarker = makeLandmarker({ landmarks: [roiLandmarks] });
    const image = makeImage(1000, 1000);

    const result = await roiCropDetection(
      landmarker,
      image,
      makeVisibleLegLandmarks(),
    );

    expect(result).not.toBeNull();
    expect(result).toHaveLength(33);
    // Le centre de la ROI (0.5, 0.5) doit être remappé dans la bounding box
    // des jambes (proche de x=0.5, y=0.7 avec la marge appliquée), donc
    // strictement à l'intérieur de [0,1] et différent de la valeur brute.
    expect(result![23].x).toBeGreaterThan(0);
    expect(result![23].x).toBeLessThan(1);
  });
});

// ---------------------------------------------------------------------------
// MediaPipePoseDetector — cycle de vie
// ---------------------------------------------------------------------------

describe("MediaPipePoseDetector — cycle de vie", () => {
  afterEach(() => {
    getPoseDetector().dispose();
  });

  it("n'est pas prêt avant tout appel à initialize()", () => {
    expect(getPoseDetector().isReady()).toBe(false);
  });

  it("devient prêt après un initialize() réussi", async () => {
    (FilesetResolver.forVisionTasks as jest.Mock).mockResolvedValue({});
    (PoseLandmarker.createFromOptions as jest.Mock).mockResolvedValue({
      close: jest.fn(),
    });

    const detector = getPoseDetector();
    await detector.initialize();

    expect(detector.isReady()).toBe(true);
  });

  it("propage un message d'erreur en français quand l'initialisation échoue", async () => {
    (FilesetResolver.forVisionTasks as jest.Mock).mockRejectedValue(
      new Error("boom"),
    );

    const detector = getPoseDetector();

    await expect(detector.initialize()).rejects.toThrow(
      "Impossible d'initialiser MediaPipe Pose",
    );
    expect(detector.isReady()).toBe(false);
  });

  it("réutilise la même promesse d'initialisation pour des appels concurrents", async () => {
    (FilesetResolver.forVisionTasks as jest.Mock).mockResolvedValue({});
    (PoseLandmarker.createFromOptions as jest.Mock).mockResolvedValue({
      close: jest.fn(),
    });

    const detector = getPoseDetector();
    const [p1, p2] = [detector.initialize(), detector.initialize()];
    await Promise.all([p1, p2]);

    expect(FilesetResolver.forVisionTasks).toHaveBeenCalledTimes(1);
  });

  it("ne réinitialise pas quand le détecteur est déjà prêt (idempotent)", async () => {
    (FilesetResolver.forVisionTasks as jest.Mock).mockResolvedValue({});
    (PoseLandmarker.createFromOptions as jest.Mock).mockResolvedValue({
      close: jest.fn(),
    });

    const detector = getPoseDetector();
    await detector.initialize();
    await detector.initialize();

    expect(FilesetResolver.forVisionTasks).toHaveBeenCalledTimes(1);
  });

  it("ferme les landmarkers et réinitialise l'état lors de dispose()", async () => {
    const close = jest.fn();
    (FilesetResolver.forVisionTasks as jest.Mock).mockResolvedValue({});
    (PoseLandmarker.createFromOptions as jest.Mock).mockResolvedValue({
      close,
    });

    const detector = getPoseDetector();
    await detector.initialize();
    detector.dispose();

    expect(close).toHaveBeenCalled();
    expect(detector.isReady()).toBe(false);
  });

  it("permet de ré-initialiser après un dispose()", async () => {
    (FilesetResolver.forVisionTasks as jest.Mock).mockResolvedValue({});
    (PoseLandmarker.createFromOptions as jest.Mock).mockResolvedValue({
      close: jest.fn(),
    });

    const detector = getPoseDetector();
    await detector.initialize();
    detector.dispose();
    await detector.initialize();

    expect(detector.isReady()).toBe(true);
    expect(FilesetResolver.forVisionTasks).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// MediaPipePoseDetector — gestion d'erreur de detect()
// ---------------------------------------------------------------------------

describe("MediaPipePoseDetector — gestion d'erreur de detect()", () => {
  afterEach(() => {
    getPoseDetector().dispose();
  });

  it("rejette avec un message français quand detect() est appelé avant initialize()", async () => {
    const detector = getPoseDetector();

    await expect(
      detector.detect("data:image/jpeg;base64,x"),
    ).rejects.toThrow("Le modèle ML n'est pas initialisé");
  });

  it("rejette avec le même message après dispose()", async () => {
    (FilesetResolver.forVisionTasks as jest.Mock).mockResolvedValue({});
    (PoseLandmarker.createFromOptions as jest.Mock).mockResolvedValue({
      close: jest.fn(),
    });

    const detector = getPoseDetector();
    await detector.initialize();
    detector.dispose();

    await expect(
      detector.detect("data:image/jpeg;base64,x"),
    ).rejects.toThrow("Le modèle ML n'est pas initialisé");
  });
});
