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

/**
 * Patient — modèle minimisé (privacy by design, RGPD).
 *
 * Principe de minimisation des données : aucune donnée d'identité n'est
 * obligatoire. Le praticien peut n'enregistrer qu'un libellé court non-identifiant
 * (`displayLabel`, ex. "Jean D." ou un code "PAT-0427") et/ou une simple année de
 * naissance (`birthYear`) plutôt qu'une date complète (`dateOfBirth`).
 *
 * `name` et `dateOfBirth` restent disponibles pour rétrocompatibilité mais sont
 * désormais OPTIONNELS. Préférer `patientDisplayName()` / `patientBirthYear()` /
 * `patientAge()` à un accès direct pour l'affichage.
 */
export interface Patient {
  readonly id: string;
  /** Identité complète — optionnelle (minimisation). */
  readonly name?: string;
  /** Libellé court non-identifiant pour l'affichage (ex. "Jean D.", "PAT-0427"). */
  readonly displayLabel?: string;
  /** Date de naissance complète ISO 8601 YYYY-MM-DD — optionnelle (minimisation). */
  readonly dateOfBirth?: string;
  /** Alternative minimisée : année de naissance seule. */
  readonly birthYear?: number;
  readonly morphologicalProfile: MorphologicalProfile | null;
  readonly createdAt: string; // ISO 8601 UTC
  readonly archivedAt?: string; // ISO 8601 UTC — absent = actif
  /** Consentement patient enregistré par le praticien. */
  readonly consentGiven?: boolean;
  readonly consentDate?: string; // ISO 8601 UTC
  /** Consentement granulaire — chaque item peut être prouvé séparément (RGPD). */
  readonly consentStorage?: boolean;
  readonly consentPhotoCapture?: boolean;
  readonly consentPdfExport?: boolean;
  /** Médecin ayant adressé le patient (facultatif). */
  readonly referringPhysician?: string;
}

export interface CreatePatientInput {
  name?: string;
  displayLabel?: string;
  dateOfBirth?: string;
  birthYear?: number;
  morphologicalProfile?: MorphologicalProfile;
  consentGiven?: boolean;
  consentDate?: string;
  consentStorage?: boolean;
  consentPhotoCapture?: boolean;
  consentPdfExport?: boolean;
  referringPhysician?: string;
}

export interface UpdatePatientInput {
  name?: string;
  displayLabel?: string;
  dateOfBirth?: string;
  birthYear?: number;
  morphologicalProfile?: MorphologicalProfile;
  consentGiven?: boolean;
  consentDate?: string;
  consentStorage?: boolean;
  consentPhotoCapture?: boolean;
  consentPdfExport?: boolean;
  referringPhysician?: string;
}

/** Plancher plausible pour une année de naissance. */
export const MIN_BIRTH_YEAR = 1900;
/** Âge maximum plausible (années). */
export const MAX_AGE_YEARS = 130;

/** Validate an optional date-of-birth string. Never throws for absence. */
function assertValidDateOfBirth(dateOfBirth: string): void {
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) {
    throw new Error("La date de naissance est invalide.");
  }
  const now = new Date();
  if (dob > now) {
    throw new Error("La date de naissance ne peut pas être dans le futur.");
  }
  if (dob.getFullYear() < MIN_BIRTH_YEAR) {
    throw new Error(
      `L'année de naissance doit être postérieure à ${MIN_BIRTH_YEAR}.`,
    );
  }
  if (now.getFullYear() - dob.getFullYear() > MAX_AGE_YEARS) {
    throw new Error(`L'âge ne peut pas dépasser ${MAX_AGE_YEARS} ans.`);
  }
}

/** Validate an optional birth year. Same bounds as the full date path. */
function assertValidBirthYear(birthYear: number): void {
  if (!Number.isInteger(birthYear)) {
    throw new Error("L'année de naissance est invalide.");
  }
  const currentYear = new Date().getFullYear();
  if (birthYear > currentYear) {
    throw new Error(
      "L'année de naissance ne peut pas être dans le futur.",
    );
  }
  if (birthYear < MIN_BIRTH_YEAR) {
    throw new Error(
      `L'année de naissance doit être postérieure à ${MIN_BIRTH_YEAR}.`,
    );
  }
  if (currentYear - birthYear > MAX_AGE_YEARS) {
    throw new Error(`L'âge ne peut pas dépasser ${MAX_AGE_YEARS} ans.`);
  }
}

