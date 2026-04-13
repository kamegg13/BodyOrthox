import { Analysis } from "../../capture/domain/analysis";
import { hkaLabel } from "../../capture/data/angle-calculator";
import { Patient } from "../../patients/domain/patient";
import { LEGAL_CONSTANTS } from "../../../core/legal/legal-constants";

// ─── Types ────────────────────────────────────────────────────

export interface ProgressionReportData {
  readonly patientName: string;
  readonly analyses: ReadonlyArray<Analysis>;
  readonly disclaimer: string;
}

// ─── HTML escaping ────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Color helpers ────────────────────────────────────────────

function angleColor(value: number, min: number, max: number): string {
  if (value === 0) return "#888";
  if (value >= min && value <= max) return "#34C759";
  const dev = value < min ? min - value : value - max;
  return dev <= 5 ? "#FF9500" : "#FF3B30";
}

function fmt(v: number): string {
  return v === 0 ? "—" : `${v.toFixed(1)}°`;
}

// ─── Build report data ────────────────────────────────────────

export function buildProgressionReportData(
  patient: Patient,
  analyses: Analysis[],
): ProgressionReportData {
  const sorted = [...analyses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return {
    patientName: patient.name,
    analyses: sorted,
    disclaimer: LEGAL_CONSTANTS.mdrDisclaimer,
  };
}

// ─── File naming ──────────────────────────────────────────────

export function generateProgressionReportFileName(patientName: string): string {
  const sanitized = patientName.replace(/\s+/g, "");
  const dateStr = new Date().toISOString().slice(0, 10);
  return `${sanitized}_ProgressionHKA_${dateStr}.pdf`;
}

// ─── SVG chart helpers ─────────────────────────────────────────

const PAD_LEFT = 50;
const PAD_RIGHT = 20;
const PAD_TOP = 20;
const PAD_BOTTOM = 50;

interface ChartConfig {
  readonly width: number;
  readonly height: number;
  readonly yMin: number;
  readonly yMax: number;
}

function projectY(val: number, cfg: ChartConfig): number {
  const chartH = cfg.height - PAD_TOP - PAD_BOTTOM;
  return PAD_TOP + chartH - ((val - cfg.yMin) / (cfg.yMax - cfg.yMin)) * chartH;
}

function projectX(index: number, total: number, cfg: ChartConfig): number {
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

function buildGridAndAxes(cfg: ChartConfig, tickStep: number): string {
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
      `<text x="${PAD_LEFT - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#6b7280">${v}°</text>`,
    );
  }

  // Y axis
  lines.push(
    `<line x1="${PAD_LEFT}" y1="${PAD_TOP}" x2="${PAD_LEFT}" y2="${PAD_TOP + chartH}" stroke="#374151" stroke-width="1.5"/>`,
  );
  // X axis
  lines.push(
    `<line x1="${PAD_LEFT}" y1="${PAD_TOP + chartH}" x2="${PAD_LEFT + chartW}" y2="${PAD_TOP + chartH}" stroke="#374151" stroke-width="1.5"/>`,
  );

  return lines.join("\n  ");
}

/**
 * Build polyline + circles for a series of values.
 * Only renders points where value > 0 to avoid off-chart spikes.
 * Does NOT emit X-axis date labels — call buildDateLabels once per chart.
 */
function buildPolyline(
  values: number[],
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
function buildDateLabels(
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
        ? `<text x="${cx.toFixed(1)}" y="${cy}" font-size="8" fill="#6b7280" transform="rotate(-45,${cx.toFixed(1)},${cy})" text-anchor="end">${label}</text>`
        : `<text x="${cx.toFixed(1)}" y="${cy}" font-size="8" fill="#6b7280" text-anchor="middle">${label}</text>`;
    })
    .join("\n  ");
}

// ─── HKA SVG chart ─────────────────────────────────────────────

