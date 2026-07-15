/**
 * Réglage « verrou biométrique » — opt-in, désactivé par défaut.
 *
 * En mode on-device pur, la protection des données au repos est assurée par le
 * chiffrement SQLCipher. Le verrou biométrique est un cran de confort d'accès
 * supplémentaire, à la main de l'utilisateur (interrupteur dans Réglages).
 * Désactivé par défaut → l'app s'ouvre directement.
 */
import { getKeyValueStorage } from "../storage/key-value-storage";

export const BIOMETRIC_LOCK_KEY = "biometric_lock_enabled";

export function isBiometricLockEnabled(): boolean {
  try {
    return getKeyValueStorage().getItem(BIOMETRIC_LOCK_KEY) === "true";
  } catch {
    return false;
  }
}

export function setBiometricLockEnabled(enabled: boolean): void {
  try {
    getKeyValueStorage().setItem(BIOMETRIC_LOCK_KEY, String(enabled));
  } catch {
    /* best-effort */
  }
}
