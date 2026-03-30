import { Platform } from "react-native";

export interface ImagePickerResult {
  uri: string;
  base64?: string;
  width: number;
  height: number;
}

/**
 * Opens the device camera to take a photo.
 * On web, this is not available (use WebCamera instead).
 * Returns a file URI that can be displayed in an Image component.
 */
export async function openNativeCamera(): Promise<ImagePickerResult> {
  if (Platform.OS === "web") {
    throw new Error("Native camera not available on web");
  }

  const { launchCamera } = await import("react-native-image-picker");

  const result = await launchCamera({
    mediaType: "photo",
    cameraType: "back",
    quality: 0.9,
    maxWidth: 1920,
    maxHeight: 1920,
    includeBase64: true, // We need base64 for MediaPipe analysis
  });

  if (result.didCancel) {
    throw new Error("cancelled");
  }
  if (result.errorCode) {
    throw new Error(result.errorMessage || `Camera error: ${result.errorCode}`);
  }

  const asset = result.assets?.[0];
  if (!asset?.uri) {
    throw new Error("No photo captured");
  }

  return {
    uri: asset.uri,
    base64: asset.base64 ?? undefined,
    width: asset.width ?? 0,
    height: asset.height ?? 0,
  };
}

/**
 * Opens the device gallery to pick a photo.
 */
export async function openNativeGallery(): Promise<ImagePickerResult> {
  if (Platform.OS === "web") {
    throw new Error("Native gallery not available on web");
  }

  const { launchImageLibrary } = await import("react-native-image-picker");

  const result = await launchImageLibrary({
    mediaType: "photo",
    quality: 0.9,
    maxWidth: 1920,
    maxHeight: 1920,
    includeBase64: true,
  });

  if (result.didCancel) {
    throw new Error("cancelled");
  }
  if (result.errorCode) {
    throw new Error(
      result.errorMessage || `Gallery error: ${result.errorCode}`,
    );
  }

  const asset = result.assets?.[0];
  if (!asset?.uri) {
    throw new Error("No photo selected");
  }

  return {
    uri: asset.uri,
    base64: asset.base64 ?? undefined,
    width: asset.width ?? 0,
    height: asset.height ?? 0,
  };
}

/**
 * Convert an ImagePickerResult to a data URL string
 * compatible with our existing capture flow.
 */
export function imagePickerResultToDataUrl(result: ImagePickerResult): string {
  if (result.base64) {
    return `data:image/jpeg;base64,${result.base64}`;
  }
  // Fallback: return the file URI directly
  // React Native Image component can display file:// URIs
  return result.uri;
}
