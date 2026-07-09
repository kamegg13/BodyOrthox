import { IDatabase } from "../../../core/database/database";
import {
  Patient,
  CreatePatientInput,
  UpdatePatientInput,
  createPatient,
} from "../domain/patient";
import { IPatientRepository } from "./patient-repository";

interface PatientRow {
  id: string;
  name: string | null;
  display_label: string | null;
  date_of_birth: string | null;
  birth_year: number | null;
  morphological_profile: string | null;
  created_at: string;
  archived_at: string | null;
  consent_given: number | null;
  consent_date: string | null;
}

/**
 * Parse le profil morphologique stocké en JSON. Une ligne corrompue ne doit
 * jamais faire planter le rendu de la liste patients : on retombe sur `null`.
 */
function parseMorphologicalProfile(
  json: string | null,
): Patient["morphologicalProfile"] {
  if (!json) return null;
  try {
    return JSON.parse(json) as Patient["morphologicalProfile"];
  } catch {
    return null;
  }
}

function rowToPatient(row: Record<string, unknown>): Patient {
  const r = row as unknown as PatientRow;
  return {
    id: r.id,
    // Colonnes minimisées : une chaîne vide est traitée comme absence de donnée.
    ...(r.name ? { name: r.name } : {}),
    ...(r.display_label ? { displayLabel: r.display_label } : {}),
    ...(r.date_of_birth ? { dateOfBirth: r.date_of_birth } : {}),
    ...(r.birth_year != null ? { birthYear: Number(r.birth_year) } : {}),
    morphologicalProfile: parseMorphologicalProfile(r.morphological_profile),
    createdAt: r.created_at,
    ...(r.archived_at ? { archivedAt: r.archived_at } : {}),
    ...(r.consent_given != null
      ? { consentGiven: Boolean(r.consent_given) }
      : {}),
    ...(r.consent_date ? { consentDate: r.consent_date } : {}),
  };
}

export class SqlitePatientRepository implements IPatientRepository {
  constructor(private readonly db: IDatabase) {}

  async getAll(nameFilter?: string): Promise<Patient[]> {
    let sql: string;
    let params: unknown[];

    if (nameFilter && nameFilter.trim()) {
      sql = `SELECT * FROM patients WHERE name LIKE ? OR display_label LIKE ? ORDER BY name ASC`;
      const like = `%${nameFilter.trim()}%`;
      params = [like, like];
    } else {
      sql = `SELECT * FROM patients ORDER BY name ASC`;
      params = [];
    }

    const result = await this.db.execute(sql, params);
    return result.rows.map(rowToPatient);
  }

  async getById(id: string): Promise<Patient | null> {
    const result = await this.db.execute(
      `SELECT * FROM patients WHERE id = ?`,
      [id],
    );
    if (result.rows.length === 0) return null;
    return rowToPatient(result.rows[0]);
  }

  async create(input: CreatePatientInput): Promise<Patient> {
    const patient = createPatient(input);
    await this.db.execute(
      `INSERT INTO patients
         (id, name, display_label, date_of_birth, birth_year,
          morphological_profile, created_at, consent_given, consent_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient.id,
        // NOT NULL legacy column — '' représente l'absence d'identité.
        patient.name ?? "",
        patient.displayLabel ?? null,
        patient.dateOfBirth ?? null,
        patient.birthYear ?? null,
        patient.morphologicalProfile
          ? JSON.stringify(patient.morphologicalProfile)
          : null,
        patient.createdAt,
        patient.consentGiven == null ? null : patient.consentGiven ? 1 : 0,
        patient.consentDate ?? null,
      ],
    );
    return patient;
  }

  async update(id: string, partial: UpdatePatientInput): Promise<Patient> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Patient ${id} introuvable.`);

    const updated: Patient = {
      ...existing,
      ...(partial.name !== undefined
        ? { name: partial.name.trim() || undefined }
        : {}),
      ...(partial.displayLabel !== undefined
        ? { displayLabel: partial.displayLabel.trim() || undefined }
        : {}),
      ...(partial.dateOfBirth !== undefined
        ? { dateOfBirth: partial.dateOfBirth }
        : {}),
      ...(partial.birthYear !== undefined
        ? { birthYear: partial.birthYear }
        : {}),
      morphologicalProfile:
        partial.morphologicalProfile !== undefined
          ? partial.morphologicalProfile
          : existing.morphologicalProfile,
      ...(partial.consentGiven !== undefined
        ? { consentGiven: partial.consentGiven }
        : {}),
      ...(partial.consentDate !== undefined
        ? { consentDate: partial.consentDate }
        : {}),
    };

    await this.db.execute(
      `UPDATE patients SET name = ?, display_label = ?, date_of_birth = ?,
         birth_year = ?, morphological_profile = ?, consent_given = ?,
         consent_date = ? WHERE id = ?`,
      [
        updated.name ?? "",
        updated.displayLabel ?? null,
        updated.dateOfBirth ?? null,
        updated.birthYear ?? null,
        updated.morphologicalProfile
          ? JSON.stringify(updated.morphologicalProfile)
          : null,
        updated.consentGiven == null ? null : updated.consentGiven ? 1 : 0,
        updated.consentDate ?? null,
        id,
      ],
    );

    return updated;
  }

  async archive(id: string): Promise<Patient> {
    const archivedAt = new Date().toISOString();
    await this.db.execute(`UPDATE patients SET archived_at = ? WHERE id = ?`, [
      archivedAt,
      id,
    ]);
    const patient = await this.getById(id);
    if (!patient) throw new Error(`Patient ${id} not found after archive`);
    return patient;
  }

  /**
   * Droit à l'effacement (RGPD) — suppression DÉFINITIVE on-device.
   *
   * Supprime explicitement les analyses associées AVANT le patient. On ne se
   * repose pas sur `ON DELETE CASCADE` car le moteur de stockage on-device
   * actuel (Map en mémoire, web/native) n'exécute pas les contraintes SQL.
   */
  async delete(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM analyses WHERE patient_id = ?`, [id]);
    await this.db.execute(`DELETE FROM patients WHERE id = ?`, [id]);
  }
}
