import {
  getKeyValueStorage,
  setKeyValueStorage,
  __resetKeyValueStorage,
  type KeyValueStorage,
} from "../key-value-storage";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, "localStorage", { value: localStorageMock });

describe("key-value-storage", () => {
  beforeEach(() => {
    localStorageMock.clear();
    __resetKeyValueStorage();
  });

  it("round-trips through localStorage on the default backend", () => {
    getKeyValueStorage().setItem("k", "v");
    expect(localStorageMock.getItem("k")).toBe("v");
    expect(getKeyValueStorage().getItem("k")).toBe("v");
    getKeyValueStorage().removeItem("k");
    expect(getKeyValueStorage().getItem("k")).toBeNull();
  });

  it("routes reads and writes through an injected backend", () => {
    const backing = new Map<string, string>();
    const injected: KeyValueStorage = {
      getItem: (key) => backing.get(key) ?? null,
      setItem: (key, value) => backing.set(key, value),
      removeItem: (key) => backing.delete(key),
    };
    setKeyValueStorage(injected);

    getKeyValueStorage().setItem("token", "abc");

    // Écrit dans le backend injecté, pas dans localStorage.
    expect(backing.get("token")).toBe("abc");
    expect(localStorageMock.getItem("token")).toBeNull();
    expect(getKeyValueStorage().getItem("token")).toBe("abc");
  });
});
