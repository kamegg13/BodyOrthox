jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue({
    username: 'token',
    password: '{"jwt":"abc","refreshToken":"xyz"}',
  }),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));

import { saveTokens, loadTokens, clearTokens } from '../token-storage';

test('saveTokens and loadTokens round-trip', async () => {
  await saveTokens({ jwt: 'abc', refreshToken: 'xyz' });
  const tokens = await loadTokens();
  expect(tokens).toEqual({ jwt: 'abc', refreshToken: 'xyz' });
});

test('clearTokens returns null on next load', async () => {
  const Keychain = require('react-native-keychain');
  Keychain.getGenericPassword.mockResolvedValueOnce(false);
  await clearTokens();
  const tokens = await loadTokens();
  expect(tokens).toBeNull();
});
