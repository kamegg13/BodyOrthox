/**
 * Squelette HKA superposé à la photo du PDF : lignes/points en SVG inline
 * (coordonnées en %) + labels d'angles en HTML positionné (badges).
 * Rendu par le moteur web du PDF sur TOUTES les plateformes, contrairement
 * au canvas (web-only). ATTENTION : PAS de <text> SVG — le rendu print
 * d'Android (WebView → PDF) échoue dessus (« Error occurred generating
 * the pdf ») ; les labels doivent rester des éléments HTML.
 */
import { generateSkeletonOverlayHtml } from "../skeleton-svg";
import { LEG_COLORS, PELVIS_GUIDE_COLOR } from "../../domain/skeleton-spec";
import type {
  PoseLandmarks,
  BilateralAngles,
} from "../angle-calculator";

const LANDMARKS: PoseLandmarks = {
  23: { x: 0.4, y: 0.5, z: 0, visibility: 0.95 }, // hanche G
  24: { x: 0.6, y: 0.5, z: 0, visibility: 0.95 }, // hanche D
  25: { x: 0.4, y: 0.7, z: 0, visibility: 0.95 }, // genou G
  26: { x: 0.6, y: 0.7, z: 0, visibility: 0.95 }, // genou D
  27: { x: 0.4, y: 0.9, z: 0, visibility: 0.95 }, // cheville G
  28: { x: 0.6, y: 0.9, z: 0, visibility: 0.95 }, // cheville D
};

const BILATERAL: BilateralAngles = {
  leftHKA: 179.2,
  rightHKA: 178.7,
  left: { hipAngle: 176.2, kneeAngle: 179.8, ankleAngle: 171.9 },
  right: { hipAngle: 175.7, kneeAngle: 179.4, ankleAngle: 174.1 },
};

describe("generateSkeletonOverlayHtml", () => {
  it("produit un SVG plein cadre avec les segments des deux jambes", () => {
    const svg = generateSkeletonOverlayHtml(LANDMARKS, BILATERAL);

    expect(svg).toContain('<div class="skeleton-overlay"');
    expect(svg).toContain("<svg");
    // Contrainte Android : aucun <text> SVG dans l'overlay
    expect(svg).not.toContain("<text");
    // Jambe gauche : hanche 23 (40%,50%) → genou 25 (40%,70%)
    expect(svg).toContain('x1="40%" y1="50%" x2="40%" y2="70%"');
    expect(svg).toContain(LEG_COLORS.left);
    // Jambe droite : genou 26 (60%,70%) → cheville 28 (60%,90%)
    expect(svg).toContain('x1="60%" y1="70%" x2="60%" y2="90%"');
    expect(svg).toContain(LEG_COLORS.right);
    // Guide bassin en pointillés
    expect(svg).toContain(PELVIS_GUIDE_COLOR);
    expect(svg).toContain("stroke-dasharray");
  });

  it("affiche les labels HKA gauche/droit et les angles articulaires", () => {
    const svg = generateSkeletonOverlayHtml(LANDMARKS, BILATERAL);

    expect(svg).toContain("G HKA: 179.2°");
    expect(svg).toContain("D HKA: 178.7°");
    expect(svg).toContain("Han. 176.2°");
    expect(svg).toContain("Gen. 179.4°");
    expect(svg).toContain("Che. 171.9°");
  });

  it("affiche — pour un HKA non mesurable (≤ 0)", () => {
    const svg = generateSkeletonOverlayHtml(LANDMARKS, {
      ...BILATERAL,
      leftHKA: 0,
    });

    expect(svg).toContain("G HKA: —");
    expect(svg).toContain("D HKA: 178.7°");
  });

  it("omet les segments et labels d'un côté sans landmarks", () => {
    const leftOnly: PoseLandmarks = {
      23: LANDMARKS[23],
      25: LANDMARKS[25],
      27: LANDMARKS[27],
    };
    const svg = generateSkeletonOverlayHtml(leftOnly, BILATERAL);

    // Aucun segment de la jambe droite (colonne x=60%)
    expect(svg).not.toContain('x1="60%"');
    // Pas de label articulaire droit ni de guide bassin (hanche 24 absente)
    expect(svg).not.toContain("Han. 175.7°");
    expect(svg).not.toContain("stroke-dasharray");
  });

  it("omet un label articulaire dont l'angle vaut 0", () => {
    const svg = generateSkeletonOverlayHtml(LANDMARKS, {
      ...BILATERAL,
      left: { ...BILATERAL.left, ankleAngle: 0 },
    });

    expect(svg).not.toContain("Che. 0");
    expect(svg).toContain("Che. 174.1°");
  });
});
