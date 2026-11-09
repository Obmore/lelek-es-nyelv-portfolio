import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist/**', '.wrangler/**', 'node_modules/**']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.mjs', '**/*.ts'],
    languageOptions: { globals: globals.node },
  },
]);
