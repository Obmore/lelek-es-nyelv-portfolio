#!/usr/bin/env node
// Server-renders app/page.tsx and app/components/PrivacyPage.tsx and asserts on the produced HTML, element by element.
// Expected values are imported from app/content.ts (bundled with the page), never hard-coded here.
// Usage: node scripts/verify-render.mjs
// Exit: 0 all pass, 1 any check failed, 2 environment problem (bundling or rendering failed).
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "node_modules", ".cache", "verify-render");
const outFile = join(outDir, "bundle.mjs");
const privacyFile = join(outDir, "privacy.mjs");
const statusFile = join(outDir, "status.mjs");

const esbuildOptions = (outfile) => ({
  outfile,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  jsx: "automatic",
  logLevel: "silent",
  // three.js and R3F live in the lazy scene chunk, which never renders on the server.
  external: ["react", "react-dom", "react-dom/*", "react/*", "three", "three/*", "@react-three/fiber"],
});

let mod;
let privacyError = "";
let statusError = "";
try {
  const { build } = await import("esbuild");
  mkdirSync(outDir, { recursive: true });
  await build({
    ...esbuildOptions(outFile),
    stdin: {
      contents: "export { default as Home } from './app/page.tsx';\nexport * as content from './app/content.ts';\n",
      resolveDir: root,
      sourcefile: "verify-render-entry.ts",
      loader: "ts",
    },
  });
  mod = await import(`${pathToFileURL(outFile).href}?t=${Date.now()}`);
  // The privacy page is bundled on its own: a missing or broken page is a failed check, not an environment error.
  try {
    await build({
      ...esbuildOptions(privacyFile),
      stdin: {
        contents: "export { default as Privacy } from './app/components/PrivacyPage.tsx';\n",
        resolveDir: root,
        sourcefile: "verify-render-privacy-entry.ts",
        loader: "ts",
      },
    });
  } catch (error) {
    privacyError = `bundling app/components/PrivacyPage.tsx failed: ${(error instanceof Error ? error.message : String(error)).split("\n")[0]}`;
  }
  // The form status texts are bundled on their own too: a missing component is a failed check, not an environment error.
  try {
    await build({
      ...esbuildOptions(statusFile),
      stdin: {
        contents: "export { FormStatusText } from './app/components/FormStatus.tsx';\n",
        resolveDir: root,
        sourcefile: "verify-render-status-entry.ts",
        loader: "ts",
      },
    });
  } catch (error) {
    statusError = `bundling app/components/FormStatus.tsx failed: ${(error instanceof Error ? error.message : String(error)).split("\n")[0]}`;
  }
} catch (error) {
  console.error(`verify-render: bundling failed: ${error instanceof Error ? error.message : error}`);
  process.exit(2);
}

let html;
let privacyHtml = null;
const statusHtml = {};
let bundleText = "";
try {
  const { createElement } = await import("react");
  const { renderToString } = await import("react-dom/server");
  html = renderToString(createElement(mod.Home));
  bundleText = readFileSync(outFile, "utf8");
  if (!privacyError) {
    try {
      const privacyMod = await import(`${pathToFileURL(privacyFile).href}?t=${Date.now()}`);
      privacyHtml = renderToString(createElement(privacyMod.Privacy));
    } catch (error) {
      privacyError = `rendering app/components/PrivacyPage.tsx failed: ${(error instanceof Error ? error.message : String(error)).split("\n")[0]}`;
    }
  }
  if (!statusError) {
    try {
      const { FormStatusText } = await import(`${pathToFileURL(statusFile).href}?t=${Date.now()}`);
      for (const status of ["error", "uncertain", "sent", "idle", "sending"]) {
        statusHtml[status] = renderToString(createElement(FormStatusText, { status }));
      }
    } catch (error) {
      statusError = `rendering app/components/FormStatus.tsx failed: ${(error instanceof Error ? error.message : String(error)).split("\n")[0]}`;
    }
  }
} catch (error) {
  console.error(`verify-render: render failed: ${error instanceof Error ? error.message : error}`);
  process.exit(2);
} finally {
  rmSync(outDir, { recursive: true, force: true });
}

