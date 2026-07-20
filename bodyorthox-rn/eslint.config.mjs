// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactNativePlugin from "eslint-plugin-react-native";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

// Codebase existant de ~73k lignes jamais linté (voir chore/dette-technique).
// Sévérité pragmatique : uniquement les règles à fort risque de bug réel sont
// en "error". Le reste (style, dette héritée) est en "warn" pour ne pas
// bloquer la CI aujourd'hui tout en gardant la visibilité sur la dette.
export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "web-dist/**",
      "coverage/**",
      "ios/**",
      "android/**",
      "e2e/**",
      "**/*.d.ts",
      // Configs Node/CJS pures (pas du code applicatif) : `require()` y est
      // idiomatique et un lint dessus n'apporte rien.
      "babel.config.js",
      "metro.config.js",
      "webpack.config.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-native": reactNativePlugin,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        __DEV__: "readonly",
      },
    },
    settings: {
      react: {
        version: "19.0.0",
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,

      // Hooks : violation des rules-of-hooks est un vrai bug (ordre des
      // hooks, hooks conditionnels) → error. exhaustive-deps est utile mais
      // bruyant sur du code jamais audité → warn.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // React Native : styles morts détectables de façon fiable → warn
      // (pas error : première passe de lint, pas encore nettoyé).
      "react-native/no-unused-styles": "warn",
      "react-native/no-single-element-style-arrays": "warn",

      // React 19 + JSX runtime automatique : pas besoin d'importer React,
      // et PropTypes est remplacé par TypeScript.
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "warn",
      "react/display-name": "warn",

      // TypeScript : variables/imports inutilisés sont un vrai signal de
      // dette (import mort, code jamais branché) → error, mais tsc
      // (noUnusedLocals/noUnusedParameters) attrape déjà la plupart des cas ;
      // ESLint couvre en plus les destructurations et les args préfixés `_`.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // `any` explicite : dette connue et déjà répandue dans le codebase
      // (specs natifs, JSON tiers, mocks de test) → warn, pas de blocage CI.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-require-imports": "warn",
    },
  },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
        // index.js est le point d'entrée RN : bascule Platform.OS === "web"
        // avec des APIs DOM, et ErrorUtils est un global fourni par le
        // runtime React Native (non déclaré dans `globals`).
        ...globals.browser,
        ErrorUtils: "readonly",
      },
    },
  },
  {
    files: [
      "**/__tests__/**/*.{ts,tsx}",
      "**/*.test.{ts,tsx}",
      "jest.setup.ts",
      "**/__mocks__/**/*.{js,ts,tsx}",
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      // Les tests castent/mockent beaucoup — pas la peine de bloquer dessus.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Doit rester en dernier : neutralise les règles ESLint qui entrent en
  // conflit avec le formatage Prettier (géré séparément via `npm run format`).
  eslintConfigPrettier,
);
