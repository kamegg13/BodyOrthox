/**
 * Réglage « verrou biométrique » — opt-in, désactivé par défaut.
 *
 * En mode on-device pur, les données sont déjà chiffrées au repos (SQLCipher) :
 * le verrou biométrique est un cran de confort d'accès, pas la protection
 * primaire. L'app s'ouvre donc directement sauf si l'utilisateur l'active.
 */
import {
  __resetKeyValueStorage,
  getKeyValueStorage,
} from "../../storage/key-value-storage";
import {
  BIOMETRIC_LOCK_KEY,
  isBiometricLockEnabled,
  setBiometricLockEnabled,
} from "../biometric-lock-setting";

describe("biometric-lock-setting", () => {
  beforeEach(() => {
    __resetKeyValueStorage();
  });

  it("est désactivé par défaut (rien de stocké)", () => {
    expect(isBiometricLockEnabled()).toBe(false);
  });

  it("reflète l'activation persistée", () => {
    setBiometricLockEnabled(true);
    expect(isBiometricLockEnabled()).toBe(true);
    expect(getKeyValueStorage().getItem(BIOMETRIC_LOCK_KEY)).toBe("true");
  });

  it("revient à désactivé après désactivation", () => {
    setBiometricLockEnabled(true);
    setBiometricLockEnabled(false);
    expect(isBiometricLockEnabled()).toBe(false);
  });

  it("traite toute valeur non « true » comme désactivé", () => {
    getKeyValueStorage().setItem(BIOMETRIC_LOCK_KEY, "1");
    expect(isBiometricLockEnabled()).toBe(false);
  });
});
