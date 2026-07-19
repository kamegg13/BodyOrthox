import { Analysis } from "../../capture/domain/analysis";
import {
  BilateralAngles,
  PoseLandmarks,
  classifyHKA,
  hkaLabel,
} from "../../capture/data/angle-calculator";
import { generateSkeletonOverlayHtml } from "../../capture/data/skeleton-svg";
import { Patient, patientDisplayName } from "../../patients/domain/patient";
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
  /** Landmarks 33 points : squelette SVG superposé à la photo du PDF. */
  readonly allLandmarks?: PoseLandmarks;
  readonly bilateral?: BilateralAngles;
  readonly notes?: string;
  readonly disclaimer: string;
  /** Score de confiance ML [0,1] de la détection ayant produit l'analyse. */
  readonly confidenceScore?: number;
}

// Seuil de confiance ML basse, cf. LOW_CONFIDENCE_THRESHOLD dans
// src/features/capture/hooks/use-capture-logic.ts — reprise ici telle
// quelle, aucune valeur n'est inventée.
const LOW_CONFIDENCE_THRESHOLD = 0.6;

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
    patientName: patientDisplayName(patient),
    analysisDate: analysis.createdAt,
    photoBase64: options.photoBase64,
    allLandmarks: analysis.allLandmarks,
    bilateral: analysis.bilateralAngles,
    notes: options.notes?.trim() || undefined,
    disclaimer: LEGAL_CONSTANTS.mdrDisclaimer,
    confidenceScore: analysis.confidenceScore,
  };
}

// ─── Helpers ──────────────────────────────────────────────────

/** Print-safe color: in-range green, ≤5° off orange, >5° off red, unmeasured grey */
function angleColor(value: number, min: number, max: number): string {
  if (!Number.isFinite(value) || value === 0) return "#46707F";
  if (value >= min && value <= max) return "#059669";
  const dev = value < min ? min - value : value - max;
  return dev <= 5 ? "#b45309" : "#DC2626";
}

function fmt(v: number): string {
  return !Number.isFinite(v) || v === 0 ? "—" : `${v.toFixed(1)}°`;
}

// ─── Factual geometric statement ──────────────────────

const REFERENCE_RANGE = "175–180°";

/**
 * Build a purely factual, geometric statement for one HKA side:
 * reports the measured angle and its signed deviation from the
 * 175°–180° reference range. No clinical judgement.
 */
function describeHkaSide(side: string, hka: number): string {
  const klass = classifyHKA(hka);

  if (klass === "unavailable") {
    return `${side}\u00a0: donnée non disponible (angle non mesurable).`;
  }

  if (klass === "in_range") {
    return `${side}\u00a0: ${hka.toFixed(1)}° — dans la plage de référence (${REFERENCE_RANGE}).`;
  }

  const deviation = klass === "below" ? hka - 175 : hka - 180;
  const position =
    klass === "below"
      ? "sous la plage de référence"
      : "au-dessus de la plage de référence";
  const sign = deviation >= 0 ? "+" : "−";
  return `${side}\u00a0: ${hka.toFixed(1)}° — ${position} (${REFERENCE_RANGE}), écart ${sign}${Math.abs(deviation).toFixed(1)}°.`;
}

export function generateInterpretation(bilateral?: BilateralAngles): string {
  if (!bilateral) {
    return "Aucune donnée angulaire disponible.";
  }

  const { leftHKA, rightHKA } = bilateral;
  const leftClass = classifyHKA(leftHKA);
  const rightClass = classifyHKA(rightHKA);

  if (leftClass === "unavailable" && rightClass === "unavailable") {
    return "Les angles HKA n'ont pas pu être mesurés pour les deux membres inférieurs.";
  }

  const lines: string[] = [
    describeHkaSide("HKA gauche", leftHKA),
    describeHkaSide("HKA droit", rightHKA),
  ];

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
  // Squelette superposé en SVG : rendu par le moteur web du PDF sur toutes
  // les plateformes (l'incrustation canvas n'existe que sur web).
  const skeletonSvg =
    data.allLandmarks && data.bilateral
      ? generateSkeletonOverlayHtml(data.allLandmarks, data.bilateral)
      : "";
  const photoSection = data.photoBase64
    ? `<div class="photo-section">
        <div class="photo-wrap">
          <img src="${data.photoBase64}" alt="Analyse HKA" class="analysis-photo" />
          ${skeletonSvg}
        </div>
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
            <td class="col-measure">Écart à la plage de référence</td>
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

  // ── Low ML confidence notice ── discreet, factual, never fabricates a
  // "reliable" mention when the score is absent or above threshold.
  const confidenceNotice =
    data.confidenceScore !== undefined && data.confidenceScore < LOW_CONFIDENCE_THRESHOLD
      ? `<div class="confidence-notice" style="page-break-inside:avoid">
          <strong>Confiance faible</strong> — la confiance de détection lors de la
          capture était basse ; les points de repère ont été vérifiés avant validation
          par le praticien.
        </div>`
      : "";

  // ── Clinical interpretation ──
  const interpretation = generateInterpretation(data.bilateral);
  const interpretationSection = `<div class="section" style="page-break-inside:avoid">
    <h2 class="section-title">Lecture des mesures</h2>
    <p class="interpretation-text">${escapeHtml(interpretation)}</p>
  </div>`;

  // ── Notes section ──
  const notesSection = data.notes
    ? `<div class="section" style="page-break-inside:avoid">
        <h2 class="section-title">Notes du praticien</h2>
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
    /* Le wrapper épouse exactement la boîte de l'image : le SVG en
       coordonnées % reste aligné sur la photo quel que soit son ratio. */
    .photo-wrap {
      position: relative;
      display: inline-block;
    }
    /* JAMAIS d'unités vh ici : elles valent 0 dans le contexte de rendu
       print de WKWebView (react-native-html-to-pdf) et effondrent la photo. */
    .analysis-photo {
      max-width: 100%;
      max-height: 420px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
      border: 1px solid #ddd;
    }
    .skeleton-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      /* INDISPENSABLE : sans ce clip, un badge qui déborde de la boîte
         (ex. cheville près du bord bas) fait échouer la pagination print
         d'Android — « Error occurred generating the pdf ». */
      overflow: hidden;
    }
    /* Labels d'angles : HTML positionné (PAS de <text> SVG — le rendu
       print Android échoue dessus). Badge sombre, texte coloré par côté. */
    .skl-label {
      /* WKWebView (iOS) supprime les fonds à l'impression sans ceci. */
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      position: absolute;
      background: rgba(0, 0, 0, 0.72);
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 11px;
      font-weight: 700;
      font-family: -apple-system, Helvetica, sans-serif;
      white-space: nowrap;
      line-height: 1.5;
    }
    .skl-label-big {
      font-size: 14px;
      padding: 2px 7px;
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

    /* ── Low confidence notice ── */
    .confidence-notice {
      font-size: 10px;
      color: #7a4a00;
      line-height: 1.5;
      background: #fff8ec;
      border: 1px solid #f0c987;
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 18px;
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
      .analysis-photo { max-height: 130mm; }
      table { page-break-inside: avoid; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <!-- Header bar -->
  <div class="header-bar">
    <div>
      <div class="clinic-name">Antidote Boost</div>
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

  ${confidenceNotice}
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
