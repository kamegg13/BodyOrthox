import { DownloadResult, ShareResult } from "./share-service";

export async function shareReport(
  htmlContent: string,
  _fileName: string,
): Promise<ShareResult> {
  try {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (!printWindow) {
      URL.revokeObjectURL(url);
      return {
        kind: "error",
        message:
          "Impossible d'ouvrir une fenêtre — autorisez les popups pour ce site.",
      };
    }

    // `print()` + révocation ne doivent s'exécuter qu'une seule fois. Le `load`
    // peut avoir déjà été émis avant l'attachement (race) : on couvre ce cas
    // avec un timeout de secours. La révocation est ainsi toujours garantie.
    let finished = false;
    const finalize = () => {
      if (finished) return;
      finished = true;
      try {
        printWindow.print();
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    // Attaché de façon synchrone, immédiatement après l'ouverture.
    printWindow.onload = finalize;
    // Secours si `load` a déjà tiré ou ne se déclenche jamais.
    setTimeout(finalize, 1500);

    return { kind: "shared" };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors de l'export PDF";
    return { kind: "error", message };
  }
}

/**
 * Télécharge réellement le rapport via un lien `a[download]`.
 * Aucun moteur de génération PDF n'est disponible côté web : le fichier
 * produit est le HTML stylé du rapport, nommé `.html` pour rester honnête
 * sur son contenu (le bouton qui déclenche cet appel s'appelle « Télécharger
 * PDF » côté UI — voir le rapport de livraison pour ce compromis).
 */
export async function downloadReport(
  htmlContent: string,
  fileName: string,
): Promise<DownloadResult> {
  try {
    const downloadName = `${fileName.replace(/\.(pdf|html)$/i, "")}.html`;
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return { kind: "downloaded", filePath: downloadName };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Erreur lors du téléchargement du rapport.";
    return { kind: "error", message };
  }
}