export function createPatient(input: CreatePatientInput): Patient {
  // Minimisation : on ne lève PLUS d'erreur sur l'absence de name / dateOfBirth.
  // On valide uniquement le format de la date si elle est fournie.
  if (input.dateOfBirth) {
    assertValidDateOfBirth(input.dateOfBirth);
  }
  if (input.birthYear !== undefined) {
    assertValidBirthYear(input.birthYear);
  }

  const id = generateId();
  const name = input.name?.trim() || undefined;
  const displayLabel = input.displayLabel?.trim() || undefined;
  const referringPhysician = input.referringPhysician?.trim() || undefined;

  // Au moins un identifiant d'affichage doit exister : si ni name ni displayLabel,
  // on génère un libellé par défaut non-identifiant à partir de l'id.
  const resolvedLabel =
    displayLabel ?? (name ? undefined : `Patient ${id.slice(0, 6)}`);

  return {
    id,
    ...(name ? { name } : {}),
    ...(resolvedLabel ? { displayLabel: resolvedLabel } : {}),
    ...(input.dateOfBirth ? { dateOfBirth: input.dateOfBirth } : {}),
    ...(input.birthYear !== undefined ? { birthYear: input.birthYear } : {}),
    morphologicalProfile: input.morphologicalProfile ?? null,
    createdAt: new Date().toISOString(),
    ...(input.consentGiven !== undefined
      ? { consentGiven: input.consentGiven }
      : {}),
    ...(input.consentDate ? { consentDate: input.consentDate } : {}),
    ...(input.consentStorage !== undefined
      ? { consentStorage: input.consentStorage }
      : {}),
    ...(input.consentPhotoCapture !== undefined
      ? { consentPhotoCapture: input.consentPhotoCapture }
      : {}),
    ...(input.consentPdfExport !== undefined
      ? { consentPdfExport: input.consentPdfExport }
      : {}),
    ...(referringPhysician ? { referringPhysician } : {}),
  };
}

export function updatePatient(
  patient: Patient,
  input: UpdatePatientInput,
): Patient {
  if (input.dateOfBirth !== undefined && input.dateOfBirth) {
    assertValidDateOfBirth(input.dateOfBirth);
  }
  if (input.birthYear !== undefined) {
    assertValidBirthYear(input.birthYear);
  }

  return {
    ...patient,
    ...(input.name !== undefined
      ? { name: input.name.trim() || undefined }
      : {}),
    ...(input.displayLabel !== undefined
      ? { displayLabel: input.displayLabel.trim() || undefined }
      : {}),
    ...(input.dateOfBirth !== undefined ? { dateOfBirth: input.dateOfBirth } : {}),
    ...(input.birthYear !== undefined ? { birthYear: input.birthYear } : {}),
    ...(input.morphologicalProfile !== undefined
      ? { morphologicalProfile: input.morphologicalProfile }
      : {}),
    ...(input.consentGiven !== undefined
      ? { consentGiven: input.consentGiven }
      : {}),
    ...(input.consentDate !== undefined ? { consentDate: input.consentDate } : {}),
    ...(input.consentStorage !== undefined
      ? { consentStorage: input.consentStorage }
      : {}),
    ...(input.consentPhotoCapture !== undefined
      ? { consentPhotoCapture: input.consentPhotoCapture }
      : {}),
    ...(input.consentPdfExport !== undefined
      ? { consentPdfExport: input.consentPdfExport }
      : {}),
    ...(input.referringPhysician !== undefined
      ? { referringPhysician: input.referringPhysician.trim() || undefined }
      : {}),
  };
}

/**
 * Libellé d'affichage du patient, sans jamais exposer plus que nécessaire.
 * Ordre de préférence : displayLabel → name → libellé dérivé de l'id.
 */
export function patientDisplayName(patient: Patient): string {
  return (
    patient.displayLabel ?? patient.name ?? `Patient ${patient.id.slice(0, 6)}`
  );
}

/** Année de naissance (donnée minimisée) ou dérivée de la date complète. */
export function patientBirthYear(patient: Patient): number | undefined {
  if (patient.birthYear !== undefined) return patient.birthYear;
  if (patient.dateOfBirth) return new Date(patient.dateOfBirth).getFullYear();
  return undefined;
}

/**
 * Âge du patient.
 * - Exact à partir de `dateOfBirth` si disponible.
 * - Approximé à partir de `birthYear` sinon.
 * - `undefined` si aucune information de naissance.
 */
export function patientAge(patient: Patient): number | undefined {
  if (patient.dateOfBirth) {
    const dob = new Date(patient.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }
  if (patient.birthYear !== undefined) {
    return new Date().getFullYear() - patient.birthYear;
  }
  return undefined;
}
