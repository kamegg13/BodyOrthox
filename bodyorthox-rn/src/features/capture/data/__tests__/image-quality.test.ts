import { analyzeImageQuality, ImageQualityError } from "../image-quality";

/**
 * Mock canvas and image APIs for Node test environment.
 * We simulate pixel data to test brightness, contrast, and sharpness logic.
 */

interface MockCanvasContext {
  drawImage: jest.Mock;
  getImageData: jest.Mock;
}

function createMockImage(width: number, height: number): HTMLImageElement {
  return {
    naturalWidth: width,
    naturalHeight: height,
  } as HTMLImageElement;
}

function createMockPixelData(
  width: number,
  height: number,
  fillFn: (x: number, y: number) => [number, number, number],
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = fillFn(x, y);
      const offset = (y * width + x) * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = 255;
    }
  }
  return data;
}

let pixelFillFn: (x: number, y: number) => [number, number, number] = () => [
  128, 128, 128,
];

// Mock document.createElement for canvas support in Node
const mockDocument = {
  createElement: jest.fn(),
};

beforeAll(() => {
  (global as Record<string, unknown>).document = mockDocument;
});

beforeEach(() => {
  pixelFillFn = () => [128, 128, 128];

  mockDocument.createElement.mockImplementation((tagName: string) => {
    if (tagName === "canvas") {
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => ({
          drawImage: jest.fn(),
          getImageData: jest.fn(
            (_sx: number, _sy: number, w: number, h: number) => {
              const data = createMockPixelData(w, h, pixelFillFn);
              return { data, width: w, height: h };
            },
          ),
        }),
      };
      return canvas;
    }
    return {};
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

function setPixelFill(
  fillFn: (x: number, y: number) => [number, number, number],
): void {
  pixelFillFn = fillFn;
}

describe("analyzeImageQuality", () => {
  it("accepts a normal well-lit image", () => {
    const image = createMockImage(1920, 1080);
    // Alternating blocks of light/dark => good contrast and sharpness
    setPixelFill((x, y) => {
      // Create blocks of varying brightness
      const blockVal =
        (Math.floor(x / 5) + Math.floor(y / 5)) % 2 === 0 ? 180 : 60;
      return [blockVal, blockVal, blockVal];
    });

    const result = analyzeImageQuality(image);
    expect(result.isAcceptable).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.brightnessScore).toBeGreaterThan(0.15);
    expect(result.brightnessScore).toBeLessThan(0.85);
  });

  it("rejects low resolution image", () => {
    const image = createMockImage(320, 240);

    const result = analyzeImageQuality(image);
    expect(result.isAcceptable).toBe(false);
    expect(result.issues.some((i) => i.includes("Résolution"))).toBe(true);
  });

  it("rejects too dark image", () => {
    const image = createMockImage(1920, 1080);
    setPixelFill(() => [10, 10, 10]);

    const result = analyzeImageQuality(image);
    expect(result.isAcceptable).toBe(false);
    expect(result.issues.some((i) => i.includes("sombre"))).toBe(true);
    expect(result.brightnessScore).toBeLessThan(0.15);
  });

  it("rejects too bright image", () => {
    const image = createMockImage(1920, 1080);
    setPixelFill(() => [250, 250, 250]);

    const result = analyzeImageQuality(image);
    expect(result.isAcceptable).toBe(false);
    expect(result.issues.some((i) => i.includes("claire"))).toBe(true);
    expect(result.brightnessScore).toBeGreaterThan(0.85);
  });

  it("rejects low contrast image", () => {
    const image = createMockImage(1920, 1080);
    // All pixels the same => zero contrast
    setPixelFill(() => [128, 128, 128]);

    const result = analyzeImageQuality(image);
    expect(result.issues.some((i) => i.includes("Contraste"))).toBe(true);
    expect(result.contrastScore).toBeLessThan(0.15);
  });

  it("rejects blurry image (low sharpness)", () => {
    const image = createMockImage(1920, 1080);
    // Uniform image => no edges => blurry
    setPixelFill(() => [128, 128, 128]);

    const result = analyzeImageQuality(image);
    expect(result.issues.some((i) => i.includes("floue"))).toBe(true);
    expect(result.sharpnessScore).toBeLessThan(0.1);
  });

  it("detects sharp image with edges", () => {
    const image = createMockImage(1920, 1080);
    // Checkerboard pattern => lots of edges => sharp
    setPixelFill((x, y) => {
      const val = (x + y) % 2 === 0 ? 200 : 50;
      return [val, val, val];
    });

    const result = analyzeImageQuality(image);
    expect(result.sharpnessScore).toBeGreaterThan(0.1);
  });

  it("can report multiple issues at once", () => {
    const image = createMockImage(320, 240); // low res
    setPixelFill(() => [5, 5, 5]); // dark and uniform

    const result = analyzeImageQuality(image);
    expect(result.isAcceptable).toBe(false);
    expect(result.issues.length).toBeGreaterThanOrEqual(2);
  });

  it("all issue messages are in French", () => {
    const image = createMockImage(320, 240);
    setPixelFill(() => [5, 5, 5]);

    const result = analyzeImageQuality(image);
    for (const issue of result.issues) {
      expect(issue).toMatch(
        /[éèêëàâùûïîç]|Résolution|luminosité|Contraste|floue|Stabilisez/,
      );
    }
  });
});

describe("ImageQualityError", () => {
  it("has correct name and issues", () => {
    const issues = ["Image trop sombre", "Résolution insuffisante"];
    const error = new ImageQualityError(issues);

    expect(error.name).toBe("ImageQualityError");
    expect(error.issues).toEqual(issues);
    expect(error.message).toContain("Qualité");
  });

  it("is an instance of Error", () => {
    const error = new ImageQualityError(["test"]);
    expect(error).toBeInstanceOf(Error);
  });
});
