/**
 * Mock global de react-native-share : le module réel touche les
 * NativeModules à l'import, indisponibles sous Jest. Les tests qui
 * vérifient le partage le re-mockent finement via jest.doMock.
 */
module.exports = {
  __esModule: true,
  default: {
    open: jest.fn().mockResolvedValue({ success: true, message: "" }),
  },
};
