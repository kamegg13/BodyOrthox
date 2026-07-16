/**
 * Résilience de session (2026-07-15) — mode on-device pur, compte optionnel.
 *
 * Au démarrage, une session locale valide ne doit JAMAIS être effacée sur une
 * simple panne réseau : l'app reste utilisable hors-ligne sur ses données
 * locales. Seul un 401 réel (token révoqué, après échec du refresh) déconnecte.
 * Le dernier profil connu est mis en cache pour l'affichage hors-ligne.
 */
import { ApiError } from "../../api/api-client";
import {
  __resetKeyValueStorage,
  getKeyValueStorage,
} from "../../storage/key-value-storage";
import type { AuthUser } from "../auth-service";

// Les fns sont définies DANS la factory (le store fait `new ApiAuthService()`
// au chargement du module, avant que d'éventuels `const` du test soient
// initialisés — piège de hoisting). On les récupère ensuite via `__mock`.
jest.mock("../api-auth-service", () => {
  const getMe = jest.fn();
  const login = jest.fn();
  const logout = jest.fn();
  const ApiAuthService = jest.fn(() => ({ getMe, login, logout }));
  (ApiAuthService as unknown as { __mock: unknown }).__mock = {
    getMe,
    login,
    logout,
  };
  return { ApiAuthService };
});

jest.mock("../token-storage", () => {
  const loadTokens = jest.fn();
  const clearTokens = jest.fn();
  return {
    loadTokens,
    clearTokens,
    __mock: { loadTokens, clearTokens },
  };
});

import { ApiAuthService } from "../api-auth-service";
import * as tokenStorage from "../token-storage";
import { useAuthStore, CACHED_USER_KEY } from "../auth-store";

const { getMe: mockGetMe, login: mockLogin, logout: mockLogout } = (
  ApiAuthService as unknown as {
    __mock: { getMe: jest.Mock; login: jest.Mock; logout: jest.Mock };
  }
).__mock;
const { loadTokens: mockLoadTokens, clearTokens: mockClearTokens } = (
  tokenStorage as unknown as {
    __mock: { loadTokens: jest.Mock; clearTokens: jest.Mock };
  }
).__mock;

const USER: AuthUser = {
  id: "u1",
  email: "ortho@antidotesport.local",
  role: "practitioner",
  firstName: "Jean",
};

function resetStore() {
  useAuthStore.setState({ isAuthenticated: false, isLoading: true, user: null });
}

describe("auth-store — résilience de session", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetKeyValueStorage();
    resetStore();
    mockClearTokens.mockResolvedValue(undefined);
    mockLogout.mockResolvedValue(undefined);
  });

  it("sans token stocké → non authentifié", async () => {
    mockLoadTokens.mockResolvedValue(null);

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(mockGetMe).not.toHaveBeenCalled();
  });

  it("token + getMe OK → authentifié et profil mis en cache", async () => {
    mockLoadTokens.mockResolvedValue({ jwt: "j", refreshToken: "r" });
    mockGetMe.mockResolvedValue(USER);

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(USER);
    expect(getKeyValueStorage().getItem(CACHED_USER_KEY)).toBe(
      JSON.stringify(USER),
    );
  });

  it("token + panne réseau → RESTE authentifié (hors-ligne), token conservé, profil caché affiché", async () => {
    getKeyValueStorage().setItem(CACHED_USER_KEY, JSON.stringify(USER));
    mockLoadTokens.mockResolvedValue({ jwt: "j", refreshToken: "r" });
    // Erreur réseau : fetch throw un TypeError, PAS une ApiError.
    mockGetMe.mockRejectedValue(new TypeError("Network request failed"));

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(USER);
    expect(mockClearTokens).not.toHaveBeenCalled();
  });

  it("token + 401 réel → déconnecté, token et cache effacés", async () => {
    getKeyValueStorage().setItem(CACHED_USER_KEY, JSON.stringify(USER));
    mockLoadTokens.mockResolvedValue({ jwt: "j", refreshToken: "r" });
    mockGetMe.mockRejectedValue(new ApiError(401, "Session expired"));

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(mockClearTokens).toHaveBeenCalledTimes(1);
    expect(getKeyValueStorage().getItem(CACHED_USER_KEY)).toBeNull();
  });

  it("login met le profil en cache", async () => {
    mockLogin.mockResolvedValue({ user: USER });

    await useAuthStore.getState().login("ortho@antidotesport.local", "pw");

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(getKeyValueStorage().getItem(CACHED_USER_KEY)).toBe(
      JSON.stringify(USER),
    );
  });

  it("logout efface le cache du profil", async () => {
    getKeyValueStorage().setItem(CACHED_USER_KEY, JSON.stringify(USER));

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(getKeyValueStorage().getItem(CACHED_USER_KEY)).toBeNull();
  });
});
