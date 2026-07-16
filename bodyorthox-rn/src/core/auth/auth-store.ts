import { create } from 'zustand';
import { ApiAuthService } from './api-auth-service';
import { loadTokens, clearTokens } from './token-storage';
import { ApiError } from '../api/api-client';
import { getKeyValueStorage } from '../storage/key-value-storage';
import type { AuthUser } from './auth-service';

/**
 * Dernier profil connu, mis en cache localement pour l'affichage hors-ligne
 * (le token vit dans le trousseau ; le profil, non sensible, dans le stockage
 * clé/valeur). Permet d'entrer immédiatement au démarrage sans attendre le
 * réseau.
 */
export const CACHED_USER_KEY = 'bodyorthox_auth_user';

function cacheUser(user: AuthUser): void {
  try {
    getKeyValueStorage().setItem(CACHED_USER_KEY, JSON.stringify(user));
  } catch {
    /* cache best-effort */
  }
}

function loadCachedUser(): AuthUser | null {
  try {
    const raw = getKeyValueStorage().getItem(CACHED_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function clearCachedUser(): void {
  try {
    getKeyValueStorage().removeItem(CACHED_USER_KEY);
  } catch {
    /* best-effort */
  }
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
}

interface AuthActions {
  initialize(): Promise<void>;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

const authService = new ApiAuthService();

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,

  initialize: async () => {
    set({ isLoading: true });
    const tokens = await loadTokens();
    if (!tokens?.jwt) {
      set({ isAuthenticated: false, isLoading: false, user: null });
      return;
    }

    // Session locale présente : on entre IMMÉDIATEMENT avec le dernier profil
    // connu — l'app est utilisable hors-ligne sur ses données locales sans
    // attendre le serveur. La révalidation ci-dessous est best-effort.
    set({ isAuthenticated: true, isLoading: false, user: loadCachedUser() });

    try {
      const user = await authService.getMe();
      cacheUser(user);
      set({ user });
    } catch (e) {
      // SEUL un 401 réel (token révoqué, après échec du refresh géré par
      // api-client) invalide la session. Une panne réseau ne déconnecte PAS :
      // c'est ce qui rendait l'app inutilisable hors-ligne alors que toutes
      // ses données sont locales.
      if (e instanceof ApiError && e.status === 401) {
        await clearTokens();
        clearCachedUser();
        set({ isAuthenticated: false, user: null });
      }
    }
  },

  login: async (email, password) => {
    const { user } = await authService.login(email, password);
    cacheUser(user);
    set({ isAuthenticated: true, user });
  },

  logout: async () => {
    await authService.logout();
    clearCachedUser();
    set({ isAuthenticated: false, user: null });
  },
}));
