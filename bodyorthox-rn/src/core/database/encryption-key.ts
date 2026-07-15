/**
 * Clé de chiffrement SQLCipher de la base patient on-device.
 *
 * Générée aléatoirement au premier lancement (32 octets → 64 hex) puis
 * stockée dans le Keychain iOS / Keystore Android via react-native-keychain.
 * Elle n'est JAMAIS régénérée si elle existe : une nouvelle clé rendrait la
 * base existante illisible (perte définitive des données patient).
 */
import "react-native-get-random-values";
import * as Keychain from "react-native-keychain";

export const ENCRYPTION_KEY_SERVICE = "com.bodyorthox.db-encryption-key";

const KEY_BYTES = 32;

function generateKeyHex(): string {
  const bytes = new Uint8Array(KEY_BYTES);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getOrCreateEncryptionKey(): Promise<string> {
  const existing = await Keychain.getGenericPassword({
    service: ENCRYPTION_KEY_SERVICE,
  });
  if (existing && existing.password) {
    return existing.password;
  }

  const key = generateKeyHex();
  await Keychain.setGenericPassword("bodyorthox-db", key, {
    service: ENCRYPTION_KEY_SERVICE,
    // AFTER_FIRST_UNLOCK (sans THIS_DEVICE_ONLY) : la clé est sauvegardée et
    // restaurée avec l'appareil — sinon la base restaurée serait illisible
    // après une migration de téléphone (perte des données patient).
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
  });
  return key;
}
