import React, { useEffect, useState } from "react";
import { SkeletonOverlay } from "./skeleton-overlay";
import type { PoseLandmarks, BilateralAngles } from "../data/angle-calculator";
import {
  getNaturalImageSize,
  calculateContainLayout,
  type NaturalDimensions,
  type DisplayedImageLayout,
} from "../../../shared/utils/image-dimensions";

interface PhotoSkeletonOverlayProps {
  /** URI de la photo affichée en resizeMode="contain" sous l'overlay. */
  readonly imageUri: string;
  readonly landmarks: PoseLandmarks;
  /** Squelette complet 33 points quand disponible (sinon subset angles). */
  readonly allLandmarks?: PoseLandmarks;
  readonly bilateralAngles?: BilateralAngles;
  readonly containerWidth: number;
  readonly containerHeight: number;
}

/**
 * Superpose le squelette de pose sur une photo affichée en "contain" :
 * résout les dimensions naturelles de l'image pour calculer la zone
 * réellement occupée (letterbox déduit), puis délègue le tracé à
 * SkeletonOverlay. Si les dimensions naturelles sont indisponibles,
 * l'overlay retombe sur les dimensions du conteneur.
 */
export function PhotoSkeletonOverlay({
  imageUri,
  landmarks,
  allLandmarks,
  bilateralAngles,
  containerWidth,
  containerHeight,
}: PhotoSkeletonOverlayProps) {
  const [naturalSize, setNaturalSize] = useState<NaturalDimensions | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    getNaturalImageSize(imageUri)
      .then((size) => {
        if (!cancelled) setNaturalSize(size);
      })
      .catch(() => {
        if (!cancelled) setNaturalSize(null);
      });
    return () => {
      cancelled = true;
    };
  }, [imageUri]);

  if (containerWidth <= 0 || containerHeight <= 0) return null;

  const layout: DisplayedImageLayout = naturalSize
    ? calculateContainLayout(
        containerWidth,
        containerHeight,
        naturalSize.width,
        naturalSize.height,
      )
    : {
        displayedWidth: containerWidth,
        displayedHeight: containerHeight,
        offsetX: 0,
        offsetY: 0,
      };

  return (
    <SkeletonOverlay
      landmarks={landmarks}
      allLandmarks={allLandmarks}
      containerWidth={containerWidth}
      containerHeight={containerHeight}
      displayedWidth={layout.displayedWidth}
      displayedHeight={layout.displayedHeight}
      offsetX={layout.offsetX}
      offsetY={layout.offsetY}
      bilateralAngles={bilateralAngles}
    />
  );
}
