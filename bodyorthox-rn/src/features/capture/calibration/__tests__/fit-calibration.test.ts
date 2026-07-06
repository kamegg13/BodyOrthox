import {
  fitIdentity,
  fitOffset,
  fitLinear,
  fitSideModel,
  splitBySide,
  fitCalibrationModel,
  sideModelFor,
} from "../fit-calibration";
import type { CalibrationSample } from "../calibration-types";

const sample = (
  side: "left" | "right",
  predictedHKA: number,
  groundTruthHKA: number,
  id = `${side}-${predictedHKA}`,
): CalibrationSample => ({ sampleId: id, side, predictedHKA, groundTruthHKA });

describe("fitIdentity", () => {
  it("returns the identity line", () => {
    expect(fitIdentity()).toEqual({ a: 1, b: 0 });
  });
});

describe("fitOffset", () => {
  it("computes the mean bias as intercept, slope 1", () => {
    // y - x = [3, 5, 4] → mean 4
    const co = fitOffset([10, 20, 30], [13, 25, 34]);
    expect(co.a).toBe(1);
    expect(co.b).toBeCloseTo(4, 10);
  });

  it("throws on length mismatch and empty input", () => {
    expect(() => fitOffset([1], [1, 2])).toThrow();
    expect(() => fitOffset([], [])).toThrow();
  });
});

describe("fitLinear", () => {
  it("recovers a perfect line y = 2x + 1", () => {
    const xs = [1, 2, 3, 4];
    const ys = xs.map((x) => 2 * x + 1);
    const co = fitLinear(xs, ys);
    expect(co.a).toBeCloseTo(2, 9);
    expect(co.b).toBeCloseTo(1, 9);
  });

  it("does ordinary least squares on noisy data", () => {
    // Classic example: slope 0.6, intercept 2.2 for these points
    const co = fitLinear([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]);
    expect(co.a).toBeCloseTo(0.6, 6);
    expect(co.b).toBeCloseTo(2.2, 6);
  });

  it("throws with fewer than 2 points", () => {
    expect(() => fitLinear([1], [1])).toThrow(/at least 2/);
  });

  it("throws on a degenerate design (no variance in x)", () => {
    expect(() => fitLinear([5, 5, 5], [1, 2, 3])).toThrow(/degenerate/);
  });
});

describe("fitSideModel", () => {
  it("returns identity when asked", () => {
    const m = fitSideModel([sample("left", 180, 177)], "identity");
    expect(m.kind).toBe("identity");
    expect(m.coefficients).toEqual({ a: 1, b: 0 });
    expect(m.n).toBe(1);
  });

  it("returns offset for a single point even when linear is requested", () => {
    const m = fitSideModel([sample("left", 180, 177)], "linear");
    expect(m.kind).toBe("offset");
    expect(m.coefficients.b).toBeCloseTo(-3, 9);
  });

  it("fits a linear model when enough varied data is present", () => {
    const samples = [
      sample("left", 176, 172),
      sample("left", 180, 177),
      sample("left", 184, 182),
    ];
    const m = fitSideModel(samples, "linear");
    expect(m.kind).toBe("linear");
    expect(m.n).toBe(3);
  });

  it("degrades linear → offset on degenerate x", () => {
    const samples = [
      sample("left", 180, 176),
      sample("left", 180, 178),
    ];
    const m = fitSideModel(samples, "linear");
    expect(m.kind).toBe("offset");
    expect(m.coefficients.b).toBeCloseTo(-3, 9); // mean(176-180,178-180) = -3
  });

  it("returns identity on empty input", () => {
    expect(fitSideModel([], "linear").kind).toBe("identity");
  });
});

describe("splitBySide", () => {
  it("partitions samples by side", () => {
    const { left, right } = splitBySide([
      sample("left", 1, 1),
      sample("right", 2, 2),
      sample("left", 3, 3),
    ]);
    expect(left).toHaveLength(2);
    expect(right).toHaveLength(1);
  });
});

describe("fitCalibrationModel", () => {
  it("fits both sides and stamps a deterministic timestamp", () => {
    const model = fitCalibrationModel(
      [
        sample("left", 178, 174),
        sample("left", 182, 178),
        sample("right", 179, 176),
        sample("right", 183, 180),
      ],
      "offset",
      "2026-06-06T00:00:00.000Z",
    );
    expect(model.version).toBe(1);
    expect(model.createdAt).toBe("2026-06-06T00:00:00.000Z");
    expect(sideModelFor(model, "left").coefficients.b).toBeCloseTo(-4, 9);
    expect(sideModelFor(model, "right").coefficients.b).toBeCloseTo(-3, 9);
  });
});
