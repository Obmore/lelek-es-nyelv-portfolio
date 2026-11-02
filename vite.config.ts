import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

// Absolute public URL of the site, with a trailing slash. `base` below and
// SITE_URL must change together when moving to a custom domain.
const SITE_URL = 'https://obmore.github.io/lelek-es-nyelv-portfolio/';

const siteUrlPlugin: Plugin = {
  name: 'site-url',
  transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
};

export default defineConfig({
  root: 'github-pages',
  // Keep in sync with SITE_URL (custom domain: base becomes '/').
  base: '/lelek-es-nyelv-portfolio/',
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
