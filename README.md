# Lélek & Nyelv portfolio

Static, Hungarian-language portfolio site for a mental hygiene (mentálhigiéné) helper and English teacher. Live at https://lelekesnyelv.hu/ (www.lelekesnyelv.hu redirects there).

## Stack

React 19, TypeScript, Vite 8.3, Tailwind CSS 4. Fonts (Fraunces, Figtree) come from `@fontsource-variable`. The site is a static build deployed to GitHub Pages; the contact form posts to FormSubmit.

## Content

Everything the visitor reads lives in `app/content.ts`: copy, prices, testimonials, links (for example `FACEBOOK_URL`) and the privacy notice and imprint. Edit text there, not in the components.

## Local development

```
npm ci
npm run dev        # http://localhost:5173/
npm run check      # lint (ESLint with typescript-eslint and react-hooks), typecheck, build, content and render checks
npm run preview    # serve the production build
```

## What the checks guard

`npm run check` runs lint, typecheck and the build, then two scripts:

- `scripts/verify-content.mjs`: pinned copy (testimonials, bio), forbidden wording, no em dash in `app/` and `github-pages/` sources, page titles, the privacy page, contact endpoints, and share metadata (canonical, Open Graph, Twitter card, `og-image.png` is 1200x630, no leftover `%SITE_URL%`).
- `scripts/verify-render.mjs`: render checks on the built pages.

## Deploy

A push or merge to `main` runs `.github/workflows/pages.yml`: the checks first, then a GitHub Pages deployment. Pull requests run the "Checks" workflow only.

## Contact form Worker

`worker/contact/` is a Cloudflare Worker (`lelek-urlap`) that will replace FormSubmit as the form backend. It validates a submission on the server and e-mails it to one address through the Cloudflare Email Service `send_email` binding. **The site does not use it yet**: it keeps posting to FormSubmit until a separate switch PR changes `FORM_AJAX_ENDPOINT`.

- **Contract:** `POST /` with a JSON body from the origin `https://lelekesnyelv.hu` (the field names and allowed values live in `worker/contact/src/contract.ts`). Every response is JSON. `200 {"success":true}` (also for a filled honeypot, which sends nothing), `400 invalid` with the offending `field`, `400 invalid_json`, `403 forbidden` (wrong origin, no CORS headers), `405 method`, `413 too_large` (32 KiB cap, enforced while streaming), `415 unsupported_type`, `429 rate_limited`, `502 send_failed`, `504 send_timeout` (the mail may still arrive). `OPTIONS /` answers the CORS preflight and `GET /health` answers `{"ok":true}` without sending.
- **Config (`wrangler.jsonc`):** the `EMAIL` binding is locked to one destination address (the public `CONTACT_EMAIL`), so even a compromised Worker cannot mail anyone else. Two rate limits run before the body is read: `RL_IP` (3 per 60 s per `cf-connecting-ip`) and `RL_GLOBAL` (20 per 60 s). The custom domain is `urlap.lelekesnyelv.hu`, `workers.dev` is off, invocation logs are off, and there is no KV, D1, R2 or Durable Object. The only log line per request carries the outcome, status and duration, never a field value.
- **Checks:** `cd worker/contact && npm ci && npm run check` (lint, typecheck, vitest) and `npm run deploy:dry` (needs no login). The root `npm run check` runs `scripts/verify-worker-contract.mjs`, which fails when the Worker's topics, reply options, field names, consent value, honeypot or destination differ from `app/content.ts`, `app/page.tsx` and `wrangler.jsonc`. CI has a separate `worker` job; `pages.yml` ignores pushes that only touch `worker/**`.
- **Deploy:** either Workers Builds connected to this repository (root directory `worker/contact`, production branch `main`, watch path `worker/contact/**`), or `npx wrangler deploy` from `worker/contact` after the owner's `wrangler login`. Prerequisites in the Cloudflare account: the destination address verified under Email Routing, the sender domain `lelekesnyelv.hu` on Cloudflare DNS with Email Routing enabled. Do one owner-approved real send before the site is switched.
- **Rollback:** until the switch PR is merged nothing depends on the Worker, so removing or breaking it has no effect on the site. After the switch, revert that PR (the site goes back to FormSubmit, which only works if its activation e-mail was clicked) or roll back the Worker version in the Cloudflare dashboard.

## Generated files and icons

`vite.config.ts` emits `robots.txt`, `sitemap.xml` and the branded `404.html` at build time from `SITE_URL` (a domain change stays one line), and injects the two critical-path font preloads with their hashed names. `public/apple-touch-icon.png` (180x180) and `public/favicon.ico` (16 and 32 px) are rasterised from `public/favicon.svg`. The JSON-LD in `github-pages/index.html` repeats the service names and prices from `app/content.ts`; `verify-content.mjs` fails if they drift.

## Share image

The Open Graph image is `public/og-image.png` (1200x630). Regenerate it after changing the name or tagline:

```
node scripts/make-og-image.mjs
```

