global.fetch = jest.fn();

jest.mock('../token-storage', () => ({
  saveTokens: jest.fn(),
  clearTokens: jest.fn(),
  loadTokens: jest.fn().mockResolvedValue(null),
}));

import { ApiAuthService } from '../api-auth-service';
import * as tokenStorage from '../token-storage';

const mockFetch = global.fetch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

test('login saves tokens and returns user', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true, status: 200,
    json: async () => ({
      jwt: 'tok123', refreshToken: 'ref456',
      user: { id: 'u1', email: 'k@test.com', role: 'admin' },
    }),
  });
  const service = new ApiAuthService();
  const result = await service.login('k@test.com', 'pass');
  expect(tokenStorage.saveTokens).toHaveBeenCalledWith({ jwt: 'tok123', refreshToken: 'ref456' });
  expect(result.user.email).toBe('k@test.com');
});

test('logout clears tokens', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
  const service = new ApiAuthService();
  await service.logout();
  expect(tokenStorage.clearTokens).toHaveBeenCalled();
});

test('login rejects a malformed response (missing jwt) without saving tokens', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true, status: 200,
    json: async () => ({
      refreshToken: 'ref456',
      user: { id: 'u1', email: 'k@test.com', role: 'admin' },
    }),
  });
  const service = new ApiAuthService();
  await expect(service.login('k@test.com', 'pass')).rejects.toThrow(/serveur/i);
  expect(tokenStorage.saveTokens).not.toHaveBeenCalled();
});

test('login rejects a response with an invalid user (bad role)', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true, status: 200,
    json: async () => ({
      jwt: 'tok123', refreshToken: 'ref456',
      user: { id: 'u1', email: 'k@test.com', role: 'hacker' },
    }),
  });
  const service = new ApiAuthService();
  await expect(service.login('k@test.com', 'pass')).rejects.toThrow(/serveur/i);
  expect(tokenStorage.saveTokens).not.toHaveBeenCalled();
});

test('getMe returns a validated user on a well-formed response', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true, status: 200,
    json: async () => ({ id: 'u1', email: 'k@test.com', role: 'practitioner' }),
  });
  const service = new ApiAuthService();
  const user = await service.getMe();
  expect(user.email).toBe('k@test.com');
  expect(user.role).toBe('practitioner');
});

test('getMe rejects a malformed response (missing email)', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true, status: 200,
    json: async () => ({ id: 'u1', role: 'admin' }),
  });
  const service = new ApiAuthService();
  await expect(service.getMe()).rejects.toThrow(/serveur/i);
});
