/**
 * Export service interface.
 * Platform-specific implementations are in export-service.native.ts and
 * export-service.web.ts — React Native's module resolver picks the right one.
 */

export type ExportResult =
  | { readonly kind: "exported" }
  | { readonly kind: "cancelled" }
  | { readonly kind: "error"; readonly message: string };

/** Partage/télécharge le fichier JSON d'export (art. 20 RGPD). */
export async function shareExportFile(
  _json: string,
  _fileName: string,
): Promise<ExportResult> {
  return {
    kind: "error",
    message: "L'export n'est pas pris en charge sur cette plateforme.",
  };
}
