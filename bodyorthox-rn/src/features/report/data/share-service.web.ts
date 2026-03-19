import { ShareResult } from "./share-service";

/**
 * Web share implementation.
 * Uses the Web Share API if available, otherwise falls back to blob download.
 */
export async function shareReport(
  htmlContent: string,
  fileName: string,
): Promise<ShareResult> {
  try {
    // Fallback: trigger a download via blob
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName.replace(/\.pdf$/, ".html");
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, 100);

    return { kind: "shared" };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors du telechargement";
    return { kind: "error", message };
  }
}
