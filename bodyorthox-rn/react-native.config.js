module.exports = {
  dependencies: {
    // Disable autolinking for packages that don't have proper Android support
    // or are web-only
    "@mediapipe/tasks-vision": {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
