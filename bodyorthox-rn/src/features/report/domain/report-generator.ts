import { Analysis } from "../../capture/domain/analysis";
import {
  BilateralAngles,
  classifyHKA,
  hkaLabel,
} from "../../capture/data/angle-calculator";
import { Patient } from "../../patients/domain/patient";
import { LEGAL_CONSTANTS } from "../../../core/legal/legal-constants";

// ─── HTML escaping ────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Types ────────────────────────────────────────────────────

export interface ReportData {
  readonly patientName: string;
  readonly analysisDate: string;
  readonly photoBase64?: string;
  readonly bilateral?: BilateralAngles;
  readonly notes?: string;
  readonly disclaimer: string;
}

export interface ReportOptions {
  photoBase64?: string;
  notes?: string;
}

// ─── File naming ──────────────────────────────────────────────

export function generateReportFileName(
  patientName: string,
  date: string,
): string {
  const sanitized = patientName.replace(/\s+/g, "");
  const dateStr = date.slice(0, 10);
  return `${sanitized}_AnalyseHKA_${dateStr}.pdf`;
}

// ─── Build report data ────────────────────────────────────────

export function buildReportData(
  analysis: Analysis,
  patient: Patient,
  options: ReportOptions = {},
): ReportData {
  return {
    patientName: patient.name,
    analysisDate: analysis.createdAt,
    photoBase64: options.photoBase64,
    bilateral: analysis.bilateralAngles,
    notes: options.notes?.trim() || undefined,
    disclaimer: LEGAL_CONSTANTS.mdrDisclaimer,
  };
}

// ─── Helpers ──────────────────────────────────────────────────

/** Print-safe color: in-range green, ≤5° off orange, >5° off red, zero grey */
function angleColor(value: number, min: number, max: number): string {
  if (value === 0) return "#888888";
  if (value >= min && value <= max) return "#1a7f37";
  const dev = value < min ? min - value : value - max;
  return dev <= 5 ? "#b45309" : "#c0392b";
}

function fmt(v: number): string {
  return v === 0 ? "—" : `${v.toFixed(1)}°`;
}

// ─── Clinical interpretation ──────────────────────────────────

export function generateInterpretation(bilateral?: BilateralAngles): string {
  if (!bilateral) {
    return "Aucune donnée angulaire disponible pour l'interprétation.";
  }

  const { leftHKA, rightHKA } = bilateral;
  const leftClass = classifyHKA(leftHKA);
  const rightClass = classifyHKA(rightHKA);

  const lines: string[] = [];

  // Per-side description
  if (leftClass === "unavailable" && rightClass === "unavailable") {
    return "Les angles HKA n'ont pas pu être calculés pour les deux membres inférieurs.";
  }

  if (leftClass !== "unavailable") {
    if (leftClass === "normal") {
      lines.push(
        `Côté gauche\u00a0: alignement mécanique dans les limites physiologiques (HKA\u00a0= ${leftHKA.toFixed(1)}°).`,
      );
    } else {
      const label = hkaLabel(leftHKA);
      const norm = leftHKA < 175 ? 175 : 180;
      const deviation = Math.abs(leftHKA - norm).toFixed(1);
      const direction = leftHKA < 175 ? "inférieure" : "supérieure";
      lines.push(
        `Côté gauche\u00a0: ${label} (HKA\u00a0= ${leftHKA.toFixed(1)}°, déviation de ${deviation}° par rapport à la limite ${direction} de la norme de ${norm}°).`,
      );
    }
  } else {
    lines.push("Côté gauche\u00a0: donnée non disponible.");
  }

  if (rightClass !== "unavailable") {
    if (rightClass === "normal") {
      lines.push(
        `Côté droit\u00a0: alignement mécanique dans les limites physiologiques (HKA\u00a0= ${rightHKA.toFixed(1)}°).`,
      );
    } else {
      const label = hkaLabel(rightHKA);
      const norm = rightHKA < 175 ? 175 : 180;
      const deviation = Math.abs(rightHKA - norm).toFixed(1);
      const direction = rightHKA < 175 ? "inférieure" : "supérieure";
      lines.push(
        `Côté droit\u00a0: ${label} (HKA\u00a0= ${rightHKA.toFixed(1)}°, déviation de ${deviation}° par rapport à la limite ${direction} de la norme de ${norm}°).`,
      );
    }
  } else {
    lines.push("Côté droit\u00a0: donnée non disponible.");
  }

  // Global conclusion
  const bothNormal = leftClass === "normal" && rightClass === "normal";
  const bothAbnormal =
    leftClass !== "normal" &&
    leftClass !== "unavailable" &&
    rightClass !== "normal" &&
    rightClass !== "unavailable";
  const leftAbnormal =
    leftClass !== "normal" && leftClass !== "unavailable" && rightClass === "normal";
  const rightAbnormal =
    rightClass !== "normal" && rightClass !== "unavailable" && leftClass === "normal";

  if (bothNormal) {
    lines.push(
      "Conclusion\u00a0: L'analyse ne révèle pas d'anomalie significative de l'axe mécanique des membres inférieurs.",
    );
  } else if (bothAbnormal) {
    const leftLabel = hkaLabel(leftHKA);
    const rightLabel = hkaLabel(rightHKA);
    lines.push(
      `Conclusion\u00a0: Des déviations bilatérales sont identifiées — ${leftLabel} à gauche, ${rightLabel} à droite. Une évaluation clinique approfondie est recommandée.`,
    );
  } else if (leftAbnormal) {
    const label = hkaLabel(leftHKA);
    lines.push(
      `Conclusion\u00a0: Une déviation en ${label.toLowerCase()} est observée du côté gauche. Le côté droit présente un alignement normal.`,
    );
  } else if (rightAbnormal) {
    const label = hkaLabel(rightHKA);
    lines.push(
      `Conclusion\u00a0: Une déviation en ${label.toLowerCase()} est observée du côté droit. Le côté gauche présente un alignement normal.`,
    );
  } else {
    lines.push(
      "Conclusion\u00a0: Données partielles — une évaluation complémentaire peut être nécessaire.",
    );
  }

  return lines.join(" ");
}

