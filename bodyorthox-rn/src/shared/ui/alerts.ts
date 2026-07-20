import { Alert, Platform } from "react-native";

/**
 * `Alert.alert` ne produit aucun effet sur react-native-web : ces wrappers
 * retombent sur `window.alert` / `window.confirm` côté web pour garantir un
 * comportement identique sur les trois plateformes.
 */
export function showAlert(title: string, message: string): void {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export interface ConfirmOptions {
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  /** Style destructif du bouton de confirmation (natif uniquement). */
  readonly destructive?: boolean;
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  options: ConfirmOptions = {},
): void {
  const { confirmLabel = "Confirmer", cancelLabel = "Annuler", destructive = false } = options;

  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: "cancel" },
    {
      text: confirmLabel,
      style: destructive ? "destructive" : "default",
      onPress: onConfirm,
    },
  ]);
}
