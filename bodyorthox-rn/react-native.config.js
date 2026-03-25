module.exports = {
  dependencies: {
    // Web-only — no native code
    "@mediapipe/tasks-vision": {
      platforms: { android: null, ios: null },
    },
    // Disable all non-essential native modules for Android stability
    // The app runs as a web-like experience on Android via Hermes
    "react-native-vision-camera": {
      platforms: { android: null, ios: null },
    },
    "react-native-biometrics": {
      platforms: { android: null, ios: null },
    },
    "react-native-sqlite-storage": {
      platforms: { android: null, ios: null },
    },
    "react-native-keychain": {
      platforms: { android: null, ios: null },
    },
    "react-native-svg": {
      platforms: { android: null },
    },
    "@notifee/react-native": {
      platforms: { android: null, ios: null },
    },
  },
};
