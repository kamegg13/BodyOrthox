/**
 * Share service interface.
 * Platform-specific implementations are in share-service.native.ts and share-service.web.ts.
 * React Native's module resolver automatically picks the right one.
 */

export type ShareResult =
  | { readonly kind: "shared" }
  | { readonly kind: "cancelled" }
  | { readonly kind: "error"; readonly message: string };

export interface IShareService {
  shareFile(filePath: string, fileName: string): Promise<ShareResult>;
}

/**
 * Share an HTML report as a downloadable/shareable file.
 * This is the default export — platform-specific files override it.
 */
export async function shareReport(
  _htmlContent: string,
  _fileName: string,
): Promise<ShareResult> {
  return { kind: "error", message: "Share not supported on this platform" };
}