const c = mod.content;

/* ---- expected contact e-mail: the site's public contact address (fail closed, no SKIP path) ---- */
// Hard-coded on purpose, never read from app/ (circular); EXPECTED_CONTACT_EMAIL may override it.
const EMAIL = (process.env.EXPECTED_CONTACT_EMAIL ?? "").trim() || "juhasznagyanna@gmail.com";

/* ---- v2 spec strings (expectations come from the spec, not from content.ts) ---- */
const MIND_SCOPE = "Segítő beszélgetés felnőtteknek, fiataloknak és gyermekeknek";
const OLD_AUDIENCE = "Felnőtteknek, gyermekeknek és fiataloknak";
const LANG_SCOPE = "Felkészítés nemzetközi (például IELTS, Cambridge) és akkreditált magyar nyelvvizsgákra (például Origó, Euroexam, BME, telc)";
const LANG_LEVEL = "Alap-, közép- és felsőfokon";
const EXAM_Q = "Milyen nyelvvizsgára készítesz fel?";
const EXAM_A = "Minden nemzetközi (például IELTS, Cambridge) és akkreditált magyar nyelvvizsgára (például Origó, Euroexam, BME, telc) vállalok felkészítést, alap-, közép- és felsőfokon.";
const INPERSON_Q = "Online vagy személyesen találkozunk?";
const INPERSON_A = "A segítő beszélgetéseket személyesen, Budapesten a XI. kerületben, és online is tartom. Az angolórák online is elérhetők, így bárhonnan csatlakozhatsz; a részleteket az ismerkedő beszélgetésen egyeztetjük.";
const HERO_FACT = "60 perces alkalmak, személyesen és online";
const ABOUT = [
  "1969-ben születtem. A szüleim orvosok voltak, kiskorom óta láttam, ahogyan feltétel nélkül, felelősségteljesen segítenek bárkinek, aki támogatásukat kéri. A szakmai segítségen messze túlmutató támogatást nyújtottak mindenkinek, aki feléjük fordult. Számomra ez alapminta és érték lett jelenlegi életemben.",
  "Később az ELTE angol nyelv és irodalom szakán szereztem meg első diplomámat, s tanárként szintén ezen elvek szerint dolgozom. A tanulási folyamat középpontjában a tanítványaim állnak. Szeretettel, odafigyeléssel segítem a tanulási folyamataikat.",
  "Mivel a munkámban különleges szerep jut a humán pszichológiai és pedagógiai jelenlétnek, elvégeztem a Semmelweis Egyetem Mentálhigiéné Intézetének posztgraduális képzését is, s hogy mindazt a tudást, tapasztalatot, amit ebből merítek, az emberek, a hozzám fordulók szolgálatának szentelhessem. A segítő folyamatban fontos szerepet kap az, hogy egyenrangú társként tekintek a hozzám fordulókra, türelemmel kísérem őket, s velük drukkolok, hogy megtalálják kérdéseikre a legjobb választ.",
];
const REMOVED = [
  "Anna vagyok, mentálhigiénés segítő szakember és angoltanár",
  "Abban hiszek, hogy a valódi tanulás és változás ugyanonnan indul",
  "Nem kész receptekkel érkezem",
];
const noSpace = (x) => x.replace(/[\s\u00a0]+/g, "");

/* ---- tiny HTML helpers (the output is React's, so it is well formed) ---- */
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s) =>
  s
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/&(?:#x([0-9a-fA-F]+)|#(\d+)|([a-zA-Z]+));/g, (m, hx, dc, nm) =>
      hx ? String.fromCodePoint(parseInt(hx, 16)) : dc ? String.fromCodePoint(parseInt(dc, 10)) : (ENT[nm] ?? m));
