import { Platform } from 'react-native';

export interface StoredTokens {
  jwt: string;
  refreshToken: string;
}

const SERVICE = 'bodyorthox-auth';
const SESSION_KEY = 'bodyorthox_auth_tokens';

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(tokens));
    } catch {
      /* ignore */
    }
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Keychain = require('react-native-keychain');
  await Keychain.setGenericPassword('token', JSON.stringify(tokens), { service: SERVICE });
}

export async function loadTokens(): Promise<StoredTokens | null> {
  if (Platform.OS === 'web') {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as StoredTokens) : null;
    } catch {
      return null;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Keychain = require('react-native-keychain');
  const result = await Keychain.getGenericPassword({ service: SERVICE });
  if (!result) return null;
  try {
    return JSON.parse(result.password) as StoredTokens;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Keychain = require('react-native-keychain');
  await Keychain.resetGenericPassword({ service: SERVICE });
}
