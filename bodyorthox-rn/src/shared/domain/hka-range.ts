/**
 * Classification géométrique neutre d'une mesure HKA par rapport à la plage
 * de référence 175°–180° (cf. classifyHKA dans
 * src/features/capture/data/angle-calculator.ts — mêmes bornes).
 *
 * Volontairement AUCUNE sémantique de gravité (« normal / modéré / sévère ») :
 * l'app documente une mesure et sa position par rapport à une plage de
 * référence, elle ne produit pas d'interprétation clinique
 * (positionnement non-DM, cf. docs/audit-rgpd-dm-2026-07-17.md).
 */

export const HKA_REF_MIN = 175;
export const HKA_REF_MAX = 180;

export type HkaRangeStatus = "in_range" | "out_of_range" | "unavailable";

/**
 * Écart signé à la plage de référence, arrondi au dixième :
 * 0 si la valeur est dans la plage, négatif sous la plage, positif au-dessus.
 * `null` quand l'angle n'a pas pu être mesuré (0 / non-fini / absent).
 */
export function hkaDeviation(value: number | null | undefined): number | null {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value) ||
    value === 0
  ) {
    return null;
  }
  if (value < HKA_REF_MIN) return round1(value - HKA_REF_MIN);
  if (value > HKA_REF_MAX) return round1(value - HKA_REF_MAX);
  return 0;
}

/** Position des deux HKA par rapport à la plage — hors plage dès qu'un côté l'est. */
export function hkaRangeStatus(
  leftHKA: number | null | undefined,
  rightHKA: number | null | undefined,
): HkaRangeStatus {
  const deviations = [hkaDeviation(leftHKA), hkaDeviation(rightHKA)].filter(
    (d): d is number => d !== null,
  );
  if (deviations.length === 0) return "unavailable";
  return deviations.some((d) => d !== 0) ? "out_of_range" : "in_range";
}

/** Libellé factuel du statut — jamais un jugement de gravité. */
export function hkaRangeLabel(status: HkaRangeStatus): string {
  switch (status) {
    case "in_range":
      return `Dans la plage ${HKA_REF_MIN}–${HKA_REF_MAX}°`;
    case "out_of_range":
      return `Hors plage ${HKA_REF_MIN}–${HKA_REF_MAX}°`;
    case "unavailable":
      return "HKA non mesuré";
  }
}

/** Libellé court pour les listes et badges compacts. */
export function hkaRangeShortLabel(status: HkaRangeStatus): string {
  switch (status) {
    case "in_range":
      return "Dans la plage";
    case "out_of_range":
      return "Hors plage";
    case "unavailable":
      return "Non mesuré";
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
