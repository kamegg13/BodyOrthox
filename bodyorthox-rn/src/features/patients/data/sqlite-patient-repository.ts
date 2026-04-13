import { IDatabase } from "../../../core/database/database";
import { Patient, CreatePatientInput, createPatient } from "../domain/patient";
import { IPatientRepository } from "./patient-repository";

interface PatientRow {
  id: string;
  name: string;
  date_of_birth: string;
  morphological_profile: string | null;
  created_at: string;
}

function rowToPatient(row: Record<string, unknown>): Patient {
  const r = row as unknown as PatientRow;
  return {
    id: r.id,
    name: r.name,
    dateOfBirth: r.date_of_birth,
    morphologicalProfile: r.morphological_profile
      ? JSON.parse(r.morphological_profile)
      : null,
    createdAt: r.created_at,
  };
}

export class SqlitePatientRepository implements IPatientRepository {
  constructor(private readonly db: IDatabase) {}

  async getAll(nameFilter?: string): Promise<Patient[]> {
    let sql: string;
    let params: unknown[];

    if (nameFilter && nameFilter.trim()) {
      sql = `SELECT * FROM patients WHERE name LIKE ? ORDER BY name ASC`;
      params = [`%${nameFilter.trim()}%`];
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
      `INSERT INTO patients (id, name, date_of_birth, morphological_profile, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        patient.id,
        patient.name,
        patient.dateOfBirth,
        patient.morphologicalProfile
          ? JSON.stringify(patient.morphologicalProfile)
          : null,
        patient.createdAt,
      ],
    );
    return patient;
  }

  async update(
    id: string,
    partial: Partial<
      Pick<Patient, "name" | "dateOfBirth" | "morphologicalProfile">
    >,
  ): Promise<Patient> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Patient ${id} introuvable.`);

    const updated: Patient = {
      ...existing,
      name: partial.name ?? existing.name,
      dateOfBirth: partial.dateOfBirth ?? existing.dateOfBirth,
      morphologicalProfile:
        partial.morphologicalProfile !== undefined
          ? partial.morphologicalProfile
          : existing.morphologicalProfile,
    };

    await this.db.execute(
      `UPDATE patients SET name = ?, date_of_birth = ?, morphological_profile = ? WHERE id = ?`,
      [
        updated.name,
        updated.dateOfBirth,
        updated.morphologicalProfile
          ? JSON.stringify(updated.morphologicalProfile)
          : null,
        id,
      ],
    );

    return updated;
  }

  async archive(id: string): Promise<Patient> {
    const archivedAt = new Date().toISOString();
    await this.db.execute(
      `UPDATE patients SET archived_at = ? WHERE id = ?`,
      [archivedAt, id],
    );
    const patient = await this.getById(id);
    if (!patient) throw new Error(`Patient ${id} not found after archive`);
    return patient;
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM patients WHERE id = ?`, [id]);
  }
}
