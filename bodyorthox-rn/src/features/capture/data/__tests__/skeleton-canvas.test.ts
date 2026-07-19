/**
 * Répartition web/natif du rendu squelette sur l'écran Résultats :
 * - web : squelette incrusté dans l'image (canvas, composeSkeletonImage)
 * - natif : superposition vivante (SkeletonOverlay), le canvas étant indispo
 */
import { Platform } from "react-native";
import type { PoseLandmarks, BilateralAngles } from "../angle-calculator";
import { LEG_COLORS, PELVIS_GUIDE_COLOR } from "../../domain/skeleton-spec";
import {
  composeSkeletonImage,
  drawSkeletonOnCanvas,
  shouldOverlayLiveSkeleton,
} from "../skeleton-canvas";

describe("shouldOverlayLiveSkeleton", () => {
  it("est vrai sur natif (iOS/Android) — pas de canvas, overlay vivant", () => {
    const spy = jest.replaceProperty(Platform, "OS", "ios");
    expect(shouldOverlayLiveSkeleton()).toBe(true);
    spy.restore();
  });

  it("est faux sur web — le squelette est déjà incrusté dans l'image", () => {
    const spy = jest.replaceProperty(Platform, "OS", "web");
    expect(shouldOverlayLiveSkeleton()).toBe(false);
    spy.restore();
  });
});

/** Fabrique un mock de CanvasRenderingContext2D qui trace les appels reçus. */
function createMockCtx() {
  return {
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    drawImage: jest.fn(),
    arc: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    strokeText: jest.fn(),
    fillText: jest.fn(),
    setLineDash: jest.fn(),
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 0,
    lineCap: "",
    font: "",
    textAlign: "left" as CanvasTextAlign,
  } as unknown as CanvasRenderingContext2D;
}

const NO_BILATERAL: BilateralAngles = {
  left: { kneeAngle: 0, hipAngle: 0, ankleAngle: 0 },
  right: { kneeAngle: 0, hipAngle: 0, ankleAngle: 0 },
  leftHKA: 0,
  rightHKA: 0,
};

/** Landmarks minimaux pour les deux jambes (hanches, genoux, chevilles). */
function makeLegLandmarks(): PoseLandmarks {
  return {
    23: { x: 0.4, y: 0.5 }, // hanche gauche
    24: { x: 0.6, y: 0.5 }, // hanche droite
    25: { x: 0.38, y: 0.7 }, // genou gauche
    26: { x: 0.62, y: 0.7 }, // genou droit
    27: { x: 0.4, y: 0.9 }, // cheville gauche
    28: { x: 0.6, y: 0.9 }, // cheville droite
  };
}

