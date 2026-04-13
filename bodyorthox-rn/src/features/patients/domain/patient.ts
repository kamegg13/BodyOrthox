import { generateId } from "../../../shared/utils/generate-id";

export interface MorphologicalProfile {
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  notes?: string;
  // Nouveaux champs
  sex?: "male" | "female" | "other";
  laterality?: "right" | "left" | "ambidextrous";
  activityLevel?: "sedentary" | "moderate" | "active" | "athlete";
  sport?: string;
  pathology?: string;
  pains?: PainEntry[];
}

export interface PainEntry {
  readonly id: string;
  readonly location: "knee" | "hip" | "ankle" | "back" | "shoulder" | "other";
  readonly side: "left" | "right" | "bilateral";
  readonly intensity: number; // EVA 0–10
  readonly type: "acute" | "chronic";
  readonly notes?: string;
}

export type Sex = NonNullable<MorphologicalProfile["sex"]>;
export type Laterality = NonNullable<MorphologicalProfile["laterality"]>;
export type ActivityLevel = NonNullable<MorphologicalProfile["activityLevel"]>;

export interface Patient {
  readonly id: string;
  readonly name: string;
  readonly dateOfBirth: string; // ISO 8601 YYYY-MM-DD
  readonly morphologicalProfile: MorphologicalProfile | null;
  readonly createdAt: string; // ISO 8601 UTC
  readonly archivedAt?: string; // ISO 8601 UTC — absent = actif
}

export interface CreatePatientInput {
  name: string;
  dateOfBirth: string;
  morphologicalProfile?: MorphologicalProfile;
}

export interface UpdatePatientInput {
  name?: string;
  dateOfBirth?: string;
  morphologicalProfile?: MorphologicalProfile;
}

export function createPatient(input: CreatePatientInput): Patient {
  if (!input.name.trim()) {
    throw new Error("Le nom du patient est obligatoire.");
  }
  if (!input.dateOfBirth) {
    throw new Error("La date de naissance est obligatoire.");
  }
  const dob = new Date(input.dateOfBirth);
  if (isNaN(dob.getTime())) {
    throw new Error("La date de naissance est invalide.");
  }
  if (dob > new Date()) {
    throw new Error("La date de naissance ne peut pas être dans le futur.");
  }

  return {
    id: generateId(),
    name: input.name.trim(),
    dateOfBirth: input.dateOfBirth,
    morphologicalProfile: input.morphologicalProfile ?? null,
    createdAt: new Date().toISOString(),
  };
}

export function updatePatient(patient: Patient, input: UpdatePatientInput): Patient {
  if (input.name !== undefined && !input.name.trim()) {
    throw new Error("Le nom du patient est obligatoire.");
  }
  if (input.dateOfBirth !== undefined) {
    const dob = new Date(input.dateOfBirth);
    if (isNaN(dob.getTime())) {
      throw new Error("La date de naissance est invalide.");
    }
    if (dob > new Date()) {
      throw new Error("La date de naissance ne peut pas être dans le futur.");
    }
  }

  return {
    ...patient,
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.dateOfBirth !== undefined ? { dateOfBirth: input.dateOfBirth } : {}),
    ...(input.morphologicalProfile !== undefined
      ? { morphologicalProfile: input.morphologicalProfile }
      : {}),
  };
}

export function patientAge(patient: Patient): number {
  const dob = new Date(patient.dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}