export function generateHkaSvgChart(
  analyses: ReadonlyArray<Analysis>,
  width = 500,
  height = 250,
): string {
  if (analyses.length < 2) return "";

  const leftValues = analyses.map(
    (a) => a.bilateralAngles?.leftHKA ?? a.angles.kneeAngle,
  );
  const rightValues = analyses.map(
    (a) => a.bilateralAngles?.rightHKA ?? a.angles.kneeAngle,
  );

  const allHka = [...leftValues, ...rightValues].filter((v) => v > 0);
  if (allHka.length === 0) return "";

  const rawMin = Math.min(...allHka, 173);
  const rawMax = Math.max(...allHka, 182);
  const yMin = Math.floor((rawMin - 2) / 5) * 5;
  const yMax = Math.ceil((rawMax + 2) / 5) * 5;

  const cfg: ChartConfig = { width, height, yMin, yMax };
  const chartW = width - PAD_LEFT - PAD_RIGHT;

  const normalRectY = projectY(180, cfg).toFixed(1);
  const normalRectH = (projectY(175, cfg) - projectY(180, cfg)).toFixed(1);

  const gridAndAxes = buildGridAndAxes(cfg, 5);

  const normalRect = `<rect x="${PAD_LEFT}" y="${normalRectY}" width="${chartW}" height="${normalRectH}" fill="#d1fae5" stroke="#34d399" stroke-width="0.5" opacity="0.7"/>
  <text x="${PAD_LEFT + chartW - 4}" y="${(Number(normalRectY) + 10).toFixed(1)}" text-anchor="end" font-size="8" fill="#059669" opacity="0.8">Zone normale</text>`;

  const leftPolyline = buildPolyline(leftValues, cfg, "#2563eb");
  const rightPolyline = buildPolyline(rightValues, cfg, "#d97706");
  const dateLabels = buildDateLabels(analyses, cfg);

  const legendY = height - 8;
  const legend = `<rect x="${PAD_LEFT}" y="${legendY - 6}" width="10" height="10" fill="#2563eb" rx="2"/>
  <text x="${PAD_LEFT + 14}" y="${legendY + 2}" font-size="9" fill="#374151">HKA Gauche</text>
  <rect x="${PAD_LEFT + 90}" y="${legendY - 6}" width="10" height="10" fill="#d97706" rx="2"/>
  <text x="${PAD_LEFT + 104}" y="${legendY + 2}" font-size="9" fill="#374151">HKA Droite</text>
  <rect x="${PAD_LEFT + 180}" y="${legendY - 6}" width="10" height="10" fill="#d1fae5" stroke="#34d399" stroke-width="0.8" rx="2"/>
  <text x="${PAD_LEFT + 194}" y="${legendY + 2}" font-size="9" fill="#374151">Zone normale (175–180°)</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${normalRect}
  ${gridAndAxes}
  ${leftPolyline}
  ${rightPolyline}
  ${dateLabels}
  ${legend}
</svg>`;
}

// ─── Knee SVG chart (bilateral joint angles) ───────────────────

function generateKneeSvgChart(
  analyses: ReadonlyArray<Analysis>,
  width = 500,
  height = 200,
): string {
  const withBilateral = analyses.filter((a) => a.bilateralAngles != null);
  if (withBilateral.length < 2) return "";

  const leftKneeValues = withBilateral.map(
    (a) => a.bilateralAngles!.left.kneeAngle,
  );
  const rightKneeValues = withBilateral.map(
    (a) => a.bilateralAngles!.right.kneeAngle,
  );

  const allVals = [...leftKneeValues, ...rightKneeValues].filter((v) => v > 0);
  if (allVals.length === 0) return "";

  const rawMin = Math.min(...allVals, 168);
  const rawMax = Math.max(...allVals, 182);
  const yMin = Math.floor((rawMin - 2) / 5) * 5;
  const yMax = Math.ceil((rawMax + 2) / 5) * 5;

  const cfg: ChartConfig = { width, height, yMin, yMax };
  const chartW = width - PAD_LEFT - PAD_RIGHT;

  const normalRectY = projectY(180, cfg).toFixed(1);
  const normalRectH = (projectY(170, cfg) - projectY(180, cfg)).toFixed(1);

  const gridAndAxes = buildGridAndAxes(cfg, 5);

  const normalRect = `<rect x="${PAD_LEFT}" y="${normalRectY}" width="${chartW}" height="${normalRectH}" fill="#ede9fe" stroke="#8b5cf6" stroke-width="0.5" opacity="0.6"/>`;

  const leftPolyline = buildPolyline(leftKneeValues, cfg, "#7c3aed");
  const rightPolyline = buildPolyline(rightKneeValues, cfg, "#db2777");
  const dateLabels = buildDateLabels(withBilateral, cfg);

  const legendY = height - 8;
  const legend = `<rect x="${PAD_LEFT}" y="${legendY - 6}" width="10" height="10" fill="#7c3aed" rx="2"/>
  <text x="${PAD_LEFT + 14}" y="${legendY + 2}" font-size="9" fill="#374151">Genou Gauche</text>
  <rect x="${PAD_LEFT + 100}" y="${legendY - 6}" width="10" height="10" fill="#db2777" rx="2"/>
  <text x="${PAD_LEFT + 114}" y="${legendY + 2}" font-size="9" fill="#374151">Genou Droite</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${normalRect}
  ${gridAndAxes}
  ${leftPolyline}
  ${rightPolyline}
  ${dateLabels}
  ${legend}
</svg>`;
}

