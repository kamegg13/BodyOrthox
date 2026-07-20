import { Analysis } from "../../capture/domain/analysis";
import { hkaLabel } from "../../capture/data/angle-calculator";
import { Patient, patientDisplayName } from "../../patients/domain/patient";
import { LEGAL_CONSTANTS } from "../../../core/legal/legal-constants";
import { escapeHtml, angleColor, fmt } from "./report-html-helpers";
import { generateSvgChart } from "./svg-chart-builder";

// ─── Types ────────────────────────────────────────────────────

export interface ProgressionReportData {
  readonly patientName: string;
  readonly analyses: ReadonlyArray<Analysis>;
  readonly disclaimer: string;
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
    patientName: patientDisplayName(patient),
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

  return generateSvgChart(analyses, {
    width,
    height,
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
      { color: "#059669", values: leftValues },
      { color: "#0891B2", values: rightValues },
    ],
    legend: [
      { xOffset: 0, color: "#059669", label: "HKA Gauche" },
      { xOffset: 90, color: "#0891B2", label: "HKA Droite" },
      {
        xOffset: 180,
        color: "#D9F2E5",
        strokeColor: "#059669",
        strokeWidth: 0.8,
        label: "Plage de référence (175–180°)",
      },
    ],
  });
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

  return generateSvgChart(withBilateral, {
    width,
    height,
    yFloorMin: 168,
    yFloorMax: 182,
    tickStep: 5,
    normalRange: {
      min: 170,
      max: 180,
      fill: "#D7F5FA",
      stroke: "#0891B2",
      opacity: 0.6,
    },
    series: [
      { color: "#059669", values: leftKneeValues },
      { color: "#0891B2", values: rightKneeValues },
    ],
    legend: [
      { xOffset: 0, color: "#059669", label: "Genou Gauche" },
      { xOffset: 100, color: "#0891B2", label: "Genou Droite" },
    ],
  });
}

// ─── Trend & synthesis section ─────────────────────────────────

/**
 * Neutral, factual variation between the first and last measurement.
 * Reports the signed delta and the first → last values, with a
 * directional arrow only. No clinical appreciation (no improvement /
 * worsening judgement).
 */
export function generateTrendText(first: number, last: number): string {
  const delta = last - first;
  const abs = Math.abs(delta);
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";

  if (abs < 0.5) {
    return `Stable (${sign}${abs.toFixed(1)}° ; ${first.toFixed(1)}° → ${last.toFixed(1)}°)`;
  }

  const arrow = delta > 0 ? "↗" : "↘";

  return `Variation ${arrow} ${sign}${abs.toFixed(1)}° (${first.toFixed(1)}° → ${last.toFixed(1)}°)`;
}

// ─── On-screen preview (real data, no fabricated values) ───────

