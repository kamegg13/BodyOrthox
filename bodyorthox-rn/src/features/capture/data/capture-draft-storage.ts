import { getKeyValueStorage } from "../../../core/storage/key-value-storage";

/**
 * Persistance best-effort de la preview de capture en cours, pour survivre à
 * une interruption (appel entrant, passage prolongé en arrière-plan) avant
 * l'analyse ou la sauvegarde. Choix du support : le seam key-value existant
 * (localStorage sur web, AsyncStorage hydraté sur natif — cf.
 * core/storage/key-value-storage.ts) plutôt qu'un store dédié, car c'est une
 * simple paire clé/valeur de session, déjà le cas d'usage de ce seam.
 *
 * Le dataURL peut peser plusieurs Mo : lecture et écriture sont best-effort
 * (try/catch). Un échec (quota dépassé, stockage indisponible) ne doit
 * jamais faire échouer la capture elle-même — seule la reprise après
 * interruption est perdue dans ce cas.
 */

export interface CaptureDraft {
  readonly previewUrl: string;
  readonly savedAt: string; // ISO 8601
}

function draftKey(patientId: string): string {
  return `capture-draft:${patientId}`;
}

/** Persiste la preview en cours pour ce patient (best-effort, silencieux). */
export function saveCaptureDraft(patientId: string, previewUrl: string): void {
  try {
    const draft: CaptureDraft = {
      previewUrl,
      savedAt: new Date().toISOString(),
    };
    getKeyValueStorage().setItem(draftKey(patientId), JSON.stringify(draft));
  } catch {
    // Best-effort : ne doit jamais bloquer la capture.
  }
}

/** Relit le brouillon de ce patient, ou `null` s'il est absent/invalide. */
export function loadCaptureDraft(patientId: string): CaptureDraft | null {
  try {
    const raw = getKeyValueStorage().getItem(draftKey(patientId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CaptureDraft>;
    if (typeof parsed.previewUrl !== "string") return null;
    return { previewUrl: parsed.previewUrl, savedAt: parsed.savedAt ?? "" };
  } catch {
    return null;
  }
}

/** Purge le brouillon de ce patient (sauvegarde réussie ou refus explicite). */
export function clearCaptureDraft(patientId: string): void {
  try {
    getKeyValueStorage().removeItem(draftKey(patientId));
  } catch {
    // Best-effort.
  }
}
