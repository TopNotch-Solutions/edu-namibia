// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Node build scripts (facts database generators)
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
