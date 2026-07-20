import {
  prepareChartData,
  getAngleRange,
  linearRegression,
  angleRangeStatus,
  generateYGraduations,
  type ChartDataPoint,
} from "../chart-math";
import type { Analysis } from "../../../capture/domain/analysis";

function buildAnalysis(
  id: string,
  createdAt: string,
  angles: { kneeAngle: number; hipAngle: number; ankleAngle: number },
): Analysis {
  return {
    id,
    patientId: "p1",
    createdAt,
    angles,
    confidenceScore: 0.9,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
  };
}

describe("prepareChartData", () => {
  it("trie les analyses par date croissante quel que soit l'ordre d'entrée", () => {
    const analyses = [
      buildAnalysis("later", "2026-03-01T00:00:00Z", { kneeAngle: 170, hipAngle: 176, ankleAngle: 90 }),
      buildAnalysis("earlier", "2026-01-01T00:00:00Z", { kneeAngle: 178, hipAngle: 176, ankleAngle: 90 }),
    ];

    const result = prepareChartData(analyses);

    expect(result.map((d) => d.kneeAngle)).toEqual([178, 170]);
  });

  it("projette date formatée, timestamp et les 3 angles pour chaque analyse", () => {
    const analyses = [
      buildAnalysis("a1", "2026-01-15T00:00:00Z", { kneeAngle: 178, hipAngle: 176, ankleAngle: 91 }),
    ];

    const [point] = prepareChartData(analyses);

    expect(point.date).toBe("15/01/2026");
    expect(point.timestamp).toBe(new Date("2026-01-15T00:00:00Z").getTime());
    expect(point.kneeAngle).toBe(178);
    expect(point.hipAngle).toBe(176);
    expect(point.ankleAngle).toBe(91);
  });

  it("renvoie un tableau vide pour aucune analyse", () => {
    expect(prepareChartData([])).toEqual([]);
  });
});

describe("getAngleRange", () => {
  it("renvoie la plage par défaut 0–180 quand il n'y a aucune donnée", () => {
    expect(getAngleRange([])).toEqual({ min: 0, max: 180 });
  });

  it("étend toujours la plage pour inclure la plage de référence HKA (175–180)", () => {
    const data: ChartDataPoint[] = [
      { date: "01/01/2026", timestamp: 0, kneeAngle: 100, hipAngle: 100, ankleAngle: 100 },
    ];

    const { min, max } = getAngleRange(data);

    expect(min).toBeLessThanOrEqual(175);
    expect(max).toBeGreaterThanOrEqual(180);
  });

  it("arrondit la plage à la dizaine avec une marge de 5°", () => {
    const data: ChartDataPoint[] = [
      { date: "01/01/2026", timestamp: 0, kneeAngle: 163, hipAngle: 163, ankleAngle: 163 },
    ];

    // 163 - 5 = 158 -> floor/10*10 = 150 ; plage de référence max 180 + 5 = 185 -> ceil/10*10 = 190
    expect(getAngleRange(data)).toEqual({ min: 150, max: 190 });
  });

  it("ne descend jamais sous 0 ni ne dépasse 360", () => {
    const data: ChartDataPoint[] = [
      { date: "01/01/2026", timestamp: 0, kneeAngle: 2, hipAngle: 2, ankleAngle: 2 },
    ];

    const { min } = getAngleRange(data);
    expect(min).toBeGreaterThanOrEqual(0);
  });
});

describe("linearRegression", () => {
  it("renvoie une pente nulle et l'unique valeur y comme ordonnée pour un seul point", () => {
    expect(linearRegression([{ x: 0, y: 42 }])).toEqual({ slope: 0, intercept: 42 });
  });

  it("renvoie une pente et une ordonnée nulles sans aucun point", () => {
    expect(linearRegression([])).toEqual({ slope: 0, intercept: 0 });
  });

  it("calcule la pente exacte d'une droite parfaite y = 2x + 1", () => {
    const points = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
    ];

    const { slope, intercept } = linearRegression(points);

    expect(slope).toBeCloseTo(2);
    expect(intercept).toBeCloseTo(1);
  });

  it("moyenne les y quand tous les x sont identiques (dénominateur nul)", () => {
    const points = [
      { x: 5, y: 10 },
      { x: 5, y: 20 },
    ];

    expect(linearRegression(points)).toEqual({ slope: 0, intercept: 15 });
  });
});

describe("angleRangeStatus", () => {
  it("classe un angle dans la plage de référence comme in_range", () => {
    expect(angleRangeStatus(178)).toBe("in_range");
  });

  it("classe un angle hors plage comme out_of_range", () => {
    expect(angleRangeStatus(160)).toBe("out_of_range");
  });

  it("classe un angle non mesurable (0) comme unavailable", () => {
    expect(angleRangeStatus(0)).toBe("unavailable");
  });
});

describe("generateYGraduations", () => {
  it("génère une graduation tous les 10° entre min et max inclus", () => {
    expect(generateYGraduations(150, 190)).toEqual([150, 160, 170, 180, 190]);
  });

  it("part de la première dizaine supérieure ou égale à min", () => {
    expect(generateYGraduations(153, 173)).toEqual([160, 170]);
  });

  it("renvoie un tableau vide si min > max", () => {
    expect(generateYGraduations(190, 150)).toEqual([]);
  });
});
