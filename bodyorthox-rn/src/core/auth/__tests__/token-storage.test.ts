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

test('saveTokens throws an explicit error when the Keychain write fails', async () => {
  const Keychain = require('react-native-keychain');
  Keychain.setGenericPassword.mockRejectedValueOnce(new Error('keychain locked'));
  await expect(saveTokens({ jwt: 'abc', refreshToken: 'xyz' })).rejects.toThrow(
    /session/i,
  );
});

test('loadTokens returns null when the Keychain read fails', async () => {
  const Keychain = require('react-native-keychain');
  Keychain.getGenericPassword.mockRejectedValueOnce(new Error('keychain locked'));
  const tokens = await loadTokens();
  expect(tokens).toBeNull();
});

test('clearTokens throws an explicit error when the Keychain reset fails', async () => {
  const Keychain = require('react-native-keychain');
  Keychain.resetGenericPassword.mockRejectedValueOnce(new Error('keychain locked'));
  await expect(clearTokens()).rejects.toThrow(/session/i);
});