const text = (fragment) => decode(fragment.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
const norm = (s) => s.replace(/\s+/g, " ").trim();
/** Whitespace-separated lowercase tokens of an attribute value, for whole-token comparison. */
const tokens = (value) => (value ?? "").toLowerCase().split(/\s+/).filter(Boolean);
/** True when href points at host or one of its subdomains (case-insensitive via URL parsing, one trailing dot ignored); relative and protocol-relative hrefs are resolved against a dummy base. */
const onHost = (href, host) => {
  try {
    const h = new URL(href, "https://base.invalid/").hostname.replace(/\.$/, "");
    return h === host || h.endsWith(`.${host}`);
  } catch {
    return false;
  }
};

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
  if (service.slug === "mind") {
    check(has(t, MIND_SCOPE), "mind card contains the v2 scope line");
    check(!has(t, OLD_AUDIENCE), "mind card has no separate audience line");
    check(!/pszichológiai/i.test(t), "mind card has no psychology wording");
  }
  if (service.slug === "language") {
    check(has(t, LANG_SCOPE), "language card contains the exam scope line");
    check(has(t, LANG_LEVEL), "language card contains the level line");
  }
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

/* ---- method step words (decoration rendered by CSS only) ---- */
{
  const words = elements(html, "span", /class="[^"]*\bstep-word\b/);
  check(words.length === c.methodSteps.length, "method step-word span count matches content", `${words.length} vs ${c.methodSteps.length}`);
  check(words.length > 0 && words.every((el) => attr(el.open, "aria-hidden") === "true"), "every .step-word carries aria-hidden=\"true\"");
  check(
    words.length === c.methodSteps.length && words.every((el, i) => attr(el.open, "data-word") === c.methodSteps[i].word),
    "every .step-word data-word equals its step word, in order",
    JSON.stringify(words.map((el) => attr(el.open, "data-word"))),
  );
  check(words.length > 0 && words.every((el) => el.inner === ""), "every .step-word has no text content (the word comes only from CSS)", JSON.stringify(words.map((el) => el.inner)));
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

{
  const details = elements(html, "details", /^<details/);
  const answerOf = (q) => {
    const d = details.find((el) => has(text(elements(el.inner, "summary", /^<summary/)[0]?.inner ?? ""), q));
    return d ? elements(d.inner, "p", /^<p/).map((el) => text(el.inner)).join(" ") : null;
  };
  const exam = answerOf(EXAM_Q);
  check(exam !== null, "FAQ contains the exam question");
  check(exam !== null && norm(exam) === norm(EXAM_A), "FAQ exam answer equals the v2 text", String(exam));
  const inperson = answerOf(INPERSON_Q);
  check(inperson !== null, "FAQ contains the in-person question");
  check(inperson !== null && norm(inperson) === norm(INPERSON_A), "FAQ in-person answer equals the v2 text", String(inperson));
}

/* ---- hero fact ---- */
{
  const facts = elements(html, "p", /class="[^"]*\bhero-fact\b/).map((el) => noSpace(text(el.inner)));
  check(facts.length === 1 && facts[0] === noSpace(HERO_FACT), "hero fact equals the v2 text", JSON.stringify(facts));
}

/* ---- about section ---- */
{
  const about = elements(html, "section", /id="rolam"/)[0];
  check(Boolean(about), "about section (#rolam) rendered");
  if (about) {
    const t = text(about.inner);
    const countOf = (hay, needle) => norm(hay).split(norm(needle)).length - 1;
    ABOUT.forEach((para, i) => {
      const n = countOf(t, para);
      check(n === 1, `about paragraph ${i + 1} appears exactly once`, `count ${n}`);
    });
    const leads = elements(about.inner, "p", /class="[^"]*\blead-serif\b/).map((el) => text(el.inner));
    check(leads.length === 1 && norm(leads[0]) === norm(ABOUT[0]), "serif lead element holds paragraph 1 only", JSON.stringify(leads).slice(0, 80));
    for (const gone of REMOVED) check(countOf(t, gone) === 0, `about lacks removed sentence "${gone.slice(0, 24)}"`);
    const stamps = elements(about.inner, "span", /class="[^"]*\bstamp\b/).map((el) => text(el.inner));
    check(stamps.length === 1 && stamps[0] === "ELTE · SOTE", "stamp text is ELTE · SOTE", JSON.stringify(stamps));
  }
}

