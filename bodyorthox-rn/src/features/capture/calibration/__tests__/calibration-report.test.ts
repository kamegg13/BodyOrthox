import {
  buildCalibrationReport,
  formatCalibrationReport,
  selectKind,
} from "../calibration-report";
import type { CalibrationSample } from "../calibration-types";

const s = (
  side: "left" | "right",
  predictedHKA: number,
  groundTruthHKA: number,
): CalibrationSample => ({
  sampleId: `${side}-${predictedHKA}`,
  side,
  predictedHKA,
  groundTruthHKA,
});

describe("selectKind", () => {
  it("prefers the simplest model within the parsimony margin", () => {
    const candidates = [
      { kind: "identity" as const, loocvMae: 3.0, loocvRmse: 3, loocvBias: 3 },
      { kind: "offset" as const, loocvMae: 0.5, loocvRmse: 0.5, loocvBias: 0 },
      { kind: "linear" as const, loocvMae: 0.45, loocvRmse: 0.45, loocvBias: 0 },
    ];
    // linear only beats offset by 0.05 < margin 0.1 → stay on offset
    expect(selectKind(candidates, 0.1)).toBe("offset");
  });

  it("stays on identity when nothing beats it meaningfully", () => {
    const candidates = [
      { kind: "identity" as const, loocvMae: 1.0, loocvRmse: 1, loocvBias: 0 },
      { kind: "offset" as const, loocvMae: 0.95, loocvRmse: 1, loocvBias: 0 },
      { kind: "linear" as const, loocvMae: 0.95, loocvRmse: 1, loocvBias: 0 },
    ];
    expect(selectKind(candidates, 0.1)).toBe("identity");
  });

  it("adopts linear when it clearly wins", () => {
    const candidates = [
      { kind: "identity" as const, loocvMae: 3, loocvRmse: 3, loocvBias: 3 },
      { kind: "offset" as const, loocvMae: 2, loocvRmse: 2, loocvBias: 0 },
      { kind: "linear" as const, loocvMae: 0.3, loocvRmse: 0.3, loocvBias: 0 },
    ];
    expect(selectKind(candidates, 0.1)).toBe("linear");
  });
});

describe("buildCalibrationReport", () => {
  // Pure offset bias of -3 on the left, slope on the right.
  const samples: CalibrationSample[] = [
    ...[174, 178, 180, 183, 186].map((p) => s("left", p, p - 3)),
    ...[176, 179, 181, 184, 187].map((p) => s("right", 1.15 * p - 28, p)),
  ];

  it("chooses offset for a constant-bias side", () => {
    const r = buildCalibrationReport(samples, "2026-06-06T00:00:00.000Z");
    expect(r.left.chosen).toBe("offset");
    expect(r.left.model.coefficients.b).toBeCloseTo(-3, 6);
    expect(r.left.loocv.mae).toBeLessThan(r.left.baselineMae);
  });

  it("reports an embedded, reproducible model", () => {
    const r = buildCalibrationReport(samples, "2026-06-06T00:00:00.000Z");
    expect(r.model.version).toBe(1);
    expect(r.model.createdAt).toBe("2026-06-06T00:00:00.000Z");
    expect(r.model.left).toEqual(r.left.model);
    expect(r.model.right).toEqual(r.right.model);
  });

  it("improves clinical balanced accuracy over the raw baseline", () => {
    const r = buildCalibrationReport(samples, "2026-06-06T00:00:00.000Z");
    expect(
      r.left.clinicalCalibrated.balancedAccuracy,
    ).toBeGreaterThanOrEqual(r.left.clinicalRaw.balancedAccuracy);
  });

  it("handles an empty side gracefully", () => {
    const r = buildCalibrationReport(
      [s("left", 180, 177)],
      "2026-06-06T00:00:00.000Z",
    );
    expect(r.right.n).toBe(0);
    expect(r.right.chosen).toBe("identity");
  });
});

describe("formatCalibrationReport", () => {
  it("renders a readable text report", () => {
    const samples = [
      ...[176, 180, 184].map((p) => s("left", p, p - 3)),
      ...[177, 181, 185].map((p) => s("right", p, p - 2)),
    ];
    const text = formatCalibrationReport(
      buildCalibrationReport(samples, "2026-06-06T00:00:00.000Z"),
    );
    expect(text).toContain("RAPPORT DE CALIBRATION HKA");
    expect(text).toContain("GAUCHE");
    expect(text).toContain("DROIT");
    expect(text).toContain("Bland-Altman");
  });
});
