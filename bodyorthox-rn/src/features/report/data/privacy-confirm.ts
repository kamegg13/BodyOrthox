import { Alert, Platform } from "react-native";

const PRIVACY_TITLE = "Confidentialité";
const PRIVACY_MESSAGE =
  "Ce rapport contient des données de santé. Vérifiez le destinataire.";

/**
 * Avertissement de confidentialité affiché avant l'ouverture d'un share
 * sheet (partage ou envoi). Résout `true` si l'utilisateur choisit de
 * continuer, `false` s'il annule.
 */
export function confirmPrivacyBeforeShare(): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(
      (globalThis as any).window.confirm(`${PRIVACY_TITLE}\n\n${PRIVACY_MESSAGE}`),
    );
  }

  return new Promise((resolve) => {
    Alert.alert(
      PRIVACY_TITLE,
      PRIVACY_MESSAGE,
      [
        { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
        { text: "Continuer", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
