import type { IPatientRepository } from './patient-repository';
import type { Patient, CreatePatientInput } from '../domain/patient';
import { apiRequest } from '../../../core/api/api-client';

interface ApiPatient {
  id: string;
  userId: string;
  name: string;
  dateOfBirth: string;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function toPatient(p: ApiPatient): Patient {
  return {
    id: p.id,
    name: p.name,
    dateOfBirth: p.dateOfBirth,
    morphologicalProfile: (p.heightCm != null || p.weightKg != null)
      ? { heightCm: p.heightCm, weightKg: p.weightKg, bmi: p.bmi, notes: p.notes }
      : null,
    createdAt: p.createdAt,
  };
}

export class ApiPatientRepository implements IPatientRepository {
  async getAll(nameFilter?: string): Promise<Patient[]> {
    const url = nameFilter ? `/patients?name=${encodeURIComponent(nameFilter)}` : '/patients';
    const rows = await apiRequest<ApiPatient[]>(url);
    return rows.map(toPatient);
  }

  async getById(id: string): Promise<Patient | null> {
    try {
      return toPatient(await apiRequest<ApiPatient>(`/patients/${id}`));
    } catch {
      return null;
    }
  }

  async create(input: CreatePatientInput): Promise<Patient> {
    return toPatient(await apiRequest<ApiPatient>('/patients', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        dateOfBirth: input.dateOfBirth,
        heightCm: input.morphologicalProfile?.heightCm,
        weightKg: input.morphologicalProfile?.weightKg,
        notes: input.morphologicalProfile?.notes,
      }),
    }));
  }

  async update(
    id: string,
    partial: Partial<Pick<Patient, 'name' | 'dateOfBirth' | 'morphologicalProfile'>>,
  ): Promise<Patient> {
    return toPatient(await apiRequest<ApiPatient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: partial.name,
        dateOfBirth: partial.dateOfBirth,
        heightCm: partial.morphologicalProfile?.heightCm,
        weightKg: partial.morphologicalProfile?.weightKg,
        notes: partial.morphologicalProfile?.notes,
      }),
    }));
  }

  async delete(id: string): Promise<void> {
    await apiRequest(`/patients/${id}`, { method: 'DELETE' });
  }
}
