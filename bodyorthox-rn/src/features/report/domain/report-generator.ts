import { Platform } from "react-native";
import { Analysis, confidenceLabel } from "../../capture/domain/analysis";
import { Patient } from "../../patients/domain/patient";
import {
  assessAngle,
  REFERENCE_NORMS,
} from "../../results/domain/reference-norms";
import { LEGAL_CONSTANTS } from "../../../core/legal/legal-constants";

// ─── Types ────────────────────────────────────────────────────

export interface AngleReportEntry {
  readonly joint: string;
  readonly label: string;
  readonly value: number;
  readonly unit: string;
  readonly normalMin: number;
  readonly normalMax: number;
  readonly isWithinNorm: boolean;
  readonly deviationLevel: string;
}

export interface PractitionerView {
  readonly angles: readonly AngleReportEntry[];
}

export interface DetailedView {
  readonly confidenceScore: number;
  readonly confidencePercent: string;
  readonly confidenceLabel: string;
  readonly analysisId: string;
  readonly manualCorrectionApplied: boolean;
  readonly manualCorrectionJoint: string | null;
  readonly manualCorrectionDisclaimer: string | null;
}

export interface ReportMetadata {
  readonly patientName: string;
  readonly analysisDate: string;
  readonly device: string;
  readonly confidenceLevel: string;
}

export interface ReportData {
  readonly metadata: ReportMetadata;
  readonly practitionerView: PractitionerView;
  readonly detailedView: DetailedView;
  readonly disclaimer: string;
}

// ─── File naming ──────────────────────────────────────────────

export function generateReportFileName(
  patientName: string,
  date: string,
): string {
  const sanitized = patientName.replace(/\s+/g, "");
  const dateStr = date.slice(0, 10); // YYYY-MM-DD
  return `${sanitized}_AnalyseMarche_${dateStr}.pdf`;
}

// ─── Build report data ───────────────────────────────────────

function buildAngleEntry(
  joint: "knee" | "hip" | "ankle",
  value: number,
): AngleReportEntry {
  const norm = REFERENCE_NORMS[joint];
  const assessment = assessAngle(joint, value);
  return {
    joint,
    label: norm.label,
    value,
    unit: norm.unit,
    normalMin: norm.normalMin,
    normalMax: norm.normalMax,
    isWithinNorm: assessment.isWithinNorm,
    deviationLevel: assessment.level,
  };
}

function getDeviceInfo(): string {
  try {
    return `${Platform.OS} (${Platform.Version ?? "unknown"})`;
  } catch {
    return "unknown";
  }
}

export function buildReportData(
  analysis: Analysis,
  patient: Patient,
): ReportData {
  const angles: AngleReportEntry[] = [
    buildAngleEntry("knee", analysis.angles.kneeAngle),
    buildAngleEntry("hip", analysis.angles.hipAngle),
    buildAngleEntry("ankle", analysis.angles.ankleAngle),
  ];

  const manualCorrectionDisclaimer =
    analysis.manualCorrectionApplied && analysis.manualCorrectionJoint
      ? `Donnees ${REFERENCE_NORMS[analysis.manualCorrectionJoint].label} : estimees — verification manuelle effectuee.`
      : null;

  return {
    metadata: {
      patientName: patient.name,
      analysisDate: analysis.createdAt,
      device: getDeviceInfo(),
      confidenceLevel: confidenceLabel(analysis.confidenceScore),
    },
    practitionerView: { angles },
    detailedView: {
      confidenceScore: analysis.confidenceScore,
      confidencePercent: `${Math.round(analysis.confidenceScore * 100)}%`,
      confidenceLabel: confidenceLabel(analysis.confidenceScore),
      analysisId: analysis.id,
      manualCorrectionApplied: analysis.manualCorrectionApplied,
      manualCorrectionJoint: analysis.manualCorrectionJoint,
      manualCorrectionDisclaimer,
    },
    disclaimer: LEGAL_CONSTANTS.mdrDisclaimer,
  };
}

// ─── HTML generation ─────────────────────────────────────────

function angleRowHtml(entry: AngleReportEntry): string {
  const statusColor = entry.isWithinNorm ? "#27ae60" : "#e74c3c";
  const statusLabel = entry.isWithinNorm
    ? "Dans la norme"
    : `Hors norme (${entry.deviationLevel})`;
  return `
    <tr>
      <td>${entry.label}</td>
      <td>${entry.value}${entry.unit}</td>
      <td>${entry.normalMin}${entry.unit} – ${entry.normalMax}${entry.unit}</td>
      <td style="color: ${statusColor}; font-weight: 600;">${statusLabel}</td>
    </tr>`;
}

export function generateReportHtml(data: ReportData): string {
  const angleRows = data.practitionerView.angles.map(angleRowHtml).join("\n");

  const correctionNote = data.detailedView.manualCorrectionDisclaimer
    ? `<p class="correction-note">${data.detailedView.manualCorrectionDisclaimer}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rapport BodyOrthox — ${data.metadata.patientName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #222; background: #fff; padding: 24px; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #4a90d9; padding-bottom: 16px; }
    .header h1 { font-size: 22px; color: #4a90d9; }
    .header .subtitle { font-size: 14px; color: #666; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 16px; color: #4a90d9; margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .meta-item { font-size: 13px; }
    .meta-item .label { color: #888; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f5f5f5; font-weight: 600; color: #444; }
    .correction-note { font-size: 12px; color: #e67e22; font-style: italic; margin-top: 8px; }
    .disclaimer { font-size: 11px; color: #888; text-align: center; border-top: 1px solid #ddd; padding-top: 12px; margin-top: 32px; }
    @media print { body { padding: 0; } .disclaimer { position: fixed; bottom: 12px; left: 0; right: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Rapport d'Analyse de Marche</h1>
    <div class="subtitle">BodyOrthox — Document de documentation clinique</div>
  </div>

  <div class="section">
    <h2>Informations patient</h2>
    <div class="meta-grid">
      <div class="meta-item"><span class="label">Patient :</span> ${data.metadata.patientName}</div>
      <div class="meta-item"><span class="label">Date :</span> ${data.metadata.analysisDate.slice(0, 10)}</div>
      <div class="meta-item"><span class="label">Appareil :</span> ${data.metadata.device}</div>
      <div class="meta-item"><span class="label">Confiance :</span> ${data.metadata.confidenceLevel}</div>
    </div>
  </div>

  <div class="section">
    <h2>Vue praticien — Angles articulaires</h2>
    <table>
      <thead><tr><th>Articulation</th><th>Valeur</th><th>Norme</th><th>Statut</th></tr></thead>
      <tbody>${angleRows}</tbody>
    </table>
    ${correctionNote}
  </div>

  <div class="section">
    <h2>Vue detaillee</h2>
    <div class="meta-grid">
      <div class="meta-item"><span class="label">Score de confiance ML :</span> ${data.detailedView.confidencePercent}</div>
      <div class="meta-item"><span class="label">Niveau :</span> ${data.detailedView.confidenceLabel}</div>
      <div class="meta-item"><span class="label">ID analyse :</span> ${data.detailedView.analysisId}</div>
      <div class="meta-item"><span class="label">Correction manuelle :</span> ${data.detailedView.manualCorrectionApplied ? "Oui" : "Non"}</div>
    </div>
  </div>

  <div class="disclaimer">${data.disclaimer}</div>
</body>
</html>`;
}
