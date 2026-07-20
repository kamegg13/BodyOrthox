module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    'react-native-worklets/plugin',
    [
      'module-resolver',
      {
        root: ['./'],
        alias: { '@': './src' },
      },
    ],
  ],
};