// ─── Trend & synthesis section ─────────────────────────────────

function distanceFromNormal(v: number): number {
  if (v < 175) return 175 - v;
  if (v > 180) return v - 180;
  return 0;
}

function generateTrendText(first: number, last: number): string {
  const delta = last - first;
  const abs = Math.abs(delta);
  const sign = delta > 0 ? "+" : "";

  if (abs < 0.5) {
    return `Stable (variation de ${sign}${delta.toFixed(1)}°)`;
  }

  const distFirst = distanceFromNormal(first);
  const distLast = distanceFromNormal(last);

  let appreciation: string;
  if (distLast < distFirst) {
    appreciation = "Amélioration";
  } else if (distLast > distFirst) {
    appreciation = "Dégradation";
  } else {
    appreciation = delta > 0 ? "Augmentation" : "Diminution";
  }

  const arrow = appreciation === "Amélioration" ? "↗" : appreciation === "Dégradation" ? "↘" : "→";

  return `${appreciation} ${arrow} de ${abs.toFixed(1)}° (${first.toFixed(1)}° → ${last.toFixed(1)}°)`;
}

function buildSynthesisSection(analyses: ReadonlyArray<Analysis>): string {
  if (analyses.length < 2) return "";

  const first = analyses[0];
  const last = analyses[analyses.length - 1];

  const firstLeft = first.bilateralAngles?.leftHKA ?? 0;
  const firstRight = first.bilateralAngles?.rightHKA ?? 0;
  const lastLeft = last.bilateralAngles?.leftHKA ?? 0;
  const lastRight = last.bilateralAngles?.rightHKA ?? 0;

  const hasLeft = firstLeft !== 0 && lastLeft !== 0;
  const hasRight = firstRight !== 0 && lastRight !== 0;

  if (!hasLeft && !hasRight) return "";

  const rows: string[] = [];

  if (hasLeft) {
    const trend = generateTrendText(firstLeft, lastLeft);
    const deltaVal = lastLeft - firstLeft;
    const sign = deltaVal >= 0 ? "+" : "";
    const trendColor =
      trend.startsWith("Amélioration") ? "#059669" :
      trend.startsWith("Dégradation") ? "#dc2626" : "#374151";
    rows.push(`<tr>
        <td><strong>HKA Gauche</strong></td>
        <td>${fmt(firstLeft)}</td>
        <td>${fmt(lastLeft)}</td>
        <td style="color:${trendColor};font-weight:600">${sign}${deltaVal.toFixed(1)}°</td>
        <td style="color:${trendColor};font-weight:600">${escapeHtml(trend)}</td>
      </tr>`);
  }

  if (hasRight) {
    const trend = generateTrendText(firstRight, lastRight);
    const deltaVal = lastRight - firstRight;
    const sign = deltaVal >= 0 ? "+" : "";
    const trendColor =
      trend.startsWith("Amélioration") ? "#059669" :
      trend.startsWith("Dégradation") ? "#dc2626" : "#374151";
    rows.push(`<tr>
        <td><strong>HKA Droite</strong></td>
        <td>${fmt(firstRight)}</td>
        <td>${fmt(lastRight)}</td>
        <td style="color:${trendColor};font-weight:600">${sign}${deltaVal.toFixed(1)}°</td>
        <td style="color:${trendColor};font-weight:600">${escapeHtml(trend)}</td>
      </tr>`);
  }

  const firstDateStr = escapeHtml(first.createdAt.slice(0, 10));
  const lastDateStr = escapeHtml(last.createdAt.slice(0, 10));

  return `<div class="section">
    <h2>Synthèse de Progression</h2>
    <table>
      <thead>
        <tr>
          <th>Mesure</th>
          <th>Séance 1 (${firstDateStr})</th>
          <th>Séance ${analyses.length} (${lastDateStr})</th>
          <th>Delta</th>
          <th>Tendance</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join("\n        ")}
      </tbody>
    </table>
  </div>`;
}

