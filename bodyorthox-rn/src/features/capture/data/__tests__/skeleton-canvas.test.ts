/**
 * Répartition web/natif du rendu squelette sur l'écran Résultats :
 * - web : squelette incrusté dans l'image (canvas, composeSkeletonImage)
 * - natif : superposition vivante (SkeletonOverlay), le canvas étant indispo
 */
import { Platform } from "react-native";
import { shouldOverlayLiveSkeleton } from "../skeleton-canvas";

describe("shouldOverlayLiveSkeleton", () => {
  it("est vrai sur natif (iOS/Android) — pas de canvas, overlay vivant", () => {
    const spy = jest.replaceProperty(Platform, "OS", "ios");
    expect(shouldOverlayLiveSkeleton()).toBe(true);
    spy.restore();
  });

  it("est faux sur web — le squelette est déjà incrusté dans l'image", () => {
    const spy = jest.replaceProperty(Platform, "OS", "web");
    expect(shouldOverlayLiveSkeleton()).toBe(false);
    spy.restore();
  });
});