export interface ProgressionPreviewRow {
  readonly date: string; // ISO date (YYYY-MM-DD), formatting is the screen's job
  /** null = mesure indisponible pour cette séance — jamais interpolée. */
  readonly leftHKA: number | null;
  readonly rightHKA: number | null;
  /** Delta vs la séance précédente sélectionnée ; null si l'une des deux mesures est indisponible ou s'il n'y a pas de séance précédente. */
  readonly leftDelta: number | null;
  readonly rightDelta: number | null;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Ligne par ligne = donnée réelle de chaque analyse sélectionnée, dans
 * l'ordre chronologique déjà appliqué par `buildProgressionReportData`.
 * Ne fabrique jamais de valeur : une mesure absente reste `null`.
 */
export function buildProgressionPreviewRows(
  analyses: ReadonlyArray<Analysis>,
): readonly ProgressionPreviewRow[] {
  let prevLeft: number | null = null;
  let prevRight: number | null = null;

  return analyses.map((a) => {
    const b = a.bilateralAngles;
    const leftHKA = b && b.leftHKA !== 0 ? round1(b.leftHKA) : null;
    const rightHKA = b && b.rightHKA !== 0 ? round1(b.rightHKA) : null;

    const leftDelta =
      leftHKA !== null && prevLeft !== null ? round1(leftHKA - prevLeft) : null;
    const rightDelta =
      rightHKA !== null && prevRight !== null ? round1(rightHKA - prevRight) : null;

    prevLeft = leftHKA;
    prevRight = rightHKA;

    return {
      date: a.createdAt.slice(0, 10),
      leftHKA,
      rightHKA,
      leftDelta,
      rightDelta,
    };
  });
}

export interface ProgressionSynthesisSummary {
  readonly available: boolean;
  readonly firstDate?: string;
  readonly lastDate?: string;
  readonly leftTrendText?: string;
  readonly rightTrendText?: string;
}

interface SynthesisSide {
  readonly first: number;
  readonly last: number;
  readonly trendText: string;
}

interface SynthesisComputation {
  readonly available: boolean;
  readonly firstDate?: string;
  readonly lastDate?: string;
  readonly sessionCount: number;
  readonly left?: SynthesisSide;
  readonly right?: SynthesisSide;
}

/**
 * Seul point de calcul de la synthèse d'évolution (première → dernière
 * analyse sélectionnée) : `buildProgressionSynthesisSummary` (aperçu écran)
 * et `buildSynthesisSection` (PDF exporté) consomment tous deux cette même
 * fonction, pour que l'aperçu et l'export ne puissent jamais diverger.
 * `available: false` quand il n'y a pas assez de données pour comparer
 * (moins de 2 séances, ou aucune mesure HKA exploitable).
 */
function computeSynthesis(
  analyses: ReadonlyArray<Analysis>,
): SynthesisComputation {
  const sessionCount = analyses.length;
  if (sessionCount < 2) return { available: false, sessionCount };

  const first = analyses[0];
  const last = analyses[sessionCount - 1];

  const firstLeft = first.bilateralAngles?.leftHKA ?? 0;
  const firstRight = first.bilateralAngles?.rightHKA ?? 0;
  const lastLeft = last.bilateralAngles?.leftHKA ?? 0;
  const lastRight = last.bilateralAngles?.rightHKA ?? 0;

  const hasLeft = firstLeft !== 0 && lastLeft !== 0;
  const hasRight = firstRight !== 0 && lastRight !== 0;

  if (!hasLeft && !hasRight) return { available: false, sessionCount };

  return {
    available: true,
    sessionCount,
    firstDate: first.createdAt.slice(0, 10),
    lastDate: last.createdAt.slice(0, 10),
    ...(hasLeft
      ? { left: { first: firstLeft, last: lastLeft, trendText: generateTrendText(firstLeft, lastLeft) } }
      : {}),
    ...(hasRight
      ? { right: { first: firstRight, last: lastRight, trendText: generateTrendText(firstRight, lastRight) } }
      : {}),
  };
}

export function buildProgressionSynthesisSummary(
  analyses: ReadonlyArray<Analysis>,
): ProgressionSynthesisSummary {
  const s = computeSynthesis(analyses);
  if (!s.available) return { available: false };

  return {
    available: true,
    firstDate: s.firstDate,
    lastDate: s.lastDate,
    ...(s.left ? { leftTrendText: s.left.trendText } : {}),
    ...(s.right ? { rightTrendText: s.right.trendText } : {}),
  };
}

function buildSynthesisRow(label: string, side: SynthesisSide): string {
  const deltaVal = side.last - side.first;
  const sign = deltaVal >= 0 ? "+" : "";
  const trendColor = "#164E63";
  return `<tr>
        <td><strong>${label}</strong></td>
        <td>${fmt(side.first)}</td>
        <td>${fmt(side.last)}</td>
        <td style="color:${trendColor};font-weight:600">${sign}${deltaVal.toFixed(1)}°</td>
        <td style="color:${trendColor};font-weight:600">${escapeHtml(side.trendText)}</td>
      </tr>`;
}

function buildSynthesisSection(analyses: ReadonlyArray<Analysis>): string {
  const s = computeSynthesis(analyses);
  if (!s.available) return "";

  const rows: string[] = [
    ...(s.left ? [buildSynthesisRow("HKA Gauche", s.left)] : []),
    ...(s.right ? [buildSynthesisRow("HKA Droite", s.right)] : []),
  ];

  const firstDateStr = escapeHtml(s.firstDate!);
  const lastDateStr = escapeHtml(s.lastDate!);

  return `<div class="section">
    <h2>Synthèse de Progression</h2>
    <table>
      <thead>
        <tr>
          <th>Mesure</th>
          <th>Séance 1 (${firstDateStr})</th>
          <th>Séance ${s.sessionCount} (${lastDateStr})</th>
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
          <th>Écart G</th>
          <th>HKA D</th>
          <th>Écart D</th>
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
  <title>Rapport de progression — ${escapeHtml(data.patientName)}</title>
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
    <h1>Rapport de progression — ${escapeHtml(data.patientName)}</h1>
    <div class="subtitle">Antidote Boost — Suivi HKA sur ${sessionCount} séance${sessionCount > 1 ? "s" : ""}</div>
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
    <div class="subtitle">Antidote Boost — Données complètes par séance</div>
  </div>

  ${chronologicalTable}

  <div class="disclaimer">${escapeHtml(data.disclaimer)}</div>
  <div class="generated-date">Généré le ${generatedDate}</div>

</body>
</html>`;
}
