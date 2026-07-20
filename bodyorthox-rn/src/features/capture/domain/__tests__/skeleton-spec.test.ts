/**
 * Spec partagée du squelette anatomique (jambes) : source de vérité unique
 * pour les connexions osseuses et les couleurs par côté, consommée par
 * l'overlay écran (skeleton-overlay.tsx), le SVG du PDF (skeleton-svg.ts)
 * et l'incrustation canvas (skeleton-canvas.ts).
 *
 * Ce test couvre la régression qui a motivé la spec : la jambe gauche
 * était blanche à l'écran (Résultats) mais verte dans le PDF — la même
 * jambe n'avait pas la même couleur selon la surface de rendu.
 */
import { LEG_LANDMARKS, LEG_CONNECTIONS, LEG_COLORS, PELVIS_GUIDE_COLOR } from "../skeleton-spec";
import { getConnectionColor } from "../../components/skeleton-overlay";
import { generateSkeletonOverlayHtml } from "../../data/skeleton-svg";

describe("skeleton-spec", () => {
  it("expose les couleurs canoniques jambe gauche (vert) / jambe droite (cyan)", () => {
    expect(LEG_COLORS.left).toBe("#34D399");
    expect(LEG_COLORS.right).toBe("#22D3EE");
  });

  it("expose la couleur du guide bassin", () => {
    expect(PELVIS_GUIDE_COLOR).toBe("#FBBF24");
  });

  it("expose les index de landmarks MediaPipe par jambe (hanche → pied)", () => {
    expect(LEG_LANDMARKS.left).toEqual({
      hip: 23,
      knee: 25,
      ankle: 27,
      heel: 29,
      footIndex: 31,
    });
    expect(LEG_LANDMARKS.right).toEqual({
      hip: 24,
      knee: 26,
      ankle: 28,
      heel: 30,
      footIndex: 32,
    });
  });

  it("définit des connexions osseuses cohérentes avec LEG_LANDMARKS pour chaque jambe", () => {
    const { left, right } = LEG_LANDMARKS;
    expect(LEG_CONNECTIONS.left).toEqual([
      [left.hip, left.knee],
      [left.knee, left.ankle],
      [left.ankle, left.heel],
      [left.heel, left.footIndex],
      [left.ankle, left.footIndex],
    ]);
    expect(LEG_CONNECTIONS.right).toEqual([
      [right.hip, right.knee],
      [right.knee, right.ankle],
      [right.ankle, right.heel],
      [right.heel, right.footIndex],
      [right.ankle, right.footIndex],
    ]);
  });

  it("n'a aucun index de landmark partagé entre la jambe gauche et la jambe droite", () => {
    const leftIndices = new Set(Object.values(LEG_LANDMARKS.left));
    const rightIndices = new Set(Object.values(LEG_LANDMARKS.right));
    const intersection = [...leftIndices].filter((i) => rightIndices.has(i));
    expect(intersection).toEqual([]);
  });
});

describe("skeleton-spec — cohérence inter-surfaces (écran ↔ PDF)", () => {
  it("l'overlay écran colore la jambe gauche/droite avec les mêmes couleurs que le PDF", () => {
    const { left, right } = LEG_LANDMARKS;

    expect(getConnectionColor(left.hip, left.knee)).toBe(LEG_COLORS.left);
    expect(getConnectionColor(right.hip, right.knee)).toBe(LEG_COLORS.right);
  });

  it("le SVG du PDF trace la jambe gauche/droite avec les couleurs de la spec", () => {
    const svg = generateSkeletonOverlayHtml(
      {
        23: { x: 0.4, y: 0.5, z: 0, visibility: 0.95 },
        24: { x: 0.6, y: 0.5, z: 0, visibility: 0.95 },
        25: { x: 0.4, y: 0.7, z: 0, visibility: 0.95 },
        26: { x: 0.6, y: 0.7, z: 0, visibility: 0.95 },
      },
      {
        leftHKA: 0,
        rightHKA: 0,
        left: { hipAngle: 0, kneeAngle: 0, ankleAngle: 0 },
        right: { hipAngle: 0, kneeAngle: 0, ankleAngle: 0 },
      },
    );

    expect(svg).toContain(LEG_COLORS.left);
    expect(svg).toContain(LEG_COLORS.right);
  });
});
