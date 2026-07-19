/**
 * Primitives + assemblage paramétré pour les graphiques SVG d'évolution du
 * rapport de progression. Anciennement dupliqué entre `generateHkaSvgChart`
 * et `generateKneeSvgChart` (~90% de structure commune) : ce module isole
 * les primitives (projection, grille/axes, tracé, labels, légende, plage
 * normale) et `generateSvgChart` les assemble à partir d'une configuration
 * déclarative, pour que les deux graphiques restent un seul rendu.
 */
import { Analysis } from "../../capture/domain/analysis";

const PAD_LEFT = 50;
const PAD_RIGHT = 20;
const PAD_TOP = 20;
const PAD_BOTTOM = 50;

export interface ChartConfig {
  readonly width: number;
  readonly height: number;
  readonly yMin: number;
  readonly yMax: number;
}

export function projectY(val: number, cfg: ChartConfig): number {
  const chartH = cfg.height - PAD_TOP - PAD_BOTTOM;
  return PAD_TOP + chartH - ((val - cfg.yMin) / (cfg.yMax - cfg.yMin)) * chartH;
}

export function projectX(index: number, total: number, cfg: ChartConfig): number {
  const chartW = cfg.width - PAD_LEFT - PAD_RIGHT;
  if (total <= 1) return PAD_LEFT + chartW / 2;
  return PAD_LEFT + (index / (total - 1)) * chartW;
}

