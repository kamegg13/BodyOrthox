/**
 * Seam de stockage clé/valeur synchrone, injectable.
 *
 * Sur le web, `localStorage` fournit la persistance. Sur natif, le backend
 * AsyncStorage hydraté (`async-storage-backend.ts`) est installé au boot via
 * `setKeyValueStorage` ; avant son installation (ou si elle échoue), le backend
 * par défaut retombe en mémoire. Les consommateurs qui dépendent de valeurs
 * persistées attendent `whenStorageReady()` avant leur première lecture.
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
let ready: Promise<void> = Promise.resolve();

export function getKeyValueStorage(): KeyValueStorage {
  return storage;
}

/** Injecte un backend (persistance native réelle, ou double de test). */
export function setKeyValueStorage(next: KeyValueStorage): void {
  storage = next;
}

/**
 * Signale qu'un backend s'installe de façon asynchrone : `whenStorageReady`
 * ne se résout qu'une fois l'hydratation terminée.
 */
export function setStorageReady(promise: Promise<void>): void {
  ready = promise;
}

/** Résolu quand le backend actif a fini de s'hydrater (immédiat sur web). */
export function whenStorageReady(): Promise<void> {
  return ready;
}

/** Réinitialise le backend par défaut — test seam. */
export function __resetKeyValueStorage(): void {
  storage = createDefaultStorage();
  ready = Promise.resolve();
}
