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

/** Hashed names of the two critical-path fonts are only known after bundling, so the preloads are injected from the bundle. */
const fontPreloadPlugin: Plugin = {
  name: 'font-preload',
  transformIndexHtml: {
    order: 'post',
    handler(_html, ctx) {
      const names = Object.keys(ctx.bundle ?? {}).filter((n) =>
        /(?:^|\/)(?:fraunces|figtree)-latin-wght-normal-[^/]+\.woff2$/.test(n),
      );
      return names.map((name) => ({
        tag: 'link',
        attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: `${BASE_PATH}${name}` },
        injectTo: 'head' as const,
      }));
    },
  },
};

const notFoundPage = `<!doctype html>
<html lang="hu">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <meta name="theme-color" content="#203127" />
    <title>Az oldal nem található – Lélek &amp; Nyelv</title>
    <link rel="icon" href="${SITE_URL}favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="${SITE_URL}favicon.ico" sizes="any" />
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f3eee4; color: #203127; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; line-height: 1.6; }
      main { max-width: 32rem; padding: 2rem 1.25rem; }
      h1 { margin: 0 0 0.75rem; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(1.75rem, 6vw, 2.5rem); line-height: 1.15; font-weight: 600; }
      p { margin: 0 0 1.5rem; font-size: 1.125rem; }
      .links { display: flex; flex-wrap: wrap; gap: 0.75rem; }
      a { display: inline-block; padding: 0.7rem 1.25rem; border: 2px solid #a8472c; border-radius: 999px; color: #a8472c; font-weight: 600; text-decoration: none; }
      a.primary { background: #a8472c; color: #f3eee4; }
      a:hover, a:focus-visible { background: #203127; border-color: #203127; color: #f3eee4; }
    </style>
  </head>
  <body>
    <main>
      <h1>Ez az oldal nem található.</h1>
      <p>Lehet, hogy elírtad a címet, vagy az oldal időközben átkerült máshová.</p>
      <div class="links">
        <a class="primary" href="${SITE_URL}">Vissza a főoldalra</a>
        <a href="${SITE_URL}#kapcsolat">Kapcsolat</a>
      </div>
    </main>
  </body>
</html>
`;

const NL = String.fromCharCode(10);

const seoFilesPlugin: Plugin = {
  name: 'seo-files',
  generateBundle() {
    const emit = (fileName: string, source: string) => this.emitFile({ type: 'asset', fileName, source });
    emit('robots.txt', ['User-agent: *', 'Allow: /', '', `Sitemap: ${SITE_URL}sitemap.xml`, ''].join(NL));
    const urls = [SITE_URL, `${SITE_URL}adatkezeles/`];
    emit(
      'sitemap.xml',
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map((u) => `  <url><loc>${u}</loc></url>`),
        '</urlset>',
        '',
      ].join(NL),
    );
    emit('404.html', notFoundPage);
  },
};

export default defineConfig({
  root: 'github-pages',
  base: BASE_PATH,
  publicDir: '../public',
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react(), siteUrlPlugin, fontPreloadPlugin, seoFilesPlugin],
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
