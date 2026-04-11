import { API_BASE, apiRequest } from '../api/api-client';
import { saveTokens, clearTokens } from './token-storage';
import type { IAuthService, AuthUser } from './auth-service';

export class ApiAuthService implements IAuthService {
  async login(email: string, password: string): Promise<{ user: AuthUser }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as any).error ?? 'Login failed');
    }
    const data = await res.json();
    await saveTokens({ jwt: data.jwt, refreshToken: data.refreshToken });
    return { user: data.user as AuthUser };
  }

  async logout(): Promise<void> {
    try { await apiRequest('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    await clearTokens();
  }

  async getMe(): Promise<AuthUser> {
    return apiRequest<AuthUser>('/users/me');
  }
}
