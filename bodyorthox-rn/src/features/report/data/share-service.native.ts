import RNShare from "react-native-share";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import { DownloadResult, ShareResult } from "./share-service";

/** react-native-html-to-pdf attend un nom sans extension. */
function baseFileName(fileName: string): string {
  return fileName.replace(/\.(pdf|html)$/i, "");
}

/**
 * Génère un vrai fichier PDF à partir du HTML du rapport.
 * `directory: "docs"` place le fichier dans un emplacement plus visible
 * (utilisé pour le téléchargement) ; sans option, react-native-html-to-pdf
 * utilise le répertoire cache de l'app (suffisant pour un partage éphémère).
 */
async function generatePdfFile(
  htmlContent: string,
  fileName: string,
  directory?: string,
): Promise<string> {
  const result = await RNHTMLtoPDF.convert({
    html: htmlContent,
    fileName: baseFileName(fileName),
    base64: false,
    ...(directory ? { directory } : {}),
  });
  if (!result.filePath) {
    throw new Error("La génération du PDF a échoué.");
  }
  return result.filePath;
}

function toFileUrl(filePath: string): string {
  return filePath.startsWith("file://") ? filePath : `file://${filePath}`;
}

/**
 * Partage le rapport via le share sheet natif sous forme de vrai fichier PDF
 * (jamais le HTML brut).
 *
 * On passe par react-native-share et non par Share de react-native core :
 * l'API core ignore `url` sur Android (iOS uniquement), le PDF ne serait
 * jamais joint. react-native-share convertit le file:// en content:// via le
 * FileProvider déclaré dans AndroidManifest.xml (authority
 * `${applicationId}.provider`, chemins dans res/xml/filepaths.xml).
 */
export async function shareReport(
  htmlContent: string,
  fileName: string,
): Promise<ShareResult> {
  let filePath: string;
  try {
    filePath = await generatePdfFile(htmlContent, fileName);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    return {
      kind: "error",
      message: `Impossible de partager le rapport : ${message}`,
    };
  }

  try {
    const result = await RNShare.open({
      url: toFileUrl(filePath),
      type: "application/pdf",
      title: fileName,
      subject: fileName,
      failOnCancel: false,
    });

    if (result.dismissedAction) {
      return { kind: "cancelled" };
    }
    return { kind: "shared" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    return {
      kind: "error",
      message: `Impossible de partager le rapport : ${message}`,
    };
  }
}

/**
 * Génère le PDF et le sauvegarde localement, sans ouvrir de share sheet.
 */
export async function downloadReport(
  htmlContent: string,
  fileName: string,
): Promise<DownloadResult> {
  try {
    const filePath = await generatePdfFile(htmlContent, fileName, "docs");
    return { kind: "downloaded", filePath };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    return {
      kind: "error",
      message: `Impossible d'enregistrer le PDF : ${message}`,
    };
  }
}
