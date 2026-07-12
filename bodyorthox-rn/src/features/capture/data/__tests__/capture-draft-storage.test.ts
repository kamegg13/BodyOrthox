import {
  setKeyValueStorage,
  __resetKeyValueStorage,
  type KeyValueStorage,
} from "../../../../core/storage/key-value-storage";
import {
  saveCaptureDraft,
  loadCaptureDraft,
  clearCaptureDraft,
} from "../capture-draft-storage";

function createMemoryStorage(): KeyValueStorage {
  const backing = new Map<string, string>();
  return {
    getItem: (key) => backing.get(key) ?? null,
    setItem: (key, value) => backing.set(key, value),
    removeItem: (key) => backing.delete(key),
  };
}

describe("capture-draft-storage", () => {
  beforeEach(() => {
    __resetKeyValueStorage();
    setKeyValueStorage(createMemoryStorage());
  });

  it("sauvegarde puis relit un brouillon pour un patient", () => {
    saveCaptureDraft("patient-1", "data:image/png;base64,xxx");
    const draft = loadCaptureDraft("patient-1");
    expect(draft?.previewUrl).toBe("data:image/png;base64,xxx");
    expect(draft?.savedAt).toEqual(expect.any(String));
  });

  it("renvoie null quand aucun brouillon n'existe pour ce patient", () => {
    expect(loadCaptureDraft("patient-unknown")).toBeNull();
  });

  it("isole les brouillons par patient", () => {
    saveCaptureDraft("patient-1", "data:image/png;base64,aaa");
    saveCaptureDraft("patient-2", "data:image/png;base64,bbb");
    expect(loadCaptureDraft("patient-1")?.previewUrl).toBe(
      "data:image/png;base64,aaa",
    );
    expect(loadCaptureDraft("patient-2")?.previewUrl).toBe(
      "data:image/png;base64,bbb",
    );
  });

  it("purge le brouillon d'un patient", () => {
    saveCaptureDraft("patient-1", "data:image/png;base64,xxx");
    clearCaptureDraft("patient-1");
    expect(loadCaptureDraft("patient-1")).toBeNull();
  });

  it("ne lève pas si l'écriture échoue (quota dépassé)", () => {
    setKeyValueStorage({
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => undefined,
    });
    expect(() =>
      saveCaptureDraft("patient-1", "data:image/png;base64,xxx"),
    ).not.toThrow();
  });

  it("renvoie null (sans lever) si la lecture échoue ou si le contenu est invalide", () => {
    setKeyValueStorage({
      getItem: () => "{ not valid json",
      setItem: () => undefined,
      removeItem: () => undefined,
    });
    expect(loadCaptureDraft("patient-1")).toBeNull();
  });

  it("ne lève pas si la purge échoue", () => {
    setKeyValueStorage({
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => {
        throw new Error("boom");
      },
    });
    expect(() => clearCaptureDraft("patient-1")).not.toThrow();
  });
});
