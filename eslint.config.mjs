import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  globalIgnores(['dist-github-pages/**', '.claude/**', '.ui-check/**']),
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['app/**', 'github-pages/**'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['**/*.mjs', 'vite.config.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    // page.evaluate callbacks run in the browser.
    files: ['scripts/make-og-image.mjs', 'scripts/verify-render.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
]);