/* ---- optional links ---- */
const visible = text(html);
const allHrefs = [...html.matchAll(/<a\b[^>]*>/g)].map((m) => attr(m[0], "href"));
const SOCIALS = [["INSTAGRAM_URL", "Instagram", "instagram.com"], ["FACEBOOK_URL", "Facebook", "facebook.com"]];
for (const [constant, label, host] of SOCIALS) {
  check(constant in c, `${constant} is exported by content.ts`);
  if (c[constant] == null) {
    check(!allHrefs.some((h) => onHost(h, host)), `no ${host} link while ${constant} is null`);
    check(!visible.includes(label), `no "${label}" text while ${constant} is null`);
  } else {
    check(allHrefs.includes(c[constant]), `${label} link renders when ${constant} is set`);
    let url = null;
    try {
      url = new URL(c[constant]);
    } catch {
      // reported by the check below
    }
    check(url !== null && url.protocol === "https:" && (url.hostname === host || url.hostname.endsWith(`.${host}`)), `${constant} is an https URL on ${host}`, JSON.stringify(c[constant]));
  }
}
const anchorsIn = (fragment) =>
  [...fragment.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)].map((m) => {
    const open = m[0].match(/<a\b[^>]*>/)[0];
    return { open, href: attr(open, "href"), label: text(m[1]), inner: m[1] };
  });
/** When a social URL is set, the footer holds exactly one matching anchor: "<Label> ↗", new tab, noopener noreferrer. */
function checkSocialLinks(where, footerHtml) {
  const links = anchorsIn(footerHtml);
  for (const [constant, label, host] of SOCIALS) {
    if (c[constant] == null) {
      check(!links.some((l) => onHost(l.href, host)), `${where} footer has no ${label} link while ${constant} is null`, JSON.stringify(links.map((l) => l.href)));
      continue;
    }
    const matches = links.filter((l) => l.href === c[constant]);
    check(matches.length === 1, `${where} footer has exactly one ${label} link`, `${matches.length} anchors with href ${JSON.stringify(c[constant])}`);
    const link = matches[0];
    if (!link) continue;
    const rel = attr(link.open, "rel") ?? "";
    check(link.label.replace(/\s*\(új lapon nyílik\)$/, "") === `${label} ↗`, `${where} footer ${label} link label is "${label} ↗"`, JSON.stringify(link.label));
    const hints = elements(link.inner, "[a-z0-9]+", /\sclass="(?:[^"]*\s)?sr-only(?:\s[^"]*)?"/).map((el) => text(el.inner));
    check(hints.length === 1 && hints[0] === "(új lapon nyílik)", `${where} footer ${label} link contains an .sr-only "(új lapon nyílik)" new-tab hint`, JSON.stringify(hints));
    check(attr(link.open, "target") === "_blank", `${where} footer ${label} link opens in a new tab`, link.open);
    check(tokens(rel).includes("noopener") && tokens(rel).includes("noreferrer"), `${where} footer ${label} link has rel noopener noreferrer`, JSON.stringify(rel));
  }
}
{
  const footer = elements(html, "footer", /^<footer/)[0];
  check(Boolean(footer), "footer rendered");
  if (footer) {
    const links = anchorsIn(footer.inner);
    check(links.some((l) => l.label === "Adatkezelés" && l.href === "adatkezeles/"), "footer has an Adatkezelés link to adatkezeles/", JSON.stringify(links));
    check(has(text(footer.inner), "Juhász Nagy Anna"), "footer contains Juhász Nagy Anna");
    checkSocialLinks("home", footer.inner);
  }
}

