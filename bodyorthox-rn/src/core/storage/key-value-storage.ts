/**
 * Seam de stockage clé/valeur synchrone, injectable.
 *
 * Sur le web, `localStorage` fournit la persistance. Sur natif (Hermes) il n'y a
 * pas de stockage synchrone et AsyncStorage n'est pas câblé : le backend par
 * défaut retombe alors en mémoire uniquement — les données NE survivent PAS à un
 * redémarrage de l'app. Cette limitation est centralisée ici derrière une seule
 * interface pour qu'un vrai backend natif (AsyncStorage/MMKV) puisse être injecté
 * plus tard via `setKeyValueStorage`, sans toucher aux stores qui l'utilisent.
 */

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

/**
 * Backend par défaut : localStorage quand disponible (web), sinon mémoire.
 * La copie mémoire double toujours localStorage afin de dégrader proprement si
 * un accès échoue (quota, mode privé…).
 */
function createDefaultStorage(): KeyValueStorage {
  const memory = new Map<string, string>();
  return {
    getItem(key) {
      try {
        if (hasLocalStorage()) return localStorage.getItem(key);
      } catch {
        // localStorage inaccessible — repli mémoire.
      }
      return memory.has(key) ? (memory.get(key) as string) : null;
    },
    setItem(key, value) {
      memory.set(key, value);
      try {
        if (hasLocalStorage()) localStorage.setItem(key, value);
      } catch {
        // localStorage inaccessible — mémoire uniquement.
      }
    },
    removeItem(key) {
      memory.delete(key);
      try {
        if (hasLocalStorage()) localStorage.removeItem(key);
      } catch {
        // localStorage inaccessible — mémoire uniquement.
      }
    },
  };
}

let storage: KeyValueStorage = createDefaultStorage();

export function getKeyValueStorage(): KeyValueStorage {
  return storage;
}

/** Injecte un backend (persistance native réelle, ou double de test). */
export function setKeyValueStorage(next: KeyValueStorage): void {
  storage = next;
}

/** Réinitialise le backend par défaut — test seam. */
export function __resetKeyValueStorage(): void {
  storage = createDefaultStorage();
}
