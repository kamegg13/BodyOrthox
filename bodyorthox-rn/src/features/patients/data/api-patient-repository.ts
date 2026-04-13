import type { IPatientRepository } from './patient-repository';
import type { Patient, CreatePatientInput, UpdatePatientInput, PainEntry, MorphologicalProfile } from '../domain/patient';
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
  sex?: string;
  laterality?: string;
  activityLevel?: string;
  sport?: string;
  pathology?: string;
  pains?: Array<{
    id: string;
    location: string;
    side: string;
    intensity: number;
    type: string;
    notes?: string;
  }>;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

function toPatient(p: ApiPatient): Patient {
  const hasMorpho = p.heightCm != null || p.weightKg != null || p.sex != null
    || p.laterality != null || p.activityLevel != null || p.sport != null
    || p.pathology != null || (p.pains != null && p.pains.length > 0) || p.notes != null;

  return {
    id: p.id,
    name: p.name,
    dateOfBirth: p.dateOfBirth,
    morphologicalProfile: hasMorpho ? {
      heightCm: p.heightCm,
      weightKg: p.weightKg,
      bmi: p.bmi,
      notes: p.notes,
      sex: p.sex as MorphologicalProfile['sex'],
      laterality: p.laterality as MorphologicalProfile['laterality'],
      activityLevel: p.activityLevel as MorphologicalProfile['activityLevel'],
      sport: p.sport,
      pathology: p.pathology,
      pains: p.pains?.map((pain) => ({
        id: pain.id,
        location: pain.location as PainEntry['location'],
        side: pain.side as PainEntry['side'],
        intensity: pain.intensity,
        type: pain.type as PainEntry['type'],
        notes: pain.notes,
      })),
    } : null,
    createdAt: p.createdAt,
    archivedAt: p.archivedAt,
  };
}

function morphoToBody(morpho: Patient['morphologicalProfile']) {
  if (!morpho) return {};
  return {
    heightCm: morpho.heightCm,
    weightKg: morpho.weightKg,
    // bmi is server-computed from heightCm and weightKg — not sent by client
    notes: morpho.notes,
    sex: morpho.sex,
    laterality: morpho.laterality,
    activityLevel: morpho.activityLevel,
    sport: morpho.sport,
    pathology: morpho.pathology,
    pains: morpho.pains,
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
        ...morphoToBody(input.morphologicalProfile ?? null),
      }),
    }));
  }

  async update(id: string, input: UpdatePatientInput): Promise<Patient> {
    return toPatient(await apiRequest<ApiPatient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: input.name,
        dateOfBirth: input.dateOfBirth,
        ...morphoToBody(input.morphologicalProfile ?? null),
      }),
    }));
  }

  async archive(id: string): Promise<Patient> {
    return toPatient(await apiRequest<ApiPatient>(`/patients/${id}/archive`, {
      method: 'PATCH',
    }));
  }

  async delete(id: string): Promise<void> {
    await apiRequest(`/patients/${id}`, { method: 'DELETE' });
  }
}
