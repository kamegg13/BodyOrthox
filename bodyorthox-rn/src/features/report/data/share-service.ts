/**
 * Share service interface.
 * Platform-specific implementations are in share-service.native.ts and share-service.web.ts.
 * React Native's module resolver automatically picks the right one.
 */

export type ShareResult =
  | { readonly kind: "shared" }
  | { readonly kind: "cancelled" }
  | { readonly kind: "error"; readonly message: string };

export type DownloadResult =
  | { readonly kind: "downloaded"; readonly filePath: string }
  | { readonly kind: "error"; readonly message: string };

/**
 * Share an HTML report as a real PDF file via the OS share sheet.
 * This is the default export — platform-specific files override it.
 */
export async function shareReport(
  _htmlContent: string,
  _fileName: string,
): Promise<ShareResult> {
  return {
    kind: "error",
    message: "Le partage n'est pas pris en charge sur cette plateforme.",
  };
}

/**
 * Save the report locally as a file, without opening a share sheet.
 * This is the default export — platform-specific files override it.
 */
export async function downloadReport(
  _htmlContent: string,
  _fileName: string,
): Promise<DownloadResult> {
  return {
    kind: "error",
    message: "Le téléchargement n'est pas pris en charge sur cette plateforme.",
  };
}
