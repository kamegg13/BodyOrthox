module.exports = {
  dependencies: {
    // Web-only package — no native code
    "@mediapipe/tasks-vision": {
      platforms: { android: null, ios: null },
    },
  },
};
