import type { Patient } from "../../patients/domain/patient";
import type { Analysis } from "../../capture/domain/analysis";
import type { IPatientRepository } from "../../patients/data/patient-repository";
import type { IAnalysisRepository } from "../../capture/data/analysis-repository";

/**
 * Export complet des données locales (droit à la portabilité, art. 20 RGPD).
 * Le payload reprend les entités du domaine telles quelles (photos incluses,
 * en data URL base64 dans `capturedImageUrl`) : le fichier suffit à
 * reconstituer les dossiers hors de l'app.
 */
export interface ExportPayload {
  readonly exportVersion: 1;
  readonly exportedAt: string;
  readonly app: "BodyOrthox";
  readonly patients: readonly ExportedPatient[];
}

export interface ExportedPatient {
  readonly patient: Patient;
  readonly analyses: readonly Analysis[];
}

export async function buildExportPayload(
  patientRepo: IPatientRepository,
  analysisRepo: IAnalysisRepository,
  exportedAt: string,
): Promise<ExportPayload> {
  const patients = await patientRepo.getAll();
  const exported = await Promise.all(
    patients.map(async (patient) => ({
      patient,
      analyses: await analysisRepo.getForPatient(patient.id),
    })),
  );

  return {
    exportVersion: 1,
    exportedAt,
    app: "BodyOrthox",
    patients: exported,
  };
}

/** Nom de fichier daté — « bodyorthox-export-2026-07-19.json ». */
export function exportFileName(exportedAt: string): string {
  const day = exportedAt.slice(0, 10);
  return `bodyorthox-export-${day}.json`;
}