describe("drawSkeletonOnCanvas", () => {
  it("trace les segments des deux jambes avec les couleurs canoniques gauche/droite", () => {
    const ctx = createMockCtx();
    const setStrokeStyle: string[] = [];
    Object.defineProperty(ctx, "strokeStyle", {
      set: (v: string) => setStrokeStyle.push(v),
      get: () => "",
    });

    drawSkeletonOnCanvas(ctx, makeLegLandmarks(), 1000, 1000, NO_BILATERAL);

    // hanche→genou et genou→cheville pour chaque jambe = 4 segments,
    // + la ligne bassin en tirets = 5 tracés strokeStyle au total.
    expect(setStrokeStyle).toContain(LEG_COLORS.left);
    expect(setStrokeStyle).toContain(LEG_COLORS.right);
    expect(setStrokeStyle).toContain(PELVIS_GUIDE_COLOR);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("dessine une articulation (arc + fill) par landmark de jambe présent", () => {
    const ctx = createMockCtx();
    drawSkeletonOnCanvas(ctx, makeLegLandmarks(), 1000, 1000, NO_BILATERAL);

    // 3 articulations par jambe (hanche, genou, cheville) = 6 arcs
    expect(ctx.arc).toHaveBeenCalledTimes(6);
    expect(ctx.fill).toHaveBeenCalledTimes(6);
  });

  it("ignore un segment/une articulation dont l'un des landmarks est absent", () => {
    const ctx = createMockCtx();
    const landmarks: PoseLandmarks = {
      23: { x: 0.4, y: 0.5 }, // seule la hanche gauche est présente
    };

    drawSkeletonOnCanvas(ctx, landmarks, 1000, 1000, NO_BILATERAL);

    // Un seul point disponible : aucun segment (moveTo/lineTo) tracé,
    // mais l'articulation isolée est bien dessinée (arc, contour blanc).
    expect(ctx.moveTo).not.toHaveBeenCalled();
    expect(ctx.lineTo).not.toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalledTimes(1);
  });

  it("n'affiche pas la ligne bassin quand une seule hanche est visible", () => {
    const ctx = createMockCtx();
    const landmarks: PoseLandmarks = { 23: { x: 0.4, y: 0.5 } };

    drawSkeletonOnCanvas(ctx, landmarks, 1000, 1000, NO_BILATERAL);

    expect(ctx.setLineDash).not.toHaveBeenCalled();
  });

  it("affiche les labels HKA gauche/droite quand la mesure est disponible", () => {
    const ctx = createMockCtx();
    const bilateral: BilateralAngles = {
      left: { kneeAngle: 178, hipAngle: 175, ankleAngle: 90 },
      right: { kneeAngle: 176, hipAngle: 174, ankleAngle: 88 },
      leftHKA: 178.4,
      rightHKA: 182.1,
    };

    drawSkeletonOnCanvas(ctx, makeLegLandmarks(), 1000, 1000, bilateral);

    expect(ctx.fillText).toHaveBeenCalledWith(
      "G HKA: 178.4°",
      expect.any(Number),
      expect.any(Number),
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "D HKA: 182.1°",
      expect.any(Number),
      expect.any(Number),
    );
  });

  it("affiche un tiret pour un HKA non mesuré (0)", () => {
    const ctx = createMockCtx();
    drawSkeletonOnCanvas(ctx, makeLegLandmarks(), 1000, 1000, NO_BILATERAL);

    expect(ctx.fillText).toHaveBeenCalledWith(
      "G HKA: —",
      expect.any(Number),
      expect.any(Number),
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "D HKA: —",
      expect.any(Number),
      expect.any(Number),
    );
  });

  it("n'affiche pas de label d'angle articulaire quand l'angle est à 0", () => {
    const ctx = createMockCtx();
    drawSkeletonOnCanvas(ctx, makeLegLandmarks(), 1000, 1000, NO_BILATERAL);

    // Aucun des angles (hanche/genou/cheville) n'est > 0 dans NO_BILATERAL
    const jointLabelCalls = (ctx.fillText as jest.Mock).mock.calls.filter(
      ([text]: [string]) =>
        text.startsWith("Han.") || text.startsWith("Gen.") || text.startsWith("Che."),
    );
    expect(jointLabelCalls).toHaveLength(0);
  });

  it("affiche les labels d'angles articulaires quand ils sont mesurés", () => {
    const ctx = createMockCtx();
    const bilateral: BilateralAngles = {
      left: { kneeAngle: 178, hipAngle: 175, ankleAngle: 90 },
      right: { kneeAngle: 176, hipAngle: 174, ankleAngle: 88 },
      leftHKA: 178,
      rightHKA: 180,
    };

    drawSkeletonOnCanvas(ctx, makeLegLandmarks(), 1000, 1000, bilateral);

    expect(ctx.fillText).toHaveBeenCalledWith(
      "Han. 175.0°",
      expect.any(Number),
      expect.any(Number),
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "Gen. 178.0°",
      expect.any(Number),
      expect.any(Number),
    );
    expect(ctx.fillText).toHaveBeenCalledWith(
      "Che. 90.0°",
      expect.any(Number),
      expect.any(Number),
    );
  });
});

describe("composeSkeletonImage", () => {
  const DATA_URL = "data:image/jpeg;base64,ORIGINAL";

  it("retourne l'image d'origine inchangée sur natif (canvas indisponible)", async () => {
    const spy = jest.replaceProperty(Platform, "OS", "ios");
    const result = await composeSkeletonImage(
      DATA_URL,
      makeLegLandmarks(),
      NO_BILATERAL,
    );
    expect(result).toBe(DATA_URL);
    spy.restore();
  });

  it("retourne l'image d'origine si les landmarks sont absents", async () => {
    const spy = jest.replaceProperty(Platform, "OS", "web");
    const result = await composeSkeletonImage(DATA_URL, undefined, NO_BILATERAL);
    expect(result).toBe(DATA_URL);
    spy.restore();
  });

  it("retourne l'image d'origine si les angles bilatéraux sont absents", async () => {
    const spy = jest.replaceProperty(Platform, "OS", "web");
    const result = await composeSkeletonImage(
      DATA_URL,
      makeLegLandmarks(),
      undefined,
    );
    expect(result).toBe(DATA_URL);
    spy.restore();
  });

  it("retourne l'image d'origine si window/document sont indisponibles (SSR-like)", async () => {
    const spy = jest.replaceProperty(Platform, "OS", "web");
    const originalWindow = (global as unknown as { window?: unknown }).window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).window;

    const result = await composeSkeletonImage(
      DATA_URL,
      makeLegLandmarks(),
      NO_BILATERAL,
    );
    expect(result).toBe(DATA_URL);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = originalWindow;
    spy.restore();
  });

  it("compose une nouvelle dataURL avec le squelette incrusté quand tout est disponible (web)", async () => {
    const spy = jest.replaceProperty(Platform, "OS", "web");

    const mockCtx = createMockCtx();
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => mockCtx),
      toDataURL: jest.fn(() => "data:image/jpeg;base64,COMPOSED"),
    };

    class MockImage {
      naturalWidth = 800;
      naturalHeight = 600;
      width = 800;
      height = 600;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    const originalDocument = (global as unknown as { document?: unknown })
      .document;
    const originalWindow = (global as unknown as { window?: unknown }).window;

    (global as unknown as { document: { createElement: jest.Mock } }).document =
      {
        createElement: jest.fn(() => mockCanvas),
      };
    (global as unknown as { window: { Image: typeof MockImage } }).window = {
      Image: MockImage,
    };

    const result = await composeSkeletonImage(
      DATA_URL,
      makeLegLandmarks(),
      NO_BILATERAL,
    );

    expect(result).toBe("data:image/jpeg;base64,COMPOSED");
    expect(mockCanvas.width).toBe(800);
    expect(mockCanvas.height).toBe(600);
    expect(mockCtx.stroke).toHaveBeenCalled();
    expect(mockCanvas.toDataURL).toHaveBeenCalledWith("image/jpeg", 0.88);

    (global as unknown as { document?: unknown }).document = originalDocument;
    (global as unknown as { window?: unknown }).window = originalWindow;
    spy.restore();
  });

  it("retourne l'image d'origine si le contexte 2D du canvas est indisponible", async () => {
    const spy = jest.replaceProperty(Platform, "OS", "web");

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => null),
      toDataURL: jest.fn(),
    };

    class MockImage {
      naturalWidth = 800;
      naturalHeight = 600;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    const originalDocument = (global as unknown as { document?: unknown })
      .document;
    const originalWindow = (global as unknown as { window?: unknown }).window;

    (global as unknown as { document: { createElement: jest.Mock } }).document =
      {
        createElement: jest.fn(() => mockCanvas),
      };
    (global as unknown as { window: { Image: typeof MockImage } }).window = {
      Image: MockImage,
    };

    const result = await composeSkeletonImage(
      DATA_URL,
      makeLegLandmarks(),
      NO_BILATERAL,
    );

    expect(result).toBe(DATA_URL);
    expect(mockCanvas.toDataURL).not.toHaveBeenCalled();

    (global as unknown as { document?: unknown }).document = originalDocument;
    (global as unknown as { window?: unknown }).window = originalWindow;
    spy.restore();
  });
});
