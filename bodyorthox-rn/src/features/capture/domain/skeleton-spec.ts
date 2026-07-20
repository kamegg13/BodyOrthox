/**
 * Source de vérité unique pour le rendu du squelette anatomique des jambes :
 * index de landmarks MediaPipe, connexions osseuses et couleurs par côté.
 * Consommée par les trois implémentations de rendu qui avaient divergé :
 * - l'overlay écran (components/skeleton-overlay.tsx, Views RN)
 * - le SVG inline du rapport PDF (data/skeleton-svg.ts)
 * - l'incrustation canvas web (data/skeleton-canvas.ts)
 *
 * Distinction gauche/droite critique en lecture clinique : la couleur d'une
 * jambe doit être identique quelle que soit la surface de rendu.
 */

/** Index des landmarks MediaPipe Pose (33 points) pour une jambe, hanche → pied. */
export interface LegLandmarkIndices {
  readonly hip: number;
  readonly knee: number;
  readonly ankle: number;
  readonly heel: number;
  readonly footIndex: number;
}

export const LEG_LANDMARKS: Record<"left" | "right", LegLandmarkIndices> = {
  left: { hip: 23, knee: 25, ankle: 27, heel: 29, footIndex: 31 },
  right: { hip: 24, knee: 26, ankle: 28, heel: 30, footIndex: 32 },
};

/** Connexions osseuses (paires [from, to]) par jambe, hanche → pied. */
export const LEG_CONNECTIONS: Record<
  "left" | "right",
  ReadonlyArray<readonly [number, number]>
> = {
  left: [
    [LEG_LANDMARKS.left.hip, LEG_LANDMARKS.left.knee],
    [LEG_LANDMARKS.left.knee, LEG_LANDMARKS.left.ankle],
    [LEG_LANDMARKS.left.ankle, LEG_LANDMARKS.left.heel],
    [LEG_LANDMARKS.left.heel, LEG_LANDMARKS.left.footIndex],
    [LEG_LANDMARKS.left.ankle, LEG_LANDMARKS.left.footIndex],
  ],
  right: [
    [LEG_LANDMARKS.right.hip, LEG_LANDMARKS.right.knee],
    [LEG_LANDMARKS.right.knee, LEG_LANDMARKS.right.ankle],
    [LEG_LANDMARKS.right.ankle, LEG_LANDMARKS.right.heel],
    [LEG_LANDMARKS.right.heel, LEG_LANDMARKS.right.footIndex],
    [LEG_LANDMARKS.right.ankle, LEG_LANDMARKS.right.footIndex],
  ],
};

/**
 * Couleurs canoniques par jambe — identiques sur toutes les surfaces
 * (écran Résultats/Capture live, PDF, incrustation canvas).
 */
export const LEG_COLORS: Record<"left" | "right", string> = {
  left: "#34D399", // vert santé vif
  right: "#22D3EE", // cyan secondaire
};

/** Couleur de la ligne de référence bassin (hanche gauche ↔ hanche droite). */
export const PELVIS_GUIDE_COLOR = "#FBBF24"; // ambre vif
