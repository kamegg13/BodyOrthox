/**
 * Web stub for native image picker.
 * On web, camera is handled by WebCamera component and gallery by PhotoUpload.
 * These functions should never be called on web.
 */

export interface ImagePickerResult {
  uri: string;
  base64?: string;
  width: number;
  height: number;
}

export async function openNativeCamera(): Promise<ImagePickerResult> {
  throw new Error("Native camera not available on web");
}

export async function openNativeGallery(): Promise<ImagePickerResult> {
  throw new Error("Native gallery not available on web");
}

export function imagePickerResultToDataUrl(result: ImagePickerResult): string {
  if (result.base64) {
    return `data:image/jpeg;base64,${result.base64}`;
  }
  return result.uri;
}
