import { ShareResult } from "./share-service";

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