/* ---- privacy notice: no longer on the home page ---- */
check(c.PRIVACY_URL === "adatkezeles/", "PRIVACY_URL equals adatkezeles/", JSON.stringify(c.PRIVACY_URL));
check(!/\sid="adatkezeles"/.test(html), "home page has no element with id=\"adatkezeles\"");
check(!/Adatkezelési tájékoztató(?![\p{L}])|Impresszum/u.test(text(html)), "home page has no privacy notice heading or imprint text");

/* ---- privacy page (app/components/PrivacyPage.tsx) ---- */
check(privacyHtml !== null, "privacy page app/components/PrivacyPage.tsx renders", privacyError);
if (privacyHtml !== null) {
  const t = text(privacyHtml);
  const h1s = [...privacyHtml.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => text(m[1]));
  check(h1s.length === 1 && h1s[0] === "Adatkezelési tájékoztató", "privacy page has one <h1> Adatkezelési tájékoztató", JSON.stringify(h1s));
  for (const needle of ["Juhász Nagy Anna", "formsubmit.co", "GitHub", "Google", "6. cikk", "9. cikk", "1 év", "Impresszum"]) {
    check(has(t, needle), `privacy page contains "${needle}"`);
  }
  check(has(t, "NAIH") || has(t, "Nemzeti Adatvédelmi és Információszabadság Hatóság"), "privacy page names NAIH");
  check(t.includes(EMAIL), "privacy page contains the expected contact e-mail");
  const mains = elements(privacyHtml, "main", /^<main/);
  const mainLabel = mains.length === 1 ? attr(mains[0].open, "aria-labelledby") : null;
  const h1Ids = [...privacyHtml.matchAll(/<h1\b[^>]*>/g)].map((m) => attr(m[0], "id"));
  check(Boolean(mainLabel) && h1Ids.length === 1 && h1Ids[0] === mainLabel, "privacy page: <main> aria-labelledby points to the h1 id", JSON.stringify({ mains: mains.length, mainLabel, h1Ids }));
  check(!/\sid="top"/.test(privacyHtml), "privacy page has no element with id=\"top\"");
  const PHONE_ITEM = "a telefonszámod (ha telefonon kérsz választ; egyébként csak ha megadod),";
  const items = elements(privacyHtml, "li", /^<li/).map((el) => text(el.inner));
  check(items.includes(PHONE_ITEM), "privacy data list contains the phone item", JSON.stringify(items.filter((i) => /telefonszám/i.test(i))));
  const privFooter = elements(privacyHtml, "footer", /^<footer/)[0];
  check(Boolean(privFooter), "privacy page footer rendered");
  if (privFooter) checkSocialLinks("privacy page", privFooter.inner);
  const privAnchors = anchorsIn(privacyHtml);
  const privLinks = privAnchors.map((a) => a.open);
  check(privAnchors.some((a) => a.href === "../"), "privacy page links back to the home page with href=\"../\"");
  const bad = [];
  let inspected = 0;
  for (const open of privLinks) {
    const href = (attr(open, "href") ?? "").trim();
    const target = attr(open, "target");
    const rel = attr(open, "rel") ?? "";
    if (/^(https?:)?\/\//i.test(href)) {
      inspected++;
      if (target !== "_blank" || !tokens(rel).includes("noopener")) bad.push(href);
    } else if (/^mailto:/i.test(href) || href.startsWith("#")) {
      inspected++;
      if (target !== null) bad.push(href);
    }
  }
  check(bad.length === 0 && inspected > 0, `privacy links (${inspected} inspected): external open in a new tab with noopener; mailto and # have no target`, JSON.stringify(bad));
  const badPrivHrefs = privAnchors.map((a) => a.href).filter((h) => h == null || h.trim() === "" || h.trim() === "#" || /^(null|undefined)$/.test(h.trim()));
  check(badPrivHrefs.length === 0, "privacy page: no <a> has an empty, #-only or null/undefined href", JSON.stringify(badPrivHrefs));
  const pIds = new Set([...privacyHtml.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1]));
  const pDangling = privAnchors.map((a) => a.href).filter((h) => h && h.length > 1 && h.startsWith("#") && !pIds.has(h.slice(1)));
  check(pDangling.length === 0, "privacy page: every href=\"#id\" has a matching id", JSON.stringify(pDangling));
}

