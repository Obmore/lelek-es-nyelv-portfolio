// Single source of truth for the public site URL. Used by vite.config.ts
// (the %SITE_URL% token in the HTML heads and `base`) and by
// scripts/verify-content.mjs. For a custom domain change only this line.

/** Absolute public URL of the site, with a trailing slash. */
export const SITE_URL = 'https://lelekesnyelv.hu/';

/** Path part of SITE_URL, used as the Vite `base`. */
export const BASE_PATH = new URL(SITE_URL).pathname;
