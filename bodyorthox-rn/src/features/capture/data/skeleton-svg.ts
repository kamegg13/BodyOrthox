/**
 * Squelette HKA superposé à la photo du rapport PDF : lignes/points en SVG
 * inline (coordonnées en %) + labels d'angles en HTML positionné (badges).
 * L'ensemble est rendu par le moteur web du convertisseur PDF
 * (react-native-html-to-pdf = WebView) sur TOUTES les plateformes — là où
 * l'incrustation canvas (skeleton-canvas.ts) reste web-only.
 *
 * ⚠️ CONTRAINTE ANDROID (bissection sur émulateur) : le print Chromium
 * (WebView → PdfDocument) échoue (« Error occurred generating the pdf »)
 * quand du TEXTE positionné déborde de la boîte de l'overlay — les
 * variantes <text> SVG et badges HTML non clippés échouaient toutes deux.
 * La combinaison validée : labels = badges HTML restant dans la boîte,
 * couche .skeleton-overlay clippée (overflow: hidden, cf. report-generator).
 *
 * Les coordonnées en % rendent le tracé indépendant du ratio de la photo
 * (l'overlay épouse la boîte de l'image, les épaisseurs restent en px).
 */
import type { PoseLandmarks, BilateralAngles } from "./angle-calculator";
import { LEG_COLORS, PELVIS_GUIDE_COLOR } from "../domain/skeleton-spec";

// Couleurs partagées avec l'overlay écran (skeleton-overlay.tsx) et le
// canvas web (skeleton-canvas.ts) : voir domain/skeleton-spec.ts.
const LEFT_COLOR = LEG_COLORS.left; // jambe gauche — vert santé vif
const RIGHT_COLOR = LEG_COLORS.right; // jambe droite — cyan secondaire
const GUIDE_COLOR = PELVIS_GUIDE_COLOR; // ligne de référence bassin — ambre vif

/** 0.4 → "40%" (précision 2 décimales, zéros superflus retirés). */
function pct(normalized: number): string {
  return `${+(normalized * 100).toFixed(2)}%`;
}

function fmtAngle(value: number): string {
  return value > 0 ? `${value.toFixed(1)}°` : "—";
}

export function generateSkeletonOverlayHtml(
  landmarks: PoseLandmarks,
  bilateral: BilateralAngles,
): string {
  const has = (i: number): boolean => landmarks[i] != null;
  const px = (i: number): string => pct(landmarks[i]?.x ?? 0);
  const py = (i: number): string => pct(landmarks[i]?.y ?? 0);

  const shapes: string[] = [];
  const labels: string[] = [];

  const segment = (a: number, b: number, color: string): void => {
    if (!has(a) || !has(b)) return;
    shapes.push(
      `<line x1="${px(a)}" y1="${py(a)}" x2="${px(b)}" y2="${py(b)}" ` +
        `stroke="${color}" stroke-width="4" stroke-linecap="round" />`,
    );
  };

  const joint = (i: number, color: string): void => {
    if (!has(i)) return;
    shapes.push(
      `<circle cx="${px(i)}" cy="${py(i)}" r="5" fill="${color}" ` +
        `stroke="#fff" stroke-width="2" />`,
    );
  };

  /** Badge HTML positionné en % — `right` ancre le bord droit du badge. */
  const label = (
    text: string,
    xExpr: string,
    yExpr: string,
    color: string,
    anchor: "left" | "right",
    big = false,
  ): void => {
    const pos =
      anchor === "left" ? `left:${xExpr};` : `right:${xExpr};`;
    const cls = big ? "skl-label skl-label-big" : "skl-label";
    labels.push(
      `<span class="${cls}" style="${pos}top:${yExpr};color:${color}">${text}</span>`,
    );
  };

  // Jambe gauche (vert) : hanche 23 → genou 25 → cheville 27
  segment(23, 25, LEFT_COLOR);
  segment(25, 27, LEFT_COLOR);
  // Jambe droite (cyan) : hanche 24 → genou 26 → cheville 28
  segment(24, 26, RIGHT_COLOR);
  segment(26, 28, RIGHT_COLOR);

  // Guide bassin en pointillés
  if (has(23) && has(24)) {
    shapes.push(
      `<line x1="${px(23)}" y1="${py(23)}" x2="${px(24)}" y2="${py(24)}" ` +
        `stroke="${GUIDE_COLOR}" stroke-width="2" stroke-dasharray="8 4" />`,
    );
  }

  for (const i of [23, 25, 27]) joint(i, LEFT_COLOR);
  for (const i of [24, 26, 28]) joint(i, RIGHT_COLOR);

  // Labels HKA — bandeau haut (gauche/droite du cadre)
  label(`G HKA: ${fmtAngle(bilateral.leftHKA)}`, "1.5%", "2%", LEFT_COLOR, "left", true);
  label(`D HKA: ${fmtAngle(bilateral.rightHKA)}`, "1.5%", "2%", RIGHT_COLOR, "right", true);

  // Labels articulaires — côté gauche à droite du point, côté droit à gauche
  const jointLabel = (
    i: number,
    prefix: string,
    angle: number,
    color: string,
    side: "left" | "right",
    below = false,
  ): void => {
    if (!has(i) || angle <= 0) return;
    const lm = landmarks[i];
    if (!lm) return;
    const yExpr = pct(lm.y + (below ? 0.015 : -0.04));
    const xExpr =
      side === "left" ? pct(lm.x + 0.02) : pct(1 - lm.x + 0.02);
    label(`${prefix} ${angle.toFixed(1)}°`, xExpr, yExpr, color, side);
  };

  jointLabel(23, "Han.", bilateral.left.hipAngle, LEFT_COLOR, "left");
  jointLabel(24, "Han.", bilateral.right.hipAngle, RIGHT_COLOR, "right");
  jointLabel(25, "Gen.", bilateral.left.kneeAngle, LEFT_COLOR, "left");
  jointLabel(26, "Gen.", bilateral.right.kneeAngle, RIGHT_COLOR, "right");
  jointLabel(27, "Che.", bilateral.left.ankleAngle, LEFT_COLOR, "left", true);
  jointLabel(28, "Che.", bilateral.right.ankleAngle, RIGHT_COLOR, "right", true);

  return (
    `<div class="skeleton-overlay">` +
    `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">` +
    shapes.join("") +
    `</svg>` +
    labels.join("") +
    `</div>`
  );
}