/* ---- old #adatkezeles links are forwarded to the privacy page (checked on the bundled page source, minification-independent) ---- */
check(bundleText.includes("#adatkezeles") && bundleText.includes("location.replace("), "home page bundle forwards #adatkezeles to the privacy page (#adatkezeles + location.replace( in source)");

/* ---- consent label ---- */
{
  const label = elements(html, "label", /class="[^"]*\bconsent-field\b/)[0];
  check(Boolean(label), "consent label rendered");
  if (label) {
    const links = anchorsIn(label.inner);
    check(links.some((l) => l.href === "adatkezeles/" && l.label.replace(/\s*\(új lapon nyílik\)$/, "") === "adatkezelési tájékoztatót"), "consent label links adatkezelési tájékoztatót to adatkezeles/", JSON.stringify(links));
    const consentLink = links.find((l) => l.href === "adatkezeles/");
    const hints = consentLink ? elements(consentLink.inner, "[a-z0-9]+", /\sclass="(?:[^"]*\s)?sr-only(?:\s[^"]*)?"/).map((el) => text(el.inner)) : [];
    check(hints.length === 1 && hints[0] === "(új lapon nyílik)", "consent privacy link contains an .sr-only \"(új lapon nyílik)\" new-tab hint", JSON.stringify(hints));
    const consentOpen = [...label.inner.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]).find((o) => attr(o, "href") === "adatkezeles/");
    check(Boolean(consentOpen) && attr(consentOpen, "target") === "_blank" && tokens(attr(consentOpen, "rel")).includes("noopener"), "consent privacy link has target=\"_blank\" and rel containing noopener", String(consentOpen));
    check(has(text(label.inner), "egészségemmel kapcsolatos"), "consent label mentions egészségemmel kapcsolatos");
  }
}

/* ---- anchors ---- */
{
  const tops = [...html.matchAll(/<a\b[^>]*\shref="#top"[^>]*>/g)].map((m) => m[0]);
  check(tops.length === 2, "exactly two href=\"#top\" links", `found ${tops.length}`);
  check(tops.every((tag) => /class="[^"]*\bbrand\b/.test(tag)), "every href=\"#top\" link is a brand link");
}

/* ---- focusable sections (mobile nav targets) ---- */
for (const id of ["top", "rolam", "szolgaltatasok", "modszertan", "kapcsolat"]) {
  const sec = elements(html, "section", new RegExp(`\\sid="${id}"`))[0];
  if (!sec) {
    check(false, `section #${id} rendered`);
    continue;
  }
  check(attr(sec.open, "tabindex") === "-1", `section #${id} has tabindex="-1"`, sec.open);
  const lb = attr(sec.open, "aria-labelledby");
  const target = lb ? elements(html, "[a-z0-9]+", new RegExp(`\\sid="${lb.replace(/[^\w-]/g, "")}"`))[0] : null;
  check(Boolean(lb) && Boolean(target) && text(target.inner) !== "", `section #${id} aria-labelledby points to a non-empty element`, String(lb));
}

/* ---- link hygiene ---- */
{
  const hrefs = [...html.matchAll(/<a\b[^>]*>/g)].map((m) => attr(m[0], "href"));
  const bad = hrefs.filter((h) => h == null || h.trim() === "" || h.trim() === "#" || /^(null|undefined)$/.test(h.trim()));
  check(bad.length === 0, "no <a> has an empty, #-only or null/undefined href", JSON.stringify(bad));
  const ids = new Set([...html.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1]));
  const dangling = hrefs.filter((h) => h && h.length > 1 && h.startsWith("#") && !ids.has(h.slice(1)));
  check(dangling.length === 0, "home page: every href=\"#id\" has a matching id", JSON.stringify(dangling));
}

