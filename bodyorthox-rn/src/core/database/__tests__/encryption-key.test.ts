/**
 * Clé de chiffrement SQLCipher — générée au premier lancement, stockée dans
 * le Keychain (iOS) / Keystore (Android) via react-native-keychain. La clé ne
 * doit jamais être régénérée si elle existe déjà (sinon la base devient
 * illisible = perte définitive des données patient).
 */
import * as Keychain from "react-native-keychain";
import {
  ENCRYPTION_KEY_SERVICE,
  getOrCreateEncryptionKey,
} from "../encryption-key";

const mockedGet = jest.mocked(Keychain.getGenericPassword);
const mockedSet = jest.mocked(Keychain.setGenericPassword);

describe("getOrCreateEncryptionKey", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retourne la clé existante du Keychain sans la régénérer", async () => {
    mockedGet.mockResolvedValueOnce({
      username: "bodyorthox-db",
      password: "clef-existante",
      service: ENCRYPTION_KEY_SERVICE,
      storage: "keychain",
    } as Awaited<ReturnType<typeof Keychain.getGenericPassword>>);

    const key = await getOrCreateEncryptionKey();

    expect(key).toBe("clef-existante");
    expect(mockedSet).not.toHaveBeenCalled();
  });

  it("génère une clé hex de 64 caractères et la stocke quand absente", async () => {
    mockedGet.mockResolvedValueOnce(false);

    const key = await getOrCreateEncryptionKey();

    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(mockedSet).toHaveBeenCalledWith(
      "bodyorthox-db",
      key,
      expect.objectContaining({ service: ENCRYPTION_KEY_SERVICE }),
    );
  });

  it("interroge le Keychain sur le service dédié à la clé de base", async () => {
    mockedGet.mockResolvedValueOnce(false);

    await getOrCreateEncryptionKey();

    expect(mockedGet).toHaveBeenCalledWith(
      expect.objectContaining({ service: ENCRYPTION_KEY_SERVICE }),
    );
  });
});
