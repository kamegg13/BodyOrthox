module.exports = {
  dependencies: {
    // Web-only — no native code
    "@mediapipe/tasks-vision": {
      platforms: { android: null, ios: null },
    },
    // Disable native modules that may crash on startup
    // These are used on web via .web.ts platform files
    // On Android, they need proper native configuration first
    "react-native-vision-camera": {
      platforms: { android: null },
    },
    "react-native-biometrics": {
      platforms: { android: null },
    },
    "react-native-sqlite-storage": {
      platforms: { android: null },
    },
  },
};
