import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'github-pages',
  base: '/lelek-es-nyelv-portfolio/',
  publicDir: '../public',
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  build: {
    outDir: '../dist-github-pages',
    emptyOutDir: true,
  },
});
