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
