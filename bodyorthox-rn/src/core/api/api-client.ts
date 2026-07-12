import { Platform } from 'react-native';
import { loadTokens, saveTokens } from '../auth/token-storage';
import { parseRefreshedJwt } from '../auth/auth-response-guards';

/**
 * En build debug natif (__DEV__), l'app cible l'API locale de dev — le
 * simulateur iOS partage le loopback de l'hôte, l'émulateur Android l'expose
 * via 10.0.2.2 (lancer l'API : orthopedist_gen_ai-deployment/services/
 * bodyorthox-api, `npm run dev`, port 3002, sans préfixe /api).
 * Les builds release et le web (EXPO_PUBLIC_API_URL injecté par webpack)
 * gardent l'API distante. Device physique en dev : passer par
 * EXPO_PUBLIC_API_URL n'est pas injecté en natif — pointer ici l'IP LAN
 * du Mac si besoin.
 */
const DEV_NATIVE_API_BASE = Platform.select({
  android: 'http://10.0.2.2:3002',
  default: 'http://127.0.0.1:3002',
});

export const API_BASE =
  (process.env as any).EXPO_PUBLIC_API_URL ??
  (__DEV__ && Platform.OS !== 'web'
    ? DEV_NATIVE_API_BASE
    : 'https://orthogenai.inconnu-elevator.ts.net/api');

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

let pendingRefresh: Promise<string> | null = null;

async function doRefresh(refreshToken: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new ApiError(res.status, 'Session expired');
  return parseRefreshedJwt(await res.json());
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const tokens = await loadTokens();

  const doFetch = async (jwt: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    };
    if (jwt) headers['Authorization'] = `Bearer ${jwt}`;
    return fetch(`${API_BASE}${path}`, { ...options, headers });
  };

  let res = await doFetch(tokens?.jwt ?? null);

  if (res.status === 401 && tokens?.refreshToken) {
    if (!pendingRefresh) {
      pendingRefresh = doRefresh(tokens.refreshToken).finally(() => { pendingRefresh = null; });
    }
    try {
      const newJwt = await pendingRefresh;
      await saveTokens({ jwt: newJwt, refreshToken: tokens.refreshToken });
      res = await doFetch(newJwt);
    } catch {
      throw new ApiError(401, 'Session expired');
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (body as any).error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
