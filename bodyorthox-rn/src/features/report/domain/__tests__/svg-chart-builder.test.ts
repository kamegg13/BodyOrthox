import { Analysis } from "../../../capture/domain/analysis";
import {
  projectX,
  projectY,
  buildGridAndAxes,
  buildPolyline,
  buildDateLabels,
  buildNormalRangeRect,
  buildLegend,
  generateSvgChart,
  type ChartConfig,
} from "../svg-chart-builder";

function makeAnalysis(id: string, createdAt: string): Analysis {
  return {
    id,
    patientId: "patient-1",
    createdAt,
    angles: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 },
    confidenceScore: 0.9,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
  };
}

const cfg: ChartConfig = { width: 500, height: 250, yMin: 170, yMax: 185 };

// ─── projectX / projectY ────────────────────────────────────────

describe("projectX", () => {
  it("centers a single point when total <= 1", () => {
    expect(projectX(0, 1, cfg)).toBeCloseTo(50 + (500 - 50 - 20) / 2);
  });

  it("places the first point at the left edge and the last at the right edge", () => {
    expect(projectX(0, 3, cfg)).toBeCloseTo(50);
    expect(projectX(2, 3, cfg)).toBeCloseTo(500 - 20);
  });
});

describe("projectY", () => {
  it("maps yMax to the top of the chart area and yMin to the bottom", () => {
    const top = projectY(cfg.yMax, cfg);
    const bottom = projectY(cfg.yMin, cfg);
    expect(top).toBeLessThan(bottom);
  });
});

// ─── buildGridAndAxes ────────────────────────────────────────────

describe("buildGridAndAxes", () => {
  it("emits one horizontal grid line + label per tick, plus X and Y axes", () => {
    const svg = buildGridAndAxes(cfg, 5);
    const tickCount = Math.floor((cfg.yMax - cfg.yMin) / 5) + 1;
    expect((svg.match(/<line/g) ?? []).length).toBe(tickCount + 2); // grid lines + 2 axes
    expect(svg).toContain("170°");
    expect(svg).toContain("185°");
  });
});

// ─── buildPolyline ───────────────────────────────────────────────

describe("buildPolyline", () => {
  it("returns an empty string when there is no positive value", () => {
    expect(buildPolyline([0, 0], cfg, "#059669")).toBe("");
  });

  it("renders only circles (no polyline) for a single valid point", () => {
    const svg = buildPolyline([176, 0], cfg, "#059669");
    expect(svg).not.toContain("<polyline");
    expect(svg).toContain("<circle");
  });

  it("renders a polyline connecting all valid points, skipping zero values", () => {
    const svg = buildPolyline([176, 0, 178], cfg, "#059669");
    expect(svg).toContain("<polyline");
    expect((svg.match(/<circle/g) ?? []).length).toBe(2);
  });
});

// ─── buildDateLabels ─────────────────────────────────────────────

describe("buildDateLabels", () => {
  it("renders one label per analysis when there are 6 or fewer", () => {
    const analyses = [
      makeAnalysis("a1", "2026-01-01T00:00:00.000Z"),
      makeAnalysis("a2", "2026-02-01T00:00:00.000Z"),
    ];
    const svg = buildDateLabels(analyses, cfg);
    expect((svg.match(/<text/g) ?? []).length).toBe(2);
    expect(svg).not.toContain("rotate");
  });

  it("alternates labels and rotates them when there are more than 6", () => {
    const analyses = Array.from({ length: 8 }, (_, i) =>
      makeAnalysis(`a${i}`, `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`),
    );
    const svg = buildDateLabels(analyses, cfg);
    expect(svg).toContain("rotate(-45");
    // ceil(8/2) = 4 labels shown (indices 0,2,4,6)
    expect((svg.match(/<text/g) ?? []).length).toBe(4);
  });
});

// ─── buildNormalRangeRect ────────────────────────────────────────

describe("buildNormalRangeRect", () => {
  it("renders the range rect without a label by default", () => {
    const svg = buildNormalRangeRect(
      { min: 175, max: 180, fill: "#D9F2E5", stroke: "#059669", opacity: 0.7 },
      cfg,
    );
    expect(svg).toContain("<rect");
    expect(svg).not.toContain("<text");
  });

  it("renders an optional label anchored inside the rect", () => {
    const svg = buildNormalRangeRect(
      {
        min: 175,
        max: 180,
        fill: "#D9F2E5",
        stroke: "#059669",
        opacity: 0.7,
        label: "Plage de référence",
      },
      cfg,
    );
    expect(svg).toContain("Plage de référence");
    expect(svg).toContain('fill="#059669"');
  });
});

// ─── buildLegend ─────────────────────────────────────────────────

describe("buildLegend", () => {
  it("renders one swatch + label per item, label offset by 14px from the swatch", () => {
    const svg = buildLegend(
      [
        { xOffset: 0, color: "#059669", label: "Gauche" },
        { xOffset: 90, color: "#0891B2", label: "Droite" },
      ],
      cfg,
    );
    expect((svg.match(/<rect/g) ?? []).length).toBe(2);
    expect(svg).toContain("Gauche");
    expect(svg).toContain("Droite");
  });

  it("adds a stroke to the swatch when strokeColor is provided", () => {
    const svg = buildLegend(
      [{ xOffset: 0, color: "#D9F2E5", strokeColor: "#059669", strokeWidth: 0.8, label: "Plage" }],
      cfg,
    );
    expect(svg).toContain('stroke="#059669"');
    expect(svg).toContain('stroke-width="0.8"');
  });
});

// ─── generateSvgChart (integration) ─────────────────────────────

describe("generateSvgChart", () => {
  const analyses = [
    makeAnalysis("a1", "2026-01-01T00:00:00.000Z"),
    makeAnalysis("a2", "2026-02-01T00:00:00.000Z"),
  ];

  it("returns an empty string when no series has a positive value", () => {
    const svg = generateSvgChart(analyses, {
      width: 500,
      height: 250,
      yFloorMin: 173,
      yFloorMax: 182,
      tickStep: 5,
      normalRange: { min: 175, max: 180, fill: "#D9F2E5", stroke: "#059669", opacity: 0.7 },
      series: [
        { color: "#059669", values: [0, 0] },
        { color: "#0891B2", values: [0, 0] },
      ],
      legend: [],
    });
    expect(svg).toBe("");
  });

  it("renders a complete SVG with grid, series and legend", () => {
    const svg = generateSvgChart(analyses, {
      width: 500,
      height: 250,
      yFloorMin: 173,
      yFloorMax: 182,
      tickStep: 5,
      normalRange: {
        min: 175,
        max: 180,
        fill: "#D9F2E5",
        stroke: "#059669",
        opacity: 0.7,
        label: "Plage de référence",
      },
      series: [
        { color: "#059669", values: [176.2, 177.5] },
        { color: "#0891B2", values: [175.0, 176.0] },
      ],
      legend: [
        { xOffset: 0, color: "#059669", label: "HKA Gauche" },
        { xOffset: 90, color: "#0891B2", label: "HKA Droite" },
      ],
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("HKA Gauche");
    expect(svg).toContain("HKA Droite");
    expect(svg).toContain("Plage de référence");
  });
});
