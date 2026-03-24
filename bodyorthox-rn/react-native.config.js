module.exports = {
  dependencies: {
    // Disable autolinking for packages that are web-only or
    // have native compatibility issues with RN 0.79
    "@mediapipe/tasks-vision": {
      platforms: { android: null, ios: null },
    },
    // react-native-reanimated 3.16.x has C++ incompatibility with RN 0.79
    // Layout animations will not work on Android but basic animations will
    "react-native-reanimated": {
      platforms: { android: null },
    },
    // react-native-vision-camera needs native camera - disable for web-first builds
    "react-native-vision-camera": {
      platforms: { android: null, ios: null },
    },
    // react-native-svg has optional native - use web fallback
    "react-native-svg": {
      platforms: { android: null },
    },
  },
};
