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
3. When the domain resolves and is verified, enter exactly the apex `lelekesnyelv.hu` (not `www.lelekesnyelv.hu`) as the custom domain in the repository's Settings > Pages, so GitHub redirects `www` to the apex and the canonical URL stays `https://lelekesnyelv.hu/`. In the same minute, merge the `SITE_URL` change in `site.config.mjs` (absolute URL with trailing slash; the Vite `base`, the canonical and Open Graph tags, the favicon links and the verify-content expectations all follow it). Until the new build is live, the old build's asset paths (`/lelek-es-nyelv-portfolio/...`) do not resolve on the new domain. The deployment uses GitHub Actions, so no CNAME file is needed.
4. Enforce HTTPS once GitHub has issued the certificate (can take up to an hour).
5. Send one test message from the live form: FormSubmit may ask the recipient to activate the form again for the new domain (its docs do not say).
6. Re-scrape the new URL in the Facebook Sharing Debugger.

## Maintenance

- **Changing copy or prices:** edit `app/content.ts`. Approved texts and prices are deliberately pinned in `scripts/verify-content.mjs`, so `npm run check` fails until the pin is updated. Change the pin in the same commit.
- **Adding a testimonial:** add an entry to `testimonials` in `app/content.ts` with the fields `id`, `author`, `category`, `label`, `pull` and `text`. `pull` must be an exact substring of `text`. Then add its text and author pins (the next `T` numbers) to `scripts/verify-content.mjs`.
- **FormSubmit:** the first submission after a new domain or a new recipient address makes FormSubmit send an "Activate Form" e-mail to the recipient. Until the link in it is clicked, the form shows its error state with the e-mail fallback. Do one test send after any domain or address change.

## Dependencies

Node is pinned in `.nvmrc` (22); CI reads it too. Dependency versions are exact. Lint uses ESLint 9 with `@eslint/js`, `typescript-eslint` and `eslint-plugin-react-hooks`; Next.js is no longer a dependency.

`npm audit` still reports one dev-only finding: a nested `minimatch` inside `typescript-eslint` (no upstream fix yet). It does not ship in the built site. Never run `npm audit fix --force` here: it would downgrade `typescript-eslint`. Apply non-breaking fixes only, and run `npm run check` afterwards.
