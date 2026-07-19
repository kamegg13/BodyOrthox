import { ExportResult } from "./export-service";

/** Télécharge le fichier JSON d'export via un lien Blob (web). */
export async function shareExportFile(
  json: string,
  fileName: string,
): Promise<ExportResult> {
  try {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { kind: "exported" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "erreur inconnue.";
    return {
      kind: "error",
      message: `Impossible d'exporter les données : ${message}`,
    };
  }
}
