/**
 * Superposition du squelette sur une photo affichée en "contain" :
 * calcule le layout réel de l'image (dimensions naturelles + letterbox)
 * puis délègue le tracé à SkeletonOverlay. Utilisé par l'écran Résultats.
 */
import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { PhotoSkeletonOverlay } from "../photo-skeleton-overlay";
import type { PoseLandmarks } from "../../data/angle-calculator";

const mockGetNaturalImageSize = jest.fn();
jest.mock("../../../../shared/utils/image-dimensions", () => {
  const actual = jest.requireActual("../../../../shared/utils/image-dimensions");
  return {
    ...actual,
    getNaturalImageSize: (uri: string) => mockGetNaturalImageSize(uri),
  };
});

const LANDMARKS: PoseLandmarks = {
  23: { x: 0.4, y: 0.5, z: 0, visibility: 0.95 },
  24: { x: 0.6, y: 0.5, z: 0, visibility: 0.95 },
  25: { x: 0.4, y: 0.7, z: 0, visibility: 0.95 },
  26: { x: 0.6, y: 0.7, z: 0, visibility: 0.95 },
  27: { x: 0.4, y: 0.9, z: 0, visibility: 0.95 },
  28: { x: 0.6, y: 0.9, z: 0, visibility: 0.95 },
};

describe("PhotoSkeletonOverlay", () => {
  beforeEach(() => {
    mockGetNaturalImageSize.mockReset();
    mockGetNaturalImageSize.mockResolvedValue({ width: 300, height: 400 });
  });

  it("rend le squelette une fois les dimensions naturelles connues", async () => {
    const { getByTestId } = render(
      <PhotoSkeletonOverlay
        imageUri="data:image/png;base64,abc"
        landmarks={LANDMARKS}
        containerWidth={330}
        containerHeight={440}
      />,
    );

    await waitFor(() => {
      expect(getByTestId("skeleton-overlay")).toBeTruthy();
    });
    expect(mockGetNaturalImageSize).toHaveBeenCalledWith(
      "data:image/png;base64,abc",
    );
  });

  it("rend quand même le squelette si les dimensions naturelles échouent (fallback conteneur)", async () => {
    mockGetNaturalImageSize.mockRejectedValue(new Error("boom"));

    const { getByTestId } = render(
      <PhotoSkeletonOverlay
        imageUri="file:///photo.jpg"
        landmarks={LANDMARKS}
        containerWidth={330}
        containerHeight={440}
      />,
    );

    await waitFor(() => {
      expect(getByTestId("skeleton-overlay")).toBeTruthy();
    });
  });

  it("ne rend rien tant que le conteneur n'est pas mesuré", () => {
    // Promesse jamais résolue : évite un setState hors act() après le test.
    mockGetNaturalImageSize.mockReturnValue(new Promise(() => {}));
    const { queryByTestId } = render(
      <PhotoSkeletonOverlay
        imageUri="data:image/png;base64,abc"
        landmarks={LANDMARKS}
        containerWidth={0}
        containerHeight={0}
      />,
    );

    expect(queryByTestId("skeleton-overlay")).toBeNull();
  });
});
