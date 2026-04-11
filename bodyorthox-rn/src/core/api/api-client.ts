import { loadTokens, saveTokens } from '../auth/token-storage';

export const API_BASE =
  (process.env as any).EXPO_PUBLIC_API_URL ?? 'https://orthogenai.inconnu-elevator.ts.net/api';

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
  const data = await res.json();
  return data.jwt as string;
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
