// Increase default timeout for React 19 async batching
jest.setTimeout(15000);

// Mock react-native-keychain
jest.mock("react-native-keychain", () => ({
  setGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue({ password: "mock-key" }),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
  ACCESSIBLE: {
    AFTER_FIRST_UNLOCK: "AccessibleAfterFirstUnlock",
    WHEN_UNLOCKED: "AccessibleWhenUnlocked",
  },
}));

// Mock op-sqlite (module natif absent sous Jest). Base vierge par défaut
// (user_version 0) ; les suites database re-mockent finement.
jest.mock("@op-engineering/op-sqlite", () => ({
  open: jest.fn(() => ({
    execute: jest.fn(async (sql: string) => {
      if (/^PRAGMA user_version$/i.test(sql.trim())) {
        return { rows: [{ user_version: 0 }], rowsAffected: 0 };
      }
      return { rows: [], rowsAffected: 0 };
    }),
    close: jest.fn(),
  })),
}));

// Polyfill natif de crypto.getRandomValues — inutile sous Node (déjà global).
jest.mock("react-native-get-random-values", () => ({}));

// Mock react-native-biometrics
jest.mock("react-native-biometrics", () => {
  return jest.fn().mockImplementation(() => ({
    isSensorAvailable: jest.fn().mockResolvedValue({ available: false }),
    simplePrompt: jest.fn().mockResolvedValue({ success: false }),
  }));
});

// Mock du TurboModule PoseLandmarker (pas de runtime natif sous jest).
// Comportement par défaut : aucune pose détectée ; les suites qui testent la
// détection le re-mockent explicitement avec des landmarks.
jest.mock("./src/specs/NativePoseLandmarker", () => ({
  __esModule: true,
  default: {
    detectFromImage: jest
      .fn()
      .mockResolvedValue({ landmarks: [], width: 0, height: 0 }),
    dispose: jest.fn(),
  },
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

// Mock react-native-image-picker
jest.mock("react-native-image-picker", () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
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
