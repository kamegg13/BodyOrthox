// Mock react-native-sqlite-storage
jest.mock("react-native-sqlite-storage", () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn(),
    executeSql: jest.fn(),
    close: jest.fn(),
  })),
  enablePromise: jest.fn(),
  DEBUG: jest.fn(),
}));

// Mock react-native-keychain
jest.mock("react-native-keychain", () => ({
  setGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue({ password: "mock-key" }),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));

// Mock react-native-biometrics
jest.mock("react-native-biometrics", () => {
  return jest.fn().mockImplementation(() => ({
    isSensorAvailable: jest.fn().mockResolvedValue({ available: false }),
    simplePrompt: jest.fn().mockResolvedValue({ success: false }),
  }));
});

// Mock react-native-vision-camera
jest.mock("react-native-vision-camera", () => ({
  Camera: "Camera",
  useCameraDevice: jest.fn(() => ({ id: "mock-device" })),
  useCameraPermission: jest.fn(() => ({
    hasPermission: true,
    requestPermission: jest.fn().mockResolvedValue(true),
  })),
  useFrameProcessor: jest.fn(),
}));

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock @react-navigation/native
jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      replace: jest.fn(),
      push: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      children,
  };
});

// Mock @notifee/react-native
jest.mock("@notifee/react-native", () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
    getNotificationSettings: jest
      .fn()
      .mockResolvedValue({ authorizationStatus: 1 }),
    displayNotification: jest.fn().mockResolvedValue("notif-id"),
    createNotification: jest.fn(),
  },
  AuthorizationStatus: {
    AUTHORIZED: 1,
    PROVISIONAL: 3,
    DENIED: 0,
    NOT_DETERMINED: -1,
  },
}));

// Mock uuid
jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid-1234"),
}));

// Mock @react-navigation/bottom-tabs
jest.mock("@react-navigation/bottom-tabs", () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: () => null,
  }),
}));

// Silence console.warn in tests
global.console.warn = jest.fn();
