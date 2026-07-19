import RNShare from "react-native-share";
import { ExportResult } from "./export-service";

function toBase64(value: string): string {
  if (typeof btoa === "function") {
    // btoa attend du latin1 : encode d'abord l'UTF-8.
    return btoa(unescape(encodeURIComponent(value)));
  }
  return global.Buffer.from(value, "utf-8").toString("base64");
}

/**
 * Partage le fichier JSON d'export via le share sheet natif.
 * Data URL base64 : évite d'écrire un fichier temporaire en clair sur disque —
 * react-native-share matérialise lui-même le contenu pour le share sheet.
 */
export async function shareExportFile(
  json: string,
  fileName: string,
): Promise<ExportResult> {
  try {
    await RNShare.open({
      url: `data:application/json;base64,${toBase64(json)}`,
      filename: fileName.replace(/\.json$/i, ""),
      type: "application/json",
      failOnCancel: true,
    });
    return { kind: "exported" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/cancel/i.test(message)) return { kind: "cancelled" };
    return {
      kind: "error",
      message: `Impossible d'exporter les données : ${message || "erreur inconnue."}`,
    };
  }
}
