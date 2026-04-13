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
    printWindow.addEventListener("load", () => {
      printWindow.print();
      URL.revokeObjectURL(url);
    });
    return { kind: "shared" };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors de l'export PDF";
    return { kind: "error", message };
  }
}
