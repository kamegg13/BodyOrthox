import { getKeyValueStorage } from "../../core/storage/key-value-storage";
import type { ActivityLevel, Laterality, PainEntry, Sex } from "../../features/patients/domain/patient";

/** Clé de persistance du brouillon — un seul brouillon de création à la fois. */
export const NEW_PATIENT_DRAFT_KEY = "new_patient_draft_v1";

/** Délai de debounce avant l'écriture du brouillon (évite d'écrire à chaque frappe). */
export const DRAFT_DEBOUNCE_MS = 1000;

export interface NewPatientDraftV1 {
  readonly firstName: string;
  readonly lastName: string;
  readonly sex: Sex | null;
  readonly dob: string;
  readonly heightCm: string;
  readonly weightKg: string;
  readonly diagnosis: string;
  readonly referring: string;
  readonly observations: string;
  readonly laterality: Laterality | null;
  readonly activityLevel: ActivityLevel | null;
  readonly sport: string;
  readonly pains: PainEntry[];
}

/** Un brouillon où aucun champ n'a été renseigné équivaut à « pas de brouillon ». */
export function isDraftEmpty(d: NewPatientDraftV1): boolean {
  return (
    !d.firstName &&
    !d.lastName &&
    !d.sex &&
    !d.dob &&
    !d.heightCm &&
    !d.weightKg &&
    !d.diagnosis &&
    !d.referring &&
    !d.observations &&
    !d.laterality &&
    !d.activityLevel &&
    !d.sport &&
    d.pains.length === 0
  );
}

/** Lit le brouillon persisté — `null` si absent ou corrompu (JSON invalide). */
export function readDraft(): NewPatientDraftV1 | null {
  const raw = getKeyValueStorage().getItem(NEW_PATIENT_DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<NewPatientDraftV1>;
    return {
      firstName: parsed.firstName ?? "",
      lastName: parsed.lastName ?? "",
      sex: parsed.sex ?? null,
      dob: parsed.dob ?? "",
      heightCm: parsed.heightCm ?? "",
      weightKg: parsed.weightKg ?? "",
      diagnosis: parsed.diagnosis ?? "",
      referring: parsed.referring ?? "",
      observations: parsed.observations ?? "",
      laterality: parsed.laterality ?? null,
      activityLevel: parsed.activityLevel ?? null,
      sport: parsed.sport ?? "",
      pains: parsed.pains ?? [],
    };
  } catch {
    // Brouillon corrompu — ignoré silencieusement, comme s'il n'existait pas.
    return null;
  }
}

/**
 * Persiste (ou purge, s'il est vide) le brouillon — appelée après le debounce
 * par `useNewPatientForm`, jamais synchroniquement à chaque frappe.
 */
export function persistDraft(draft: NewPatientDraftV1): void {
  if (isDraftEmpty(draft)) {
    getKeyValueStorage().removeItem(NEW_PATIENT_DRAFT_KEY);
  } else {
    getKeyValueStorage().setItem(NEW_PATIENT_DRAFT_KEY, JSON.stringify(draft));
  }
}

/** Purge le brouillon — à appeler après une création réussie ou un abandon confirmé. */
export function clearNewPatientDraft(): void {
  getKeyValueStorage().removeItem(NEW_PATIENT_DRAFT_KEY);
}
