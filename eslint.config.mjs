import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default defineConfig([
  globalIgnores(['dist-github-pages/**', '.claude/**', '.ui-check/**']),
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    // The rules the former Next preset applied, at the same levels (no full presets).
    files: ['app/**', 'github-pages/**'],
    plugins: { react, 'jsx-a11y': jsxA11y },
    settings: { react: { version: '19.2' } },
    rules: {
      'react/display-name': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-comment-textnodes': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unescaped-entities': 'error',
      'react/require-render-return': 'error',
      'jsx-a11y/alt-text': ['warn', { elements: ['img'], img: ['Image'] }],
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
    },
  },
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