function formatDateShort(isoStr: string): string {
  const d = new Date(isoStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

export function buildGridAndAxes(cfg: ChartConfig, tickStep: number): string {
  const chartH = cfg.height - PAD_TOP - PAD_BOTTOM;
  const chartW = cfg.width - PAD_LEFT - PAD_RIGHT;
  const lines: string[] = [];

  // Horizontal grid lines
  for (let v = cfg.yMin; v <= cfg.yMax; v += tickStep) {
    const y = projectY(v, cfg);
    lines.push(
      `<line x1="${PAD_LEFT}" y1="${y.toFixed(1)}" x2="${PAD_LEFT + chartW}" y2="${y.toFixed(1)}" stroke="#e5e7eb" stroke-dasharray="4,3" stroke-width="0.8"/>`,
    );
    lines.push(
      `<text x="${PAD_LEFT - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#46707F">${v}°</text>`,
    );
  }

  // Y axis
  lines.push(
    `<line x1="${PAD_LEFT}" y1="${PAD_TOP}" x2="${PAD_LEFT}" y2="${PAD_TOP + chartH}" stroke="#164E63" stroke-width="1.5"/>`,
  );
  // X axis
  lines.push(
    `<line x1="${PAD_LEFT}" y1="${PAD_TOP + chartH}" x2="${PAD_LEFT + chartW}" y2="${PAD_TOP + chartH}" stroke="#164E63" stroke-width="1.5"/>`,
  );

  return lines.join("\n  ");
}

/**
 * Build polyline + circles for a series of values.
 * Only renders points where value > 0 to avoid off-chart spikes.
 * Does NOT emit X-axis date labels — call buildDateLabels once per chart.
 */
export function buildPolyline(
  values: readonly number[],
  cfg: ChartConfig,
  color: string,
): string {
  const total = values.length;
  const validEntries = values
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v > 0);

  if (validEntries.length === 0) return "";

  const points = validEntries
    .map(({ v, i }) => `${projectX(i, total, cfg).toFixed(1)},${projectY(v, cfg).toFixed(1)}`)
    .join(" ");

  const polyline =
    validEntries.length > 1
      ? `<polyline fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" points="${points}"/>`
      : "";

  const circles = validEntries
    .map(({ v, i }) => {
      const cx = projectX(i, total, cfg).toFixed(1);
      const cy = projectY(v, cfg).toFixed(1);
      const label = `${v.toFixed(1)}°`;
      return `<circle cx="${cx}" cy="${cy}" r="4" fill="${color}" stroke="white" stroke-width="1.5"/>
  <text x="${cx}" y="${(Number(cy) - 7).toFixed(1)}" text-anchor="middle" font-size="8" fill="${color}">${label}</text>`;
    })
    .join("\n  ");

  return `${polyline}\n  ${circles}`;
}

/**
 * Emit X-axis date labels once per chart — not per series.
 */
export function buildDateLabels(
  analyses: ReadonlyArray<Analysis>,
  cfg: ChartConfig,
): string {
  const n = analyses.length;
  const altLabels = n > 6;

  return analyses
    .map((a, i) => {
      if (altLabels && i % 2 !== 0) return "";
      const cx = projectX(i, n, cfg);
      const cy = cfg.height - PAD_BOTTOM + 14;
      const label = formatDateShort(a.createdAt);
      return altLabels
        ? `<text x="${cx.toFixed(1)}" y="${cy}" font-size="8" fill="#46707F" transform="rotate(-45,${cx.toFixed(1)},${cy})" text-anchor="end">${label}</text>`
        : `<text x="${cx.toFixed(1)}" y="${cy}" font-size="8" fill="#46707F" text-anchor="middle">${label}</text>`;
    })
    .join("\n  ");
}

// ─── Normal range rect ───────────────────────────────────────────

export interface NormalRangeSpec {
  readonly min: number;
  readonly max: number;
  readonly fill: string;
  readonly stroke: string;
  readonly opacity: number;
  /** Libellé optionnel affiché dans le coin haut-droit de la plage. */
  readonly label?: string;
}

export function buildNormalRangeRect(spec: NormalRangeSpec, cfg: ChartConfig): string {
  const chartW = cfg.width - PAD_LEFT - PAD_RIGHT;
  const y = projectY(spec.max, cfg).toFixed(1);
  const h = (projectY(spec.min, cfg) - projectY(spec.max, cfg)).toFixed(1);

  const rect = `<rect x="${PAD_LEFT}" y="${y}" width="${chartW}" height="${h}" fill="${spec.fill}" stroke="${spec.stroke}" stroke-width="0.5" opacity="${spec.opacity}"/>`;

  const label = spec.label
    ? `\n  <text x="${PAD_LEFT + chartW - 4}" y="${(Number(y) + 10).toFixed(1)}" text-anchor="end" font-size="8" fill="${spec.stroke}" opacity="0.8">${spec.label}</text>`
    : "";

  return `${rect}${label}`;
}

// ─── Legend ───────────────────────────────────────────────────────

export interface LegendItemSpec {
  readonly xOffset: number;
  readonly color: string;
  readonly label: string;
  readonly strokeColor?: string;
  readonly strokeWidth?: number;
}

export function buildLegend(items: readonly LegendItemSpec[], cfg: ChartConfig): string {
  const legendY = cfg.height - 8;

  return items
    .map((item) => {
      const strokeAttr = item.strokeColor
        ? ` stroke="${item.strokeColor}" stroke-width="${item.strokeWidth ?? 0.8}"`
        : "";
      return `<rect x="${PAD_LEFT + item.xOffset}" y="${legendY - 6}" width="10" height="10" fill="${item.color}" rx="2"${strokeAttr}/>
  <text x="${PAD_LEFT + item.xOffset + 14}" y="${legendY + 2}" font-size="9" fill="#164E63">${item.label}</text>`;
    })
    .join("\n  ");
}

// ─── Full chart assembly ────────────────────────────────────────

export interface SvgSeriesSpec {
  readonly color: string;
  readonly values: readonly number[];
}

export interface SvgChartSpec {
  readonly width: number;
  readonly height: number;
  /** Plancher/plafond appliqués aux valeurs réelles avant d'arrondir l'échelle Y. */
  readonly yFloorMin: number;
  readonly yFloorMax: number;
  readonly tickStep: number;
  readonly normalRange: NormalRangeSpec;
  readonly series: readonly [SvgSeriesSpec, SvgSeriesSpec];
  readonly legend: readonly LegendItemSpec[];
}

/**
 * Assemble un graphique SVG complet (plage normale, grille/axes, séries,
 * labels de dates, légende) à partir d'une configuration déclarative.
 * Retourne une chaîne vide si aucune série n'a de valeur exploitable
 * (> 0), pour ne jamais tracer un graphique vide ou fabriqué.
 */
export function generateSvgChart(
  analyses: ReadonlyArray<Analysis>,
  spec: SvgChartSpec,
): string {
  const allVals = spec.series.flatMap((s) => s.values).filter((v) => v > 0);
  if (allVals.length === 0) return "";

  const rawMin = Math.min(...allVals, spec.yFloorMin);
  const rawMax = Math.max(...allVals, spec.yFloorMax);
  const yMin = Math.floor((rawMin - 2) / 5) * 5;
  const yMax = Math.ceil((rawMax + 2) / 5) * 5;

  const cfg: ChartConfig = { width: spec.width, height: spec.height, yMin, yMax };

  const normalRect = buildNormalRangeRect(spec.normalRange, cfg);
  const gridAndAxes = buildGridAndAxes(cfg, spec.tickStep);
  const polylines = spec.series.map((s) => buildPolyline(s.values, cfg, s.color)).join("\n  ");
  const dateLabels = buildDateLabels(analyses, cfg);
  const legend = buildLegend(spec.legend, cfg);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cfg.width}" height="${cfg.height}" viewBox="0 0 ${cfg.width} ${cfg.height}">
  ${normalRect}
  ${gridAndAxes}
  ${polylines}
  ${dateLabels}
  ${legend}
</svg>`;
}
