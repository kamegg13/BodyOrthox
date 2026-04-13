const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const appDirectory = __dirname;

const compileNodeModules = [
  "react-native-uncompiled",
  "@react-navigation",
  "@react-native",
  "react-native-gesture-handler",
  "react-native-reanimated",
  "react-native-screens",
  "react-native-safe-area-context",
  "react-native-svg",
  "react-native-vision-camera",
  "react-native-web",
].map((moduleName) => path.resolve(appDirectory, "node_modules", moduleName));

const babelLoaderConfiguration = {
  test: /\.[jt]sx?$/,
  include: [
    path.resolve(appDirectory, "index.js"),
    path.resolve(appDirectory, "App.tsx"),
    path.resolve(appDirectory, "src"),
    ...compileNodeModules,
  ],
  use: {
    loader: "babel-loader",
    options: {
      configFile: false,
      cacheDirectory: true,
      presets: [
        [
          "@babel/preset-env",
          {
            targets: { browsers: ["last 2 versions"] },
            modules: false,
          },
        ],
        ["@babel/preset-react", { runtime: "automatic" }],
        "@babel/preset-typescript",
      ],
      plugins: [
        [
          "module-resolver",
          {
            alias: {
              "@": "./src",
              "react-native": "react-native-web",
            },
          },
        ],
      ],
    },
  },
};

const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/,
  type: "asset",
};

module.exports = {
  entry: path.resolve(appDirectory, "index.js"),
  output: {
    filename: "bundle.web.js",
    path: path.resolve(appDirectory, "web-dist"),
    publicPath: "/",
  },
  resolve: {
    extensions: [
      ".web.tsx",
      ".web.ts",
      ".web.js",
      ".tsx",
      ".ts",
      ".js",
      ".jsx",
    ],
    alias: {
      "react-native": "react-native-web",
    },
  },
  module: {
    rules: [
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      babelLoaderConfiguration,
      imageLoaderConfiguration,
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(true),
      process: { env: { EXPO_PUBLIC_API_URL: JSON.stringify('/api') } },
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(appDirectory, "web/index.html"),
    }),
  ],
  devServer: {
    static: {
      directory: path.resolve(appDirectory, "web-dist"),
    },
    port: 8080,
    historyApiFallback: true,
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    },
    proxy: [
      {
        context: ["/api"],
        target: "https://orthogenai.inconnu-elevator.ts.net",
        changeOrigin: true,
        secure: true,
      },
    ],
  },
  mode: "development",
};
