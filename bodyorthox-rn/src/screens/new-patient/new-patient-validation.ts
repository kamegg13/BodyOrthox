/**
 * Validation et formatage purs du formulaire NewPatient — sans dépendance à
 * React ni au state du composant, testables isolément.
 */

/** Valide un format JJ/MM/AAAA : mois/jour dans leurs bornes, année ≥ 1900, pas dans le futur. */
export function isValidDob(input: string): boolean {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!m) return false;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1900) return false;
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getTime() > Date.now()) return false;
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
}

/** Convertit une saisie JJ/MM/AAAA validée en date ISO (AAAA-MM-JJ) — `null` si invalide. */
export function parseDobToIso(input: string): string | null {
  if (!isValidDob(input)) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

/** Insère automatiquement les "/" pendant la saisie : 010619 -> 01/06/19, etc. */
export function formatDobMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Parse une saisie numérique libre — `null` si vide, non-numérique ou ≤ 0. */
export function parseNumberOrNull(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Convertit une date ISO (naissance ou consentement) en JJ/MM/AAAA pour affichage/saisie. */
export function formatIsoDateForDisplay(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

/** Libellé affiché pour une valeur de sexe. */
export function labelForSex(s: "male" | "female" | "other"): string {
  return s === "female" ? "Femme" : s === "male" ? "Homme" : "Non precise";
}
