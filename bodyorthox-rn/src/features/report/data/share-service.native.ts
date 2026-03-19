import { Share, Platform } from "react-native";
import { ShareResult } from "./share-service";

/**
 * Native share implementation using React Native's Share API.
 * On iOS: uses UIActivityViewController
 * On Android: uses Intent.ACTION_SEND
 */
export async function shareReport(
  htmlContent: string,
  fileName: string,
): Promise<ShareResult> {
  try {
    const result = await Share.share(
      {
        title: fileName,
        message: htmlContent,
        ...(Platform.OS === "ios" ? { url: undefined } : {}),
      },
      {
        subject: fileName,
        dialogTitle: `Partager ${fileName}`,
      },
    );

    if (result.action === Share.sharedAction) {
      return { kind: "shared" };
    }
    if (result.action === Share.dismissedAction) {
      return { kind: "cancelled" };
    }
    return { kind: "shared" };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors du partage";
    return { kind: "error", message };
  }
}
