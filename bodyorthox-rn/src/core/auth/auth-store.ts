import { create } from 'zustand';
import { ApiAuthService } from './api-auth-service';
import { loadTokens, clearTokens } from './token-storage';
import type { AuthUser } from './auth-service';

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
    try {
      const tokens = await loadTokens();
      if (!tokens?.jwt) {
        set({ isAuthenticated: false, isLoading: false, user: null });
        return;
      }
      const user = await authService.getMe();
      set({ isAuthenticated: true, isLoading: false, user });
    } catch {
      await clearTokens();
      set({ isAuthenticated: false, isLoading: false, user: null });
    }
  },

  login: async (email, password) => {
    const { user } = await authService.login(email, password);
    set({ isAuthenticated: true, user });
    // Fire-and-forget migration (ne bloque pas le login)
    import('../../features/patients/data/migration').then(({ migrateLocalPatients }) => {
      migrateLocalPatients();
    }).catch(() => { /* ignore */ });
  },

  logout: async () => {
    await authService.logout();
    set({ isAuthenticated: false, user: null });
  },
}));