// ─── HTML generation ──────────────────────────────────────────

export function generateReportHtml(data: ReportData): string {
  const reportDate = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const analysisDateFmt = data.analysisDate.slice(0, 10);

  // ── Photo section ──
  const photoSection = data.photoBase64
    ? `<div class="photo-section">
        <img src="${data.photoBase64}" alt="Analyse HKA" class="analysis-photo" />
      </div>`
    : "";

  // ── Measurements table ──
  const bilateralSection = (() => {
    if (!data.bilateral) return "";
    const b = data.bilateral;

    const row = (
      label: string,
      left: number,
      right: number,
      min: number,
      max: number,
      isAlt: boolean,
    ): string => {
      const leftColor = angleColor(left, min, max);
      const rightColor = angleColor(right, min, max);
      const rowClass = isAlt ? ` class="row-alt"` : "";
      return `<tr${rowClass}>
        <td class="col-measure">${label}</td>
        <td class="col-value" style="color:${leftColor}">${fmt(left)}</td>
        <td class="col-norm">${min}–${max}°</td>
        <td class="col-value" style="color:${rightColor}">${fmt(right)}</td>
      </tr>`;
    };

    const hkaLeftColor = angleColor(b.leftHKA, 175, 180);
    const hkaRightColor = angleColor(b.rightHKA, 175, 180);
    const leftClassLabel = b.leftHKA === 0 ? "—" : escapeHtml(hkaLabel(b.leftHKA));
    const rightClassLabel = b.rightHKA === 0 ? "—" : escapeHtml(hkaLabel(b.rightHKA));

    return `<div class="section" style="page-break-inside:avoid">
      <h2 class="section-title">Mesures articulaires</h2>
      <table>
        <thead>
          <tr>
            <th class="col-measure">Mesure</th>
            <th class="col-value">Gauche</th>
            <th class="col-norm">Norme</th>
            <th class="col-value">Droite</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="col-measure"><strong>HKA (axe méc.)</strong></td>
            <td class="col-value" style="color:${hkaLeftColor};font-weight:600">${fmt(b.leftHKA)}</td>
            <td class="col-norm">175–180°</td>
            <td class="col-value" style="color:${hkaRightColor};font-weight:600">${fmt(b.rightHKA)}</td>
          </tr>
          <tr class="row-alt">
            <td class="col-measure">Classification HKA</td>
            <td class="col-value" style="color:${hkaLeftColor}">${leftClassLabel}</td>
            <td class="col-norm">—</td>
            <td class="col-value" style="color:${hkaRightColor}">${rightClassLabel}</td>
          </tr>
          ${row("Genou", b.left.kneeAngle, b.right.kneeAngle, 170, 180, false)}
          ${row("Hanche", b.left.hipAngle, b.right.hipAngle, 170, 180, true)}
          ${row("Cheville", b.left.ankleAngle, b.right.ankleAngle, 170, 180, false)}
        </tbody>
      </table>
    </div>`;
  })();

  // ── Clinical interpretation ──
  const interpretation = generateInterpretation(data.bilateral);
  const interpretationSection = `<div class="section" style="page-break-inside:avoid">
    <h2 class="section-title">Interprétation clinique</h2>
    <p class="interpretation-text">${escapeHtml(interpretation)}</p>
  </div>`;

  // ── Notes section ──
  const notesSection = data.notes
    ? `<div class="section" style="page-break-inside:avoid">
        <h2 class="section-title">Notes cliniques</h2>
        <p class="notes-text">${escapeHtml(data.notes)}</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Rapport HKA — ${escapeHtml(data.patientName)}</title>
  <style>
    /* ── Reset & base ── */
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11px;
      color: #1a1a1a;
      background: #fff;
      padding: 28px 32px 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    /* ── Header bar ── */
    .header-bar {
      background: #1A56B0;
      color: #fff;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .header-bar .clinic-name {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .header-bar .report-title {
      font-size: 11px;
      opacity: 0.85;
      margin-top: 2px;
    }
    .header-bar .report-date {
      font-size: 11px;
      opacity: 0.9;
      text-align: right;
      white-space: nowrap;
    }

    /* ── Patient info block ── */
    .patient-block {
      border: 1px solid #ddd;
      border-left: 4px solid #1A56B0;
      padding: 10px 14px;
      margin-bottom: 18px;
      display: flex;
      gap: 40px;
      align-items: flex-start;
    }
    .patient-block .info-group { display: flex; flex-direction: column; gap: 4px; }
    .patient-block .info-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .patient-block .info-value { font-size: 12px; font-weight: 600; color: #1a1a1a; }
    .patient-block .exam-type { font-size: 10px; color: #444; line-height: 1.4; }

    /* ── Photo ── */
    .photo-section {
      margin-bottom: 18px;
      text-align: center;
      page-break-inside: avoid;
    }
    .analysis-photo {
      max-width: 100%;
      max-height: 45vh;
      object-fit: contain;
      display: block;
      margin: 0 auto;
      border: 1px solid #ddd;
    }

    /* ── Sections ── */
    .section { margin-bottom: 18px; }
    .section-title {
      font-size: 10px;
      font-weight: 700;
      color: #1A56B0;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }

    /* ── Measurements table ── */
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead tr { background: #f0f2f5; }
    th {
      padding: 8px 10px;
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      color: #444;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border-bottom: 2px solid #ddd;
    }
    td {
      padding: 7px 10px;
      border-bottom: 1px solid #eee;
      vertical-align: middle;
    }
    tr:last-child td { border-bottom: none; }
    .row-alt { background: #f8f9fc; }
    .col-measure { font-weight: 500; width: 38%; }
    .col-value { font-weight: 500; width: 24%; }
    .col-norm { color: #999; font-size: 10px; width: 14%; }

    /* ── Interpretation ── */
    .interpretation-text {
      font-size: 11px;
      color: #1a1a1a;
      line-height: 1.65;
      background: #f8f9fc;
      border-left: 3px solid #1A56B0;
      padding: 10px 14px;
    }

    /* ── Notes ── */
    .notes-text {
      font-size: 11px;
      color: #333;
      line-height: 1.6;
      white-space: pre-wrap;
      background: #fffbf0;
      border-left: 3px solid #b45309;
      padding: 10px 14px;
    }

    /* ── Footer ── */
    .footer {
      border-top: 1px solid #ddd;
      padding-top: 10px;
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
    }
    .footer .disclaimer {
      font-size: 9px;
      color: #aaa;
      line-height: 1.5;
      flex: 1;
    }
    .footer .page-info {
      font-size: 9px;
      color: #bbb;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* ── Print optimisation ── */
    @media print {
      body { padding: 0; margin: 0; }
      @page { size: A4 portrait; margin: 15mm 15mm 12mm; }
      .analysis-photo { max-height: 40vh; }
      table { page-break-inside: avoid; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <!-- Header bar -->
  <div class="header-bar">
    <div>
      <div class="clinic-name">Antidote Sport</div>
      <div class="report-title">Analyse morphologique de l'axe mécanique — Membres inférieurs</div>
    </div>
    <div class="report-date">Généré le ${escapeHtml(reportDate)}</div>
  </div>

  <!-- Patient info -->
  <div class="patient-block">
    <div class="info-group">
      <span class="info-label">Nom du patient</span>
      <span class="info-value">${escapeHtml(data.patientName)}</span>
    </div>
    <div class="info-group">
      <span class="info-label">Date d'analyse</span>
      <span class="info-value">${escapeHtml(analysisDateFmt)}</span>
    </div>
    <div class="info-group">
      <span class="info-label">Type d'examen</span>
      <span class="exam-type">Analyse morphologique de l'axe mécanique<br>des membres inférieurs (HKA)</span>
    </div>
  </div>

  ${photoSection}
  ${bilateralSection}
  ${interpretationSection}
  ${notesSection}

  <!-- Footer -->
  <div class="footer">
    <div class="disclaimer">${escapeHtml(data.disclaimer)}</div>
    <div class="page-info">Page 1/1</div>
  </div>
</body>
</html>`;
}
