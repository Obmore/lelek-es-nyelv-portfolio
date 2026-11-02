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
npm run check      # lint, typecheck, build, content and render checks
npm run preview    # serve the production build
```

## What the checks guard

`npm run check` runs lint, typecheck and the build, then two scripts:

- `scripts/verify-content.mjs`: pinned copy (testimonials, bio), forbidden wording, no em dash in `app/` and `github-pages/` sources, page titles, the privacy page, contact endpoints, and share metadata (canonical, Open Graph, Twitter card, `og-image.png` is 1200x630, no leftover `%SITE_URL%`).
- `scripts/verify-render.mjs`: render checks on the built pages.

## Deploy

A push or merge to `main` runs `.github/workflows/pages.yml`: the checks first, then a GitHub Pages deployment. Pull requests run the "Checks" workflow only.

## Share image

The Open Graph image is `public/og-image.png` (1200x630). Regenerate it after changing the name or tagline:

```
node scripts/make-og-image.mjs
```

The script renders an HTML template with the bundled fonts in Microsoft Edge through `playwright-core`. Install it globally or set `PLAYWRIGHT_CORE` to its directory; the script exits with code 2 if it cannot find it. It is not part of `npm run check` or CI. After deploying, re-scrape the URL in the Facebook Sharing Debugger to refresh cached previews.

## Custom domain

The site is served from `https://lelekesnyelv.hu/`. Follow this order for this domain and for any later change; merge the `SITE_URL` change only after steps 1 to 3 are done.

1. DNS at the registrar: four `A` records on the apex (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`), four `AAAA` records (`2606:50c0:8000::153` to `2606:50c0:8003::153`), and `www` as a `CNAME` to `obmore.github.io.`. Remove the registrar's default parking records. No wildcard records.
2. Optional but recommended: verify the domain for the GitHub account (Settings > Pages > Add a domain, a TXT record) to prevent takeover.
3. Set the custom domain in the repository's Settings > Pages, then merge the `SITE_URL` change in `site.config.mjs` right away (absolute URL with trailing slash; the Vite `base`, the canonical and Open Graph tags, the favicon links and the verify-content expectations all follow it). Until the new build is live, the old build's asset paths (`/lelek-es-nyelv-portfolio/...`) do not resolve on the new domain. The deployment uses GitHub Actions, so no CNAME file is needed.
4. Enforce HTTPS once GitHub has issued the certificate (can take up to an hour).
5. Send one test message from the live form: FormSubmit may ask the recipient to activate the form again for the new domain (its docs do not say).
6. Re-scrape the new URL in the Facebook Sharing Debugger.

## Dependencies

Never run `npm audit fix --force` here: it downgrades eslint and breaks lint. Apply non-breaking fixes only.
