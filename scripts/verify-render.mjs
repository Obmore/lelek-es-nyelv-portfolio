#!/usr/bin/env node
// Server-renders app/page.tsx and asserts on the produced HTML, element by element.
// Expected values are imported from app/content.ts (bundled with the page), never hard-coded here.
// Usage: node scripts/verify-render.mjs
// Exit: 0 all pass, 1 any check failed, 2 environment problem (bundling or rendering failed).
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "node_modules", ".cache", "verify-render");
const outFile = join(outDir, "bundle.mjs");

let mod;
try {
  const { build } = await import("esbuild");
  mkdirSync(outDir, { recursive: true });
  await build({
    stdin: {
      contents: "export { default as Home } from './app/page.tsx';\nexport * as content from './app/content.ts';\n",
      resolveDir: root,
      sourcefile: "verify-render-entry.ts",
      loader: "ts",
    },
    outfile: outFile,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    jsx: "automatic",
    logLevel: "silent",
    // three.js and R3F live in the lazy scene chunk, which never renders on the server.
    external: ["react", "react-dom", "react-dom/*", "react/*", "three", "three/*", "@react-three/fiber"],
  });
  mod = await import(`${pathToFileURL(outFile).href}?t=${Date.now()}`);
} catch (error) {
  console.error(`verify-render: bundling failed: ${error instanceof Error ? error.message : error}`);
  process.exit(2);
}

let html;
try {
  const { createElement } = await import("react");
  const { renderToString } = await import("react-dom/server");
  html = renderToString(createElement(mod.Home));
} catch (error) {
  console.error(`verify-render: render failed: ${error instanceof Error ? error.message : error}`);
  process.exit(2);
} finally {
  rmSync(outDir, { recursive: true, force: true });
}

const c = mod.content;

/* ---- tiny HTML helpers (the output is React's, so it is well formed) ---- */
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s) =>
  s
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/&(?:#x([0-9a-fA-F]+)|#(\d+)|([a-zA-Z]+));/g, (m, hx, dc, nm) =>
      hx ? String.fromCodePoint(parseInt(hx, 16)) : dc ? String.fromCodePoint(parseInt(dc, 10)) : (ENT[nm] ?? m));
