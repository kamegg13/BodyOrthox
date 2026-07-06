import {
  mae,
  rmse,
  meanBias,
  blandAltman,
  leaveOneOut,
  inSampleResiduals,
  classifyByThresholds,
  confusionMatrix,
  sweepThresholds,
  sideArrays,
} from "../eval-metrics";
import type { CalibrationSample, HkaCategory } from "../calibration-types";

const s = (
  predictedHKA: number,
  groundTruthHKA: number,
  side: "left" | "right" = "left",
): CalibrationSample => ({
  sampleId: `s${predictedHKA}`,
  side,
  predictedHKA,
  groundTruthHKA,
});

describe("scalar metrics", () => {
  it("mae averages absolute residuals", () => {
    expect(mae([2, -4, 0])).toBeCloseTo(2, 9);
  });
  it("rmse averages squared residuals", () => {
    expect(rmse([3, 4])).toBeCloseTo(Math.sqrt(12.5), 9);
  });
  it("meanBias keeps the sign", () => {
    expect(meanBias([2, -4, 5])).toBeCloseTo(1, 9);
  });
  it("empty inputs are zero", () => {
    expect(mae([])).toBe(0);
    expect(rmse([])).toBe(0);
    expect(meanBias([])).toBe(0);
  });
});

describe("blandAltman", () => {
  it("computes bias, sample SD and 95% limits of agreement", () => {
    const r = blandAltman([2, 4]);
    expect(r.bias).toBeCloseTo(3, 9);
    expect(r.sd).toBeCloseTo(Math.sqrt(2), 9); // sample SD (n-1)
    expect(r.lowerLoA).toBeCloseTo(3 - 1.96 * Math.sqrt(2), 9);
    expect(r.upperLoA).toBeCloseTo(3 + 1.96 * Math.sqrt(2), 9);
  });
  it("handles a single difference without NaN", () => {
    const r = blandAltman([5]);
    expect(r.bias).toBe(5);
    expect(r.sd).toBe(0);
  });
});

describe("leaveOneOut", () => {
  it("recovers a pure offset out-of-sample with near-zero residuals", () => {
    // truth = predicted - 3 for every point → offset model generalizes
    const samples = [173, 177, 180, 184, 188].map((p) => s(p, p - 3));
    const r = leaveOneOut(samples, "offset");
    expect(r.mae).toBeCloseTo(0, 6);
    expect(r.bias).toBeCloseTo(0, 6);
    expect(r.corrected).toHaveLength(5);
  });

  it("identity LOOCV equals the raw error vs truth", () => {
    const samples = [s(180, 177), s(182, 178)];
    const r = leaveOneOut(samples, "identity");
    // residual = predicted - truth = [3, 4]
    expect(r.mae).toBeCloseTo(3.5, 9);
  });

  it("linear LOOCV beats identity when there is a slope", () => {
    // truth = 1.2*pred - 36 (slope ≠ 1) → linear should generalize, identity not
    const samples = [175, 178, 181, 184, 187, 190].map((p) =>
      s(p, 1.2 * p - 36),
    );
    const lin = leaveOneOut(samples, "linear");
    const idn = leaveOneOut(samples, "identity");
    expect(lin.mae).toBeLessThan(idn.mae);
    expect(lin.mae).toBeCloseTo(0, 4);
  });
});

describe("inSampleResiduals", () => {
  it("is optimistic (zero) for an offset fit on its own data", () => {
    const samples = [s(180, 176), s(184, 181)];
    const res = inSampleResiduals(samples, "offset");
    // mean bias removed in-sample → residuals sum to ~0
    expect(res.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 9);
  });
});

describe("classifyByThresholds", () => {
  const t = { varumBelow: 177, valgumAbove: 183 };
  it("classifies varum / normal / valgum", () => {
    expect(classifyByThresholds(174, t)).toBe("varum");
    expect(classifyByThresholds(180, t)).toBe("normal");
    expect(classifyByThresholds(185, t)).toBe("valgum");
  });
  it("is exclusive at the boundaries", () => {
    expect(classifyByThresholds(177, t)).toBe("normal");
    expect(classifyByThresholds(183, t)).toBe("normal");
  });
});

describe("confusionMatrix", () => {
  it("computes accuracy and balanced accuracy", () => {
    const pred: HkaCategory[] = ["varum", "normal", "valgum", "normal"];
    const truth: HkaCategory[] = ["varum", "normal", "valgum", "valgum"];
    const cm = confusionMatrix(pred, truth);
    expect(cm.total).toBe(4);
    expect(cm.accuracy).toBeCloseTo(0.75, 9);
    // recalls: varum 1/1, normal 1/1, valgum 1/2 → mean 0.8333
    expect(cm.balancedAccuracy).toBeCloseTo((1 + 1 + 0.5) / 3, 9);
  });
  it("throws on length mismatch", () => {
    expect(() => confusionMatrix(["varum"], [])).toThrow();
  });
});

describe("sweepThresholds", () => {
  it("finds thresholds that separate the categories", () => {
    // clean separation: <176 varum, >184 valgum
    const measured = [172, 174, 179, 181, 186, 188];
    const truth: HkaCategory[] = [
      "varum",
      "varum",
      "normal",
      "normal",
      "valgum",
      "valgum",
    ];
    const r = sweepThresholds(measured, truth, { min: 170, max: 190, step: 1 });
    expect(r.balancedAccuracy).toBeCloseTo(1, 9);
    expect(r.thresholds.varumBelow).toBeGreaterThan(174);
    expect(r.thresholds.varumBelow).toBeLessThanOrEqual(179);
    expect(r.thresholds.valgumAbove).toBeGreaterThanOrEqual(181);
    expect(r.thresholds.valgumAbove).toBeLessThan(186);
  });
});

describe("sideArrays", () => {
  it("extracts predicted/truth arrays for one side", () => {
    const arr = sideArrays([s(180, 177, "left"), s(181, 178, "right")], "left");
    expect(arr.predicted).toEqual([180]);
    expect(arr.truth).toEqual([177]);
  });
});
