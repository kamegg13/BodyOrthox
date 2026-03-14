const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  resolver: {
    platforms: ['ios', 'android', 'native', 'web'],
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json', 'web.js', 'web.ts', 'web.tsx'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
