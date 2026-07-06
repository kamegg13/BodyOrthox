/**
 * Backend natif du seam `key-value-storage`, adossé à AsyncStorage.
 *
 * AsyncStorage est asynchrone alors que le seam est synchrone : le backend
 * hydrate donc une copie mémoire au démarrage (getAllKeys + multiGet), sert
 * toutes les lectures depuis cette copie, et propage les écritures vers
 * AsyncStorage en write-through (fire-and-forget, la copie mémoire reste la
 * source de vérité de la session).
 *
 * À installer au boot natif via `installAsyncStorageBackend()` ; les
 * consommateurs qui dépendent des valeurs persistées (onboarding, calibration)
 * attendent `whenStorageReady()` avant leur première lecture.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  KeyValueStorage,
  setKeyValueStorage,
  setStorageReady,
} from "./key-value-storage";

async function hydrate(memory: Map<string, string>): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const values = await Promise.all(
      keys.map((key) => AsyncStorage.getItem(key)),
    );
    keys.forEach((key, i) => {
      const value = values[i];
      if (value != null) memory.set(key, value);
    });
  } catch {
    // Hydratation impossible (stockage corrompu / indisponible) : on démarre
    // vide — les écritures suivantes retenteront la persistance.
  }
}

export function installAsyncStorageBackend(): Promise<void> {
  const memory = new Map<string, string>();

  const backend: KeyValueStorage = {
    getItem(key) {
      return memory.has(key) ? (memory.get(key) as string) : null;
    },
    setItem(key, value) {
      memory.set(key, value);
      AsyncStorage.setItem(key, value).catch(() => {
        // Écriture différée perdue : la valeur reste valable pour la session.
      });
    },
    removeItem(key) {
      memory.delete(key);
      AsyncStorage.removeItem(key).catch(() => {
        // Suppression différée perdue : la clé reste absente pour la session.
      });
    },
  };

  const ready = hydrate(memory).then(() => {
    setKeyValueStorage(backend);
  });
  setStorageReady(ready);
  return ready;
}
