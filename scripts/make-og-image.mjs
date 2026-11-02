// Regenerates public/og-image.png (1200x630) from an inline HTML template.
// Not part of `npm run check` or CI. Usage: node scripts/make-og-image.mjs
// Needs playwright-core and Microsoft Edge: set PLAYWRIGHT_CORE to the
// playwright-core directory, or rely on the global @playwright/cli install.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const coreDir =
  process.env.PLAYWRIGHT_CORE ||
  'C:/Users/bendz/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core';
const { chromium } = createRequire(join(coreDir, 'package.json'))('./index.js');

const font = (pkg, file) =>
  pathToFileURL(join(root, 'node_modules/@fontsource-variable', pkg, 'files', file)).href;

const html = `<!doctype html>
<html lang="hu"><head><meta charset="UTF-8" />
<style>
@font-face { font-family: 'Fraunces'; font-weight: 100 900;
  src: url('${font('fraunces', 'fraunces-latin-wght-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'Figtree'; font-weight: 300 900;
  src: url('${font('figtree', 'figtree-latin-wght-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'Fraunces'; font-weight: 100 900; unicode-range: U+0100-02BA, U+1E00-1EFF;
  src: url('${font('fraunces', 'fraunces-latin-ext-wght-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'Figtree'; font-weight: 300 900; unicode-range: U+0100-02BA, U+1E00-1EFF;
  src: url('${font('figtree', 'figtree-latin-ext-wght-normal.woff2')}') format('woff2'); }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; background: #203127; color: #f3eee4; position: relative; overflow: hidden; }
.bar { position: absolute; left: 0; top: 0; bottom: 0; width: 28px; background: #d77759; }
.disc { position: absolute; right: -150px; bottom: -230px; width: 460px; height: 460px; border-radius: 50%; background: #566455; opacity: .55; }
.disc2 { position: absolute; right: 70px; bottom: 56px; width: 96px; height: 96px; border-radius: 50%; background: #d77759; }
.wrap { position: absolute; left: 100px; top: 0; bottom: 0; right: 100px; display: flex; flex-direction: column; justify-content: center; }
.brand { font-family: 'Figtree'; font-weight: 700; font-size: 38px; letter-spacing: .14em; text-transform: uppercase; color: #f7d9ca; }
h1 { font-family: 'Fraunces'; font-weight: 600; font-size: 112px; line-height: 1.05; margin-top: 22px; color: #fbf8f2; }
.rule { width: 120px; height: 8px; border-radius: 4px; background: #d77759; margin: 34px 0 30px; }
.lead { font-family: 'Figtree'; font-weight: 500; font-size: 40px; line-height: 1.25; color: #f3eee4; white-space: nowrap; }
.place { font-family: 'Figtree'; font-weight: 400; font-size: 34px; margin-top: 22px; color: #aeb8a2; }
</style></head><body>
<div class="bar"></div><div class="disc"></div><div class="disc2"></div>
<div class="wrap">
  <div class="brand">Lélek &amp; Nyelv</div>
  <h1>Juhász Nagy Anna</h1>
  <div class="rule"></div>
  <div class="lead">Mentálhigiénés segítő beszélgetés és angolórák</div>
  <div class="place">Budapest, XI. kerület és online</div>
</div></body></html>`;

const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  // file:// fonts only load from a file:// page, not from setContent (about:blank).
  const tmp = mkdtempSync(join(tmpdir(), 'og-image-'));
  const tmpHtml = join(tmp, 'og-image.html');
  writeFileSync(tmpHtml, html);
  await page.goto(pathToFileURL(tmpHtml).href, { waitUntil: 'load' });
  rmSync(tmp, { recursive: true, force: true });
  await page.evaluate(() => document.fonts.ready);
  const out = join(root, 'public', 'og-image.png');
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log(`wrote ${out}`);
} finally {
  await browser.close();
}
