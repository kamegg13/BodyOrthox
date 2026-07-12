import {
  averageLuma,
  startLuminositySampling,
  LUMINOSITY_SAMPLE_INTERVAL_MS,
  LUMINOSITY_SAMPLE_SIZE,
} from "../luminosity-sampler";

function solidRgba(r: number, g: number, b: number, pixelCount: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(pixelCount * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  return data;
}

describe("averageLuma", () => {
  it("renvoie 0 pour une image entièrement noire", () => {
    expect(averageLuma(solidRgba(0, 0, 0, 16))).toBe(0);
  });

  it("renvoie 255 pour une image entièrement blanche", () => {
    expect(averageLuma(solidRgba(255, 255, 255, 16))).toBe(255);
  });

  it("applique les coefficients ITU-R BT.601 (0.299R + 0.587G + 0.114B)", () => {
    // Rouge pur : 0.299 * 255 = 76.245
    expect(averageLuma(solidRgba(255, 0, 0, 4))).toBeCloseTo(76.245, 2);
  });

  it("fait la moyenne sur plusieurs pixels différents", () => {
    const black = solidRgba(0, 0, 0, 2);
    const white = solidRgba(255, 255, 255, 2);
    const mixed = new Uint8ClampedArray([...black, ...white]);
    expect(averageLuma(mixed)).toBeCloseTo(127.5, 1);
  });

  it("renvoie 0 pour un buffer vide plutôt que de diviser par zéro", () => {
    expect(averageLuma(new Uint8ClampedArray(0))).toBe(0);
  });
});

describe("startLuminositySampling", () => {
  interface FakeContext {
    drawImage: jest.Mock;
    getImageData: jest.Mock;
  }

  function fakeCanvasWith(imageData: { data: Uint8ClampedArray } | null): {
    canvas: { width: number; height: number; getContext: jest.Mock };
    ctx: FakeContext | null;
  } {
    if (imageData === null) {
      return { canvas: { width: 0, height: 0, getContext: jest.fn(() => null) }, ctx: null };
    }
    const ctx: FakeContext = {
      drawImage: jest.fn(),
      getImageData: jest.fn(() => imageData),
    };
    return { canvas: { width: 0, height: 0, getContext: jest.fn(() => ctx) }, ctx };
  }

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask", "setImmediate"] });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("échantillonne immédiatement puis toutes les intervalMs", () => {
    const grayData = { data: solidRgba(128, 128, 128, LUMINOSITY_SAMPLE_SIZE ** 2) };
    const { canvas, ctx } = fakeCanvasWith(grayData);
    const video = { videoWidth: 640, videoHeight: 480 };
    const onSample = jest.fn();

    const stop = startLuminositySampling(video, canvas, onSample);

    expect(onSample).toHaveBeenCalledTimes(1);
    expect(onSample.mock.calls[0][0]).toBeCloseTo(128, 5);
    expect(ctx!.drawImage).toHaveBeenCalledWith(
      video,
      0,
      0,
      LUMINOSITY_SAMPLE_SIZE,
      LUMINOSITY_SAMPLE_SIZE,
    );

    jest.advanceTimersByTime(LUMINOSITY_SAMPLE_INTERVAL_MS);
    expect(onSample).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(LUMINOSITY_SAMPLE_INTERVAL_MS);
    expect(onSample).toHaveBeenCalledTimes(3);

    stop();
    jest.advanceTimersByTime(LUMINOSITY_SAMPLE_INTERVAL_MS * 3);
    expect(onSample).toHaveBeenCalledTimes(3);
  });

  it("dimensionne le canvas à LUMINOSITY_SAMPLE_SIZE (downscale — coût main thread borné)", () => {
    const { canvas } = fakeCanvasWith({ data: solidRgba(0, 0, 0, LUMINOSITY_SAMPLE_SIZE ** 2) });
    const video = { videoWidth: 1280, videoHeight: 720 };

    startLuminositySampling(video, canvas, jest.fn());

    expect(canvas.width).toBe(LUMINOSITY_SAMPLE_SIZE);
    expect(canvas.height).toBe(LUMINOSITY_SAMPLE_SIZE);
  });

  it("n'échantillonne jamais tant que la vidéo n'a pas de dimensions (pas de frame fabriquée)", () => {
    const { canvas, ctx } = fakeCanvasWith({ data: solidRgba(0, 0, 0, LUMINOSITY_SAMPLE_SIZE ** 2) });
    const video = { videoWidth: 0, videoHeight: 0 };
    const onSample = jest.fn();

    startLuminositySampling(video, canvas, onSample);
    jest.advanceTimersByTime(LUMINOSITY_SAMPLE_INTERVAL_MS * 4);

    expect(ctx!.drawImage).not.toHaveBeenCalled();
    expect(onSample).not.toHaveBeenCalled();
  });

  it("ne lève pas d'exception et renvoie un stop no-op quand le contexte 2D est indisponible", () => {
    const { canvas } = fakeCanvasWith(null);
    const onSample = jest.fn();

    const stop = startLuminositySampling({ videoWidth: 100, videoHeight: 100 }, canvas, onSample);
    expect(() => stop()).not.toThrow();
    expect(onSample).not.toHaveBeenCalled();
  });

  it("respecte un intervalMs personnalisé", () => {
    const { canvas } = fakeCanvasWith({ data: solidRgba(64, 64, 64, LUMINOSITY_SAMPLE_SIZE ** 2) });
    const video = { videoWidth: 640, videoHeight: 480 };
    const onSample = jest.fn();

    startLuminositySampling(video, canvas, onSample, 1000);

    expect(onSample).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(999);
    expect(onSample).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1);
    expect(onSample).toHaveBeenCalledTimes(2);
  });
});