// ─── Chronological tables ──────────────────────────────────────

function buildHkaTable(analyses: ReadonlyArray<Analysis>): string {
  const rows = analyses.map((a) => {
    const b = a.bilateralAngles;
    const leftHKA = b?.leftHKA ?? 0;
    const rightHKA = b?.rightHKA ?? 0;
    const leftClassif = leftHKA !== 0 ? escapeHtml(hkaLabel(leftHKA)) : "—";
    const rightClassif = rightHKA !== 0 ? escapeHtml(hkaLabel(rightHKA)) : "—";

    return `<tr>
      <td>${escapeHtml(a.createdAt.slice(0, 10))}</td>
      <td style="color:${angleColor(leftHKA, 175, 180)};font-weight:600">${fmt(leftHKA)}</td>
      <td>${leftClassif}</td>
      <td style="color:${angleColor(rightHKA, 175, 180)};font-weight:600">${fmt(rightHKA)}</td>
      <td>${rightClassif}</td>
    </tr>`;
  });

  return `<table>
      <thead>
        <tr>
          <th>Date</th>
          <th>HKA G</th>
          <th>Classif. G</th>
          <th>HKA D</th>
          <th>Classif. D</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join("\n        ")}
      </tbody>
    </table>`;
}

function buildBilateralTable(analyses: ReadonlyArray<Analysis>): string {
  const withBilateral = analyses.filter((a) => a.bilateralAngles != null);
  if (withBilateral.length === 0) return "";

  const rows = withBilateral.map((a) => {
    const b = a.bilateralAngles!;
    return `<tr>
      <td>${escapeHtml(a.createdAt.slice(0, 10))}</td>
      <td style="color:${angleColor(b.left.kneeAngle, 170, 180)}">${fmt(b.left.kneeAngle)}</td>
      <td style="color:${angleColor(b.right.kneeAngle, 170, 180)}">${fmt(b.right.kneeAngle)}</td>
      <td style="color:${angleColor(b.left.hipAngle, 170, 180)}">${fmt(b.left.hipAngle)}</td>
      <td style="color:${angleColor(b.right.hipAngle, 170, 180)}">${fmt(b.right.hipAngle)}</td>
      <td style="color:${angleColor(b.left.ankleAngle, 170, 180)}">${fmt(b.left.ankleAngle)}</td>
      <td style="color:${angleColor(b.right.ankleAngle, 170, 180)}">${fmt(b.right.ankleAngle)}</td>
    </tr>`;
  });

  return `<h3 class="sub-table-title">Angles articulaires bilatéraux</h3>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Genou G</th>
          <th>Genou D</th>
          <th>Hanche G</th>
          <th>Hanche D</th>
          <th>Cheville G</th>
          <th>Cheville D</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join("\n        ")}
      </tbody>
    </table>`;
}

function buildChronologicalTable(analyses: ReadonlyArray<Analysis>): string {
  const hkaTable = buildHkaTable(analyses);
  const bilateralTable = buildBilateralTable(analyses);

  return `<div class="section">
    <h2>Tableau chronologique des analyses</h2>
    ${hkaTable}
    ${bilateralTable}
  </div>`;
}

// ─── HTML generation ──────────────────────────────────────────