/* ---- form status texts (app/components/FormStatus.tsx) ---- */
{
  const ERROR_TEXT = `Most nem sikerült elküldeni. Kérlek, próbáld újra később, vagy írj közvetlenül e-mailben: ${EMAIL}`;
  const UNCERTAIN_TEXT = `A visszaigazolás nem érkezett meg időben, de az üzeneted lehet, hogy mégis célba ért. Kérlek, ne küldd el azonnal újra, inkább írj közvetlenül e-mailben: ${EMAIL}`;
  const SENT_TEXT = "Köszönöm! Az üzeneted úton van Annához.";
  check(!statusError, "form status component app/components/FormStatus.tsx renders", statusError);
  if (!statusError) {
    const mailLinks = (status) => anchorsIn(statusHtml[status]).filter((a) => (a.href ?? "").startsWith("mailto:"));
    check(text(statusHtml.error) === norm(ERROR_TEXT), "form status error text equals the new copy with the e-mail address", text(statusHtml.error));
    const errLinks = mailLinks("error");
    check(errLinks.length === 1 && errLinks[0].href === `mailto:${EMAIL}` && errLinks[0].label === EMAIL, "form status error has exactly one mailto link to the expected e-mail, labelled with it", JSON.stringify(errLinks.map((a) => [a.href, a.label])));
    check(anchorsIn(statusHtml.error).length === 1, "form status error has no other links");
    check(text(statusHtml.uncertain) === norm(UNCERTAIN_TEXT), "form status uncertain text is unchanged", text(statusHtml.uncertain));
    const uncLinks = mailLinks("uncertain");
    check(uncLinks.length === 1 && uncLinks[0].href === `mailto:${EMAIL}` && uncLinks[0].label === EMAIL, "form status uncertain keeps its mailto link", JSON.stringify(uncLinks.map((a) => [a.href, a.label])));
    check(text(statusHtml.sent) === SENT_TEXT && anchorsIn(statusHtml.sent).length === 0, "form status sent text is unchanged and has no link", text(statusHtml.sent));
    check(statusHtml.idle === "" && statusHtml.sending === "", "form status idle and sending render nothing", JSON.stringify([statusHtml.idle, statusHtml.sending]));
  }
  const statusP = elements(html, "p", /class="[^"]*\bform-status\b/)[0];
  check(Boolean(statusP) && attr(statusP.open, "role") === "status" && attr(statusP.open, "aria-live") === "polite", "home page renders the form status paragraph with role=\"status\" and aria-live=\"polite\"", statusP?.open);
}

/* ---- contact form ---- */
{
  const form = elements(html, "form", /^<form/)[0];
  check(Boolean(form), "contact form rendered");
  if (form) {
    check(attr(form.open, "action") === c.FORM_ENDPOINT, "form action equals FORM_ENDPOINT", String(attr(form.open, "action")));
    check(attr(form.open, "action") === `https://formsubmit.co/${EMAIL}`, "form action equals https://formsubmit.co/<expected e-mail>");
    check(c.FORM_ENDPOINT === `https://formsubmit.co/${EMAIL}`, "FORM_ENDPOINT equals https://formsubmit.co/<expected e-mail>", String(c.FORM_ENDPOINT));
    check(c.FORM_AJAX_ENDPOINT === `https://formsubmit.co/ajax/${EMAIL}`, "FORM_AJAX_ENDPOINT equals https://formsubmit.co/ajax/<expected e-mail>", String(c.FORM_AJAX_ENDPOINT));
    const fieldOrder = [...form.inner.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map((m) => attr(m[0], "name"));
    const iSel = fieldOrder.indexOf("Preferált elérhetőség");
    const iTel = fieldOrder.indexOf("Telefonszám");
    check(iSel >= 0 && iTel >= 0 && iSel < iTel, "contact preference select comes before the phone input", `select ${iSel}, phone ${iTel}`);
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
