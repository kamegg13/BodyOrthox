import { Image, Platform } from "react-native";

export interface NaturalDimensions {
  readonly width: number;
  readonly height: number;
}

export interface DisplayedImageLayout {
  readonly displayedWidth: number;
  readonly displayedHeight: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

/**
 * Get the natural (intrinsic) pixel dimensions of an image from its URI.
 * Works on both web and native platforms.
 */
export function getNaturalImageSize(uri: string): Promise<NaturalDimensions> {
  if (Platform.OS === "web") {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () =>
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error(`Failed to load image: ${uri}`));
      img.src = uri;
    });
  }

  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error),
    );
  });
}

/**
 * Calculate the actual displayed dimensions and letterbox offsets
 * for an image rendered with resizeMode="contain" inside a container.
 */
export function calculateContainLayout(
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): DisplayedImageLayout {
  if (naturalWidth === 0 || naturalHeight === 0) {
    return {
      displayedWidth: containerWidth,
      displayedHeight: containerHeight,
      offsetX: 0,
      offsetY: 0,
    };
  }

  const imageAspect = naturalWidth / naturalHeight;
  const containerAspect = containerWidth / containerHeight;

  if (imageAspect > containerAspect) {
    // Image is wider than container — fits width, letterbox top/bottom
    const displayedWidth = containerWidth;
    const displayedHeight = containerWidth / imageAspect;
    return {
      displayedWidth,
      displayedHeight,
      offsetX: 0,
      offsetY: (containerHeight - displayedHeight) / 2,
    };
  }

  // Image is taller than container — fits height, letterbox left/right
  const displayedHeight = containerHeight;
  const displayedWidth = containerHeight * imageAspect;
  return {
    displayedWidth,
    displayedHeight,
    offsetX: (containerWidth - displayedWidth) / 2,
    offsetY: 0,
  };
}