export function generateProgressionReportHtml(
  data: ProgressionReportData,
): string {
  const sessionCount = data.analyses.length;
  const firstDate =
    sessionCount > 0 ? data.analyses[0].createdAt.slice(0, 10) : "—";
  const lastDate =
    sessionCount > 0
      ? data.analyses[sessionCount - 1].createdAt.slice(0, 10)
      : "—";

  const hkaSvg = generateHkaSvgChart(data.analyses);
  const kneeSvg = generateKneeSvgChart(data.analyses);
  const synthesisSection = buildSynthesisSection(data.analyses);
  const chronologicalTable = buildChronologicalTable(data.analyses);
  const generatedDate = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const hkaChartSection =
    hkaSvg.length > 0
      ? `<div class="section">
    <h2>Évolution de l'Angle HKA</h2>
    <div class="chart-container">${hkaSvg}</div>
  </div>`
      : "";

  const kneeChartSection =
    kneeSvg.length > 0
      ? `<div class="section">
    <h2>Évolution des Angles Articulaires</h2>
    <div class="chart-container">${kneeSvg}</div>
  </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Rapport de Progression Clinique — ${escapeHtml(data.patientName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #222; background: #fff; padding: 24px; }
    .header { text-align: center; margin-bottom: 28px; border-bottom: 2px solid #1B6FBF; padding-bottom: 16px; }
    .header h1 { font-size: 20px; color: #1B6FBF; font-weight: 700; }
    .header .subtitle { font-size: 13px; color: #666; margin-top: 4px; }
    .meta { display: flex; gap: 24px; flex-wrap: wrap; background: #F2F2F7; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; }
    .meta-item .label { color: #888; margin-right: 4px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 13px; color: #1B6FBF; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    .sub-table-title { font-size: 12px; color: #555; margin-top: 16px; margin-bottom: 8px; font-weight: 600; }
    .chart-container { width: 100%; overflow-x: auto; margin-bottom: 8px; }
    .chart-container svg { max-width: 100%; height: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
    th, td { padding: 7px 10px; text-align: left; border-bottom: 1px solid #eee; white-space: nowrap; }
    th { background: #F2F2F7; font-weight: 600; color: #444; font-size: 11px; text-transform: uppercase; }
    td:first-child { font-weight: 500; }
    .page-break { page-break-before: always; }
    .disclaimer { font-size: 10px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 12px; margin-top: 28px; line-height: 1.5; }
    .generated-date { font-size: 10px; color: #aaa; text-align: right; margin-top: 8px; }
    @media print {
      body { padding: 12mm 15mm; }
      svg { page-break-inside: avoid; max-width: 100%; }
      .page-break { page-break-before: always; }
      table { page-break-inside: avoid; }
      .no-print { display: none; }
      .chart-container { overflow-x: visible; }
    }
  </style>
</head>
<body>

  <!-- PAGE 1 : Graphes + Synthèse -->
  <div class="header">
    <h1>Rapport de Progression Clinique — ${escapeHtml(data.patientName)}</h1>
    <div class="subtitle">Antidote Sport — Suivi HKA sur ${sessionCount} séance${sessionCount > 1 ? "s" : ""}</div>
  </div>

  <div class="meta">
    <div class="meta-item"><span class="label">Patient :</span><strong>${escapeHtml(data.patientName)}</strong></div>
    <div class="meta-item"><span class="label">Nombre de séances :</span>${sessionCount}</div>
    <div class="meta-item"><span class="label">Période :</span>${escapeHtml(firstDate)} → ${escapeHtml(lastDate)}</div>
  </div>

  ${hkaChartSection}
  ${kneeChartSection}
  ${synthesisSection}

  <!-- PAGE 2 : Tableau chronologique + Disclaimer -->
  <div class="page-break"></div>

  <div class="header">
    <h1>Tableau Chronologique — ${escapeHtml(data.patientName)}</h1>
    <div class="subtitle">Antidote Sport — Données complètes par séance</div>
  </div>

  ${chronologicalTable}

  <div class="disclaimer">${escapeHtml(data.disclaimer)}</div>
  <div class="generated-date">Généré le ${generatedDate}</div>

</body>
</html>`;
}