The script renders an HTML template with the bundled fonts in Microsoft Edge through `playwright-core`. Install it globally or set `PLAYWRIGHT_CORE` to its directory; the script exits with code 2 if it cannot find it. It is not part of `npm run check` or CI. After deploying, re-scrape the URL in the Facebook Sharing Debugger to refresh cached previews.

## Custom domain

The site is served from `https://lelekesnyelv.hu/`. Follow this order for this domain and for any later change. The `SITE_URL` change is merged together with saving the custom domain (step 3), after the verification and DNS steps.

1. Verify the domain for the GitHub account first, before any DNS record points at GitHub Pages: in the account settings (Settings > Pages > Add a domain), add the `_github-pages-challenge-<account>` TXT record GitHub shows at the registrar, and click Verify once the TXT record resolves. GitHub then keeps the domain for this account, so no other account can claim it.
2. DNS at the registrar: four `A` records on the apex (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`), four `AAAA` records (`2606:50c0:8000::153` to `2606:50c0:8003::153`; optional if the registrar has no AAAA), and `www` as a `CNAME` to `obmore.github.io.`. Remove the registrar's default parking records. No wildcard records.
3. When the domain resolves and is verified, enter exactly the apex `lelekesnyelv.hu` (not `www.lelekesnyelv.hu`) as the custom domain in the repository's Settings > Pages, so GitHub redirects `www` to the apex and the canonical URL stays `https://lelekesnyelv.hu/`. In the same minute, merge the `SITE_URL` change in `site.config.mjs` (absolute URL with trailing slash; the Vite `base`, the canonical and Open Graph tags, the favicon links and the verify-content expectations all follow it). Until the new build is live, the old build's asset paths do not resolve on the new domain, so keep the window between saving the domain and finishing the deployment short. The deployment uses GitHub Actions, so no CNAME file is needed.
4. Enforce HTTPS once GitHub has issued the certificate (can take up to an hour).
5. Send one test message from the live form: FormSubmit may ask the recipient to activate the form again for the new domain (its docs do not say).
6. Re-scrape the new URL in the Facebook Sharing Debugger.

## Maintenance

- **Changing copy or prices:** edit `app/content.ts`. Approved texts are deliberately pinned in two scripts, so `npm run check` fails until every pin of the changed string is updated; do that in the same commit. `scripts/verify-content.mjs` checks the built site and pins the testimonials (text, author, label), the three bio paragraphs, the stamp, the prices, the service names, scope and level lines, the FAQ answers about the free intro call, location and exams, the hero fact and lead sentence, the contact promise, the form subject and the consent wording. `scripts/verify-render.mjs` checks the server render and repeats several of these (scope lines, exam and in-person FAQ answers, hero fact, bio paragraphs, stamp and removed sentences) plus structure: card counts, the pricing FAQ answer, the portrait image attributes and the form fields. Search both scripts for the old string before committing.
- **Prices:** `PRICE_MENTAL` and `PRICE_ENGLISH` in `app/content.ts` contain a non-breaking space (U+00A0) between the thousands (`18 000`) and before `Ft`, and the pins build the same text from an `NB` constant. Type it as a real U+00A0 (or copy it from the existing line), never a plain space, or the pin fails. The JSON-LD in `github-pages/index.html` carries the prices as plain numbers (`18000`, `7000`); `verify-content.mjs` fails until they match `app/content.ts`.
- **Adding a testimonial:** add an entry to `testimonials` in `app/content.ts` with the fields `id`, `author`, `category`, `label`, `pull` and `text`. `pull` must be an exact substring of `text`. Then add its pins to `scripts/verify-content.mjs`: text, author and label, using the next `T` number. The pins are intentional (the check does not force you to add them). The grid handles any number of cards; with an odd count the last card is centred above 1000 px.
- **Replacing the portrait:** the four files in `app/assets` must keep their exact names: `anna-portrait-480.webp`, `anna-portrait-480.jpg` (480x585) and `anna-portrait-800.webp`, `anna-portrait-800.jpg` (800x976). The aspect ratio is 0.82, and the files must carry no EXIF or GPS metadata. `verify-render.mjs` pins the image `width` 800 and `height` 976. Any image editor can export the WebP files; use quality of about 82.
- **FormSubmit:** the first submission after a new domain or a new recipient address makes FormSubmit send an "Activate Form" e-mail to the recipient. Until the link in it is clicked, the form shows its error state with the e-mail fallback. Do one test send after any domain or address change.

## CI

`.github/workflows/claude-review.yml` runs a Claude review on pull requests. It needs the repository secret `CLAUDE_CODE_OAUTH_TOKEN`; without it the job only prints a warning and does not block the pull request.

## Dependencies

Node is pinned in `.nvmrc` (22); CI reads it too. Dependency versions are exact. Lint uses ESLint 9 with `@eslint/js`, `typescript-eslint` and `eslint-plugin-react-hooks`; Next.js is no longer a dependency.

`npm audit` still reports one dev-only finding: a nested `minimatch` inside `typescript-eslint` (no upstream fix yet). It does not ship in the built site. Never run `npm audit fix --force` here: it would downgrade `typescript-eslint`. Apply non-breaking fixes only, and run `npm run check` afterwards.
