import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { BASE_PATH, SITE_URL } from './site.config.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));

const siteUrlPlugin: Plugin = {
  name: 'site-url',
  transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
};

export default defineConfig({
  root: 'github-pages',
  base: BASE_PATH,
  publicDir: '../public',
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react(), siteUrlPlugin],
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
