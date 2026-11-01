import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: 'github-pages',
  base: '/lelek-es-nyelv-portfolio/',
  publicDir: '../public',
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  build: {
    outDir: '../dist-github-pages',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(root, 'github-pages/index.html'),
        adatkezeles: resolve(root, 'github-pages/adatkezeles/index.html'),
      },
    },
  },
});