const text = (fragment) => decode(fragment.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
const norm = (s) => s.replace(/\s+/g, " ").trim();

/** Every element whose opening tag matches `openRe`; returns {open, inner} with balanced same-name nesting. */
function elements(source, tag, openRe) {
  const out = [];
  const tagRe = new RegExp(`<(/?)${tag}(?=[\\s>/])[^>]*>`, "g");
  let m;
  while ((m = tagRe.exec(source))) {
    if (m[1] || !openRe.test(m[0])) continue;
    let depth = 1;
    const innerStart = tagRe.lastIndex;
    let end = -1;
    const inner = new RegExp(tagRe.source, "g");
    inner.lastIndex = innerStart;
    let n;
    while ((n = inner.exec(source))) {
      depth += n[1] ? -1 : 1;
      if (depth === 0) {
        end = n.index;
        break;
      }
    }
    if (end < 0) continue;
    out.push({ open: m[0], inner: source.slice(innerStart, end) });
  }
  return out;
}
const attr = (open, name) => {
  const m = open.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? decode(m[1]) : null;
};

let pass = 0;
let fail = 0;
const check = (ok, name, hint = "") => {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${!ok && hint ? ` -- ${hint}` : ""}`);
};
const has = (haystackText, needle) => norm(haystackText).includes(norm(needle));

/* ---- service cards ---- */
const cards = elements(html, "article", /class="[^"]*\bservice-card\b/);
check(cards.length === c.services.length, "service-card count matches content", `${cards.length} vs ${c.services.length}`);
for (const service of c.services) {
  const card = cards.find((el) => attr(el.open, "class")?.split(/\s+/).includes(`service-${service.slug}`));
  if (!card) {
    check(false, `service-card service-${service.slug} rendered`);
    continue;
  }
  const t = text(card.inner);
  const priceEls = elements(card.inner, "p", /class="[^"]*\bservice-price\b/).map((el) => text(el.inner));
  check(priceEls.length === 1 && priceEls[0] === norm(service.price), `${service.slug} price is inside its .service-price element`, JSON.stringify(priceEls));
  for (const other of c.services.filter((s) => s !== service)) {
    check(!has(t, other.price), `${service.slug} card does not contain the ${other.slug} price`);
  }
  check(has(t, service.name), `${service.slug} card contains its name`);
  if (service.scope) check(has(t, service.scope), `${service.slug} card contains its scope line`);
  if (service.audience) check(has(t, service.audience), `${service.slug} card contains its audience line`);
  const chips = elements(card.inner, "li", /^<li/).map((el) => text(el.inner));
  for (const chip of service.chips) check(chips.includes(norm(chip)), `${service.slug} card has chip ${chip}`);
}
{
  const language = c.services.find((s) => s.slug === "language");
  const card = cards.find((el) => attr(el.open, "class")?.split(/\s+/).includes("service-language"));
  const chips = card ? elements(card.inner, "li", /^<li/).map((el) => text(el.inner)) : [];
  check(chips.includes("nyelvvizsga-felkészítés"), "language card has the nyelvvizsga-felkészítés chip");
  check(Boolean(language), "language service exists in content");
}

/* ---- testimonials ---- */
const voices = elements(html, "figure", /class="[^"]*\bvoice-card\b/);
check(voices.length === c.testimonials.length, "voice-card count matches content", `${voices.length} vs ${c.testimonials.length}`);
for (const item of c.testimonials) {
  const card = voices.find((el) => has(text(el.inner), item.text));
  if (!card) {
    check(false, `testimonial ${item.id} rendered with its full text`);
    continue;
  }
  const t = text(card.inner);
  check(true, `testimonial ${item.id} contains its full text`);
  const pulls = elements(card.inner, "blockquote", /voice-pull/).map((el) => text(el.inner));
  check(pulls.length === 1 && pulls[0] === norm(`„${item.pull}”`), `testimonial ${item.id} pull quote is wrapped in „ ”`, JSON.stringify(pulls));
  check(item.text.includes(item.pull), `testimonial ${item.id} pull is a substring of its text`);
  check(has(t, item.author), `testimonial ${item.id} contains its author`);
  check(has(t, item.label), `testimonial ${item.id} contains its label`);
  check(has(t, item.category), `testimonial ${item.id} contains its category`);
}

{
  const stage = elements(html, "ul", /class="[^"]*\bvoices-stage\b/)[0];
  check(Boolean(stage) && attr(stage.open, "role") === "list", "testimonial ul has role=\"list\"");
  const pullOpens = [...html.matchAll(/<blockquote\b[^>]*voice-pull[^>]*>/g)].map((m) => m[0]);
  check(pullOpens.length === c.testimonials.length, "every voice-pull blockquote found", `${pullOpens.length}`);
  check(pullOpens.every((o) => attr(o, "aria-hidden") === "true"), "every .voice-pull carries aria-hidden=\"true\"");
}

/* ---- FAQ ---- */
{
  const details = elements(html, "details", /^<details/);
  check(details.length === c.faqs.length, "FAQ item count matches content", `${details.length} vs ${c.faqs.length}`);
  const pricing = details.find((el) => has(text(el.inner), c.faqs.find((f) => f.answer.includes(c.PRICE_MENTAL))?.question ?? "\u0000"));
  check(Boolean(pricing), "FAQ contains the pricing question");
  if (pricing) {
    const answer = elements(pricing.inner, "p", /^<p/).map((el) => text(el.inner)).join(" ");
    check(has(answer, c.PRICE_MENTAL), "FAQ pricing answer contains the mental-hygiene price", c.PRICE_MENTAL);
    check(has(answer, c.PRICE_ENGLISH), "FAQ pricing answer contains the English price", c.PRICE_ENGLISH);
  }
}

/* ---- optional links ---- */
const visible = text(html);
for (const [constant, label] of [["INSTAGRAM_URL", "Instagram"], ["PRIVACY_URL", "Adatkezelés"]]) {
  if (c[constant] == null) check(!visible.includes(label), `no "${label}" text while ${constant} is null`);
  else check(visible.includes(label), `"${label}" renders when ${constant} is set`);
}

/* ---- anchors ---- */
{
  const tops = [...html.matchAll(/<a\b[^>]*\shref="#top"[^>]*>/g)].map((m) => m[0]);
  check(tops.length === 2, "exactly two href=\"#top\" links", `found ${tops.length}`);
  check(tops.every((tag) => /class="[^"]*\bbrand\b/.test(tag)), "every href=\"#top\" link is a brand link");
}

/* ---- link hygiene ---- */
{
  const hrefs = [...html.matchAll(/<a\b[^>]*>/g)].map((m) => attr(m[0], "href"));
  const bad = hrefs.filter((h) => h == null || h.trim() === "" || h.trim() === "#" || /^(null|undefined)$/.test(h.trim()));
  check(bad.length === 0, "no <a> has an empty, #-only or null/undefined href", JSON.stringify(bad));
  const ids = new Set([...html.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1]));
  const dangling = hrefs.filter((h) => h && h.length > 1 && h.startsWith("#") && !ids.has(h.slice(1)));
  check(dangling.length === 0, "every href=\"#id\" has a matching id", JSON.stringify(dangling));
}

/* ---- contact form ---- */
{
  const form = elements(html, "form", /^<form/)[0];
  check(Boolean(form), "contact form rendered");
  if (form) {
    check(attr(form.open, "action") === c.FORM_ENDPOINT, "form action equals FORM_ENDPOINT", String(attr(form.open, "action")));
    check((attr(form.open, "method") ?? "").toLowerCase() === "post", "form method is POST");
    const names = new Set(
      [...form.inner.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)]
        .map((m) => attr(m[0], "name"))
        .filter(Boolean),
    );
    const expected = [
      "_subject", "_template", "_captcha", "_honey", "Megkeresés témája", "Név", "E-mail",
      "Telefonszám", "Preferált elérhetőség", "Üzenet", "Adatkezelési hozzájárulás",
    ];
    const got = [...names].sort();
    check(
      JSON.stringify(got) === JSON.stringify([...expected].sort()),
      "form field names are exactly the expected set",
      `got ${JSON.stringify(got)}`,
    );
  }
}

console.log(`verify-render: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
