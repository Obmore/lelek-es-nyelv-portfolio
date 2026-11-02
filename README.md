# Lélek & Nyelv portfolio

Static, Hungarian-language portfolio site for a mental hygiene (mentálhigiéné) helper and English teacher. Live at https://obmore.github.io/lelek-es-nyelv-portfolio/.

## Stack

React 19, TypeScript, Vite 8.3, Tailwind CSS 4. Fonts (Fraunces, Figtree) come from `@fontsource-variable`. The site is a static build deployed to GitHub Pages; the contact form posts to FormSubmit.

## Content

Everything the visitor reads lives in `app/content.ts`: copy, prices, testimonials, links (for example `FACEBOOK_URL`) and the privacy notice and imprint. Edit text there, not in the components.

## Local development

```
npm ci
npm run dev        # http://localhost:5173/lelek-es-nyelv-portfolio/
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

1. Change `SITE_URL` in `site.config.mjs` (absolute URL with trailing slash). The Vite `base`, the canonical and Open Graph tags, the favicon links and the verify-content expectations all follow it.
2. Set the custom domain in the repository's Settings > Pages and enforce HTTPS. The deployment uses GitHub Actions (upload-pages-artifact and deploy-pages), so no CNAME file is needed.
3. Add the DNS records at the registrar.
4. Rebuild and redeploy.

## Dependencies

Never run `npm audit fix --force` here: it downgrades eslint and breaks lint. Apply non-breaking fixes only.
