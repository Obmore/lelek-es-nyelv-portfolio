#!/usr/bin/env node
// Verifies the built GitHub Pages site and the app/ source against the content spec.
// Usage: node scripts/verify-content.mjs [--build]
// Exit: 0 all pass, 1 any check failed, 2 environment problem (missing dist, build failure).
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL } from "../site.config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist-github-pages");
const appDir = join(root, "app");
const NB = " ";

// Expected contact e-mail: the site's public contact address (fail closed, no SKIP path).
// Hard-coded on purpose, never read from app/ (circular); EXPECTED_CONTACT_EMAIL may override it.
const EMAIL = (process.env.EXPECTED_CONTACT_EMAIL ?? "").trim() || "juhasznagyanna@gmail.com";

if (process.argv.includes("--build")) {
  const r = spawnSync("npm run build", { cwd: root, shell: true, stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`verify-content: build failed (exit ${r.status ?? "signal"})`);
    process.exit(2);
  }
}

if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
  console.error(`verify-content: missing directory ${distDir}`);
  process.exit(2);
}

function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

const NAMED = { nbsp: NB, amp: "&", quot: '"', apos: "'", lt: "<", gt: ">",
  ndash: "–", mdash: "—", hellip: "…", middot: "·",
  bdquo: "„", rdquo: "”", ldquo: "“", laquo: "«", raquo: "»" };

function cp(n) {
  try { return String.fromCodePoint(n); } catch { return ""; }
}

function decode(s) {
  // HTML comments (React SSR text separators)
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  // JS escapes (single pass so "\\u00a0" style double escapes resolve stepwise below)
  const jsEsc = (str) =>
    str.replace(/\\(u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|([nrt'"\\\/`]))/g,
      (_, __, brace, u4, x2, ch) => {
        if (brace) return cp(parseInt(brace, 16));
        if (u4) return cp(parseInt(u4, 16));
        if (x2) return cp(parseInt(x2, 16));
        return { n: "\n", r: "\r", t: "\t" }[ch] ?? ch;
      });
  const htmlEnt = (str) =>
    str.replace(/&(?:#x([0-9a-fA-F]+)|#(\d+)|([a-zA-Z][a-zA-Z0-9]*));/g, (m, hx, dc, nm) => {
      if (hx) return cp(parseInt(hx, 16));
      if (dc) return cp(parseInt(dc, 10));
      return NAMED[nm] ?? m;
    });
  // two rounds handle JSON-in-JS double escaping (\\u00a0) and entity-in-string layering
  for (let i = 0; i < 2; i++) s = htmlEnt(jsEsc(s));
  // collapse ordinary whitespace only; NBSP is preserved
  return s.replace(/[ \t\r\n\f]+/g, " ");
}

const norm = (s) => s.replace(/[ \t\r\n\f]+/g, " ");

const builtFiles = walk(distDir, [".html", ".js", ".css", ".txt"]);
if (builtFiles.length === 0) {
  console.error(`verify-content: no .html/.js/.css files under ${distDir}`);
  process.exit(2);
}
const built = builtFiles.map((f) => decode(readFileSync(f, "utf8"))).join("\n");
const srcFiles = existsSync(appDir) ? walk(appDir, [".ts", ".tsx"]) : [];
const source = srcFiles.map((f) => decode(readFileSync(f, "utf8"))).join("\n");

const T1 = "Szeretném, szeretnénk megköszönni, amit értem tettél az elmúlt évben! Édesanyám a kommented megtalálva talált rád, hiszen én éppen angoltanárt kerestem C1-es nyelvvizsga-felkészítéshez. Szinte rögtön el is kezdtük a közös munkát, ami veled az egész tanulási folyamatot megkönnyítette. Végig emberközpontú, jó hangulatú és igényes órákat adtál nekem. Amellett, hogy ennyire figyelmes voltál velem, a lényeget nem hagyhatom ki: egy év alatt egy erős B2-es szintről elvezettél egy fantasztikus C1-es tudásszintig, amit egy kiváló felsőfokú nyelvvizsgával igazoltam. Hálásan köszönöm azt a mérhetetlen tudást és tapasztalatot, amit átadtál nekem (nemcsak az angol, hanem az élet területén is), illetve azt a rengeteg értékes beszélgetést, amikkel hozzájárultál a fejlődésemhez minden téren!";
const T2 = "Szeretném megköszönni azt a fejlődési lehetőséget, amit a te segítségeddel tapasztaltam meg. C1-es nyelvvizsgára készültem, és anyukámon keresztül ismertelek meg. Nagyon sokat fejlődtem az óráidon, annak ellenére, hogy ezeken online tudtam csak részt venni, mivel messze lakom. Mindig jó hangulatban teltek az órák, vidám hangulatban haladtunk át a témakörökön, nyelvtani anyagokon, rengeteg tesztet kitöltve. Nekem elsőre sikerült a vizsgám, amiért nagyon hálás vagyok. A többletpontokkal, amiket ez a nyelvvizsga hozott számomra, bekerültem az egyetemre, ahova jelentkeztem. Egy csodás kaland volt!";
const T3 = "Pannihoz segítő alkalmakra kezdtem járni, az elmúlt két évben rendszeresen találkoztunk. Nagyon szeretek vele beszélgetni, hiszen mindig kifejezetten pontos meglátást kapok tőle, miközben figyelmesen végighallgat. A beszélgetés segít nekem abban, hogy megértsem a saját helyzetemet, és a környezetemben lévő emberek, családtagok viselkedésének mozgatórugóit, de elsősorban abban segít, hogy megértsem magam, s ezáltal sokkal közelebb kerültem önmagamhoz. Az alkalmakról mindig könnyebb szívvel távozom, s valami olyan konklúzióval, ami segít az aktuális nehézségemmel való megküzdésben. Nagyon tudom ajánlani őt, mert egy nagyon kedves, együttérző, közvetlen és nyitott embert ismertem meg a személyében. Mindenkivel gyorsan megtalálja a közös hangot, vele könnyen biztonságban érezhetjük magunkat. Legyen szó bármilyen helyzetről, ő tud valami olyat mondani, ami közelebb visz minket a megoldáshoz!";

const A1 = "1969-ben születtem. A szüleim orvosok voltak, kiskorom óta láttam, ahogyan feltétel nélkül, felelősségteljesen segítenek bárkinek, aki támogatásukat kéri. A szakmai segítségen messze túlmutató támogatást nyújtottak mindenkinek, aki feléjük fordult. Számomra ez alapminta és érték lett jelenlegi életemben.";
const A2 = "Később az ELTE angol nyelv és irodalom szakán szereztem meg első diplomámat, s tanárként szintén ezen elvek szerint dolgozom. A tanulási folyamat középpontjában a tanítványaim állnak. Szeretettel, odafigyeléssel segítem a tanulási folyamataikat.";
const A3 = "Mivel a munkámban különleges szerep jut a humán pszichológiai és pedagógiai jelenlétnek, elvégeztem a Semmelweis Egyetem Mentálhigiéné Intézetének posztgraduális képzését is, s hogy mindazt a tudást, tapasztalatot, amit ebből merítek, az emberek, a hozzám fordulók szolgálatának szentelhessem. A segítő folyamatban fontos szerepet kap az, hogy egyenrangú társként tekintek a hozzám fordulókra, türelemmel kísérem őket, s velük drukkolok, hogy megtalálják kérdéseikre a legjobb választ.";

// The only places the word "díjmentes" may appear (v2).
const FREE_STRINGS = [
  "A 20 perces, díjmentes ismerkedő beszélgetésen közösen ránézünk arra, miben vagy most, és mire lenne szükséged. Ha az angol és az önismeret egyszerre fontos, a két területet finoman össze is kapcsolhatjuk.",
  "Egy rövid, díjmentes online ismerkedő beszélgetésen megismerjük egymást és a kérdésedet.",
  "Díjmentes ismerkedő beszélgetés",
];

const required = [
  ["testimonial T1 text", T1],
  ["testimonial T2 text", T2],
  ["testimonial T3 text", T3],
  ["T1 author", "Helle Jázmin"],
  ["T2 author", "Pethő Marci"],
  ["T3 author", "Barbara E."],
  ["T1 label", "C1 nyelvvizsga-felkészítés · 1 év"],
  ["T2 label", "C1 nyelvvizsga-felkészítés · online órák"],
  ["T3 label", "Mentálhigiénés segítő beszélgetések · 2 év"],
  ["price mental hygiene", `18${NB}000${NB}Ft / 60 perc`],
  ["price English", `7000${NB}Ft / 60 perc`],
  ["mental hygiene name", "Mentálhigiénés segítő beszélgetés"],
  ["mental hygiene scope line (v2)", "Segítő beszélgetés felnőtteknek, fiataloknak és gyermekeknek"],
  ["English name", "Angol oktatás"],
  ["English scope line (v2)", "Felkészítés nemzetközi (például IELTS, Cambridge) és akkreditált magyar nyelvvizsgákra (például Origó, Euroexam, BME, telc)"],
  ["English level line (v2)", "Alap-, közép- és felsőfokon"],
  ["FAQ answer 1 (v2)", FREE_STRINGS[0]],
  ["method step 01 text (v2)", FREE_STRINGS[1]],
  ["contact promise title (v2)", FREE_STRINGS[2]],
  ["contact promise subline", "20 perc, online"],
  ["FAQ in-person question", "Online vagy személyesen találkozunk?"],
  ["FAQ in-person answer (v2)", "A segítő beszélgetéseket személyesen, Budapesten a XI. kerületben, és online is tartom. Az angolórák online is elérhetők, így bárhonnan csatlakozhatsz; a részleteket az ismerkedő beszélgetésen egyeztetjük."],
  ["hero fact (v2)", "perces alkalmak, személyesen és online"],
  ["FAQ exam question (v2)", "Milyen nyelvvizsgára készítesz fel?"],
  ["FAQ exam answer (v2)", "Minden nemzetközi (például IELTS, Cambridge) és akkreditált magyar nyelvvizsgára (például Origó, Euroexam, BME, telc) vállalok felkészítést, alap-, közép- és felsőfokon."],
  ["English card paragraph", "Beszédközpontú órák diákoknak és felnőtteknek, nyelvvizsgára készülőknek is. Nem a görcsös teljesítés a cél, hanem a valódi kapcsolódás."],
  ["hero lead sentence", "Segítek közelebb kerülni önmagadhoz, és magabiztosabban megszólalni angolul."],
  ["form subject", "Új megkeresés a Lélek & Nyelv oldalról"],
  ["Facebook URL", "https://www.facebook.com/anna.juhasznagy"],
  ["chip nyelvvizsga-felkészítés", "nyelvvizsga-felkészítés"],
  ["full name", "Juhász Nagy Anna"],
  ["about stamp", "ELTE · SOTE"],
  ["about paragraph 1", A1],
  ["about paragraph 2", A2],
  ["about paragraph 3", A3],
  ["consent text, part before link", "Elolvastam az"],
  ["consent link text", "adatkezelési tájékoztatót"],
  ["consent text, part after link", ", és kifejezetten hozzájárulok, hogy Juhász Nagy Anna a megadott adataimat – az üzenetemben esetleg megosztott, egészségemmel kapcsolatos információkat is – a kapcsolatfelvétel és a válaszadás céljából kezelje."],
  ["privacy section id", "adatkezeles"],
  ["privacy heading", "Adatkezelési tájékoztató"],
];

const OLD_EMAIL = "benzdsiott1998@gmail.com";
const ws = "[\\s\\u00a0]";
const forbidden = [
  ["ingyenes/ingyen", /ingyen/i],
  ["pszichológiai konzultáció", /pszichológiai konzultáció/i],
  ["ifjúságpszichológiai", /ifjúságpszichológiai/i],
  ["próbaóra", /próbaóra/i],
  ["old contact e-mail", /benzdsiott1998@gmail\.com/i],
  ["removed about sentence: Anna vagyok", /Anna vagyok, mentálhigiénés segítő szakember és angoltanár/],
  ["removed about sentence: Abban hiszek", /Abban hiszek, hogy a valódi tanulás és változás ugyanonnan indul/],
  ["removed about sentence: Nem kész receptekkel", /Nem kész receptekkel érkezem/],
  ["old about wording: 1969-ben születtem, s mivel", /1969-ben születtem, s mivel/],
  ["old about wording: a SOTE mentálhigiénés képzését", /a SOTE mentálhigiénés képzését/],
  ["word Réka", /(?<![\p{L}])Réka(?![\p{L}])/iu],
  ["12+ év", new RegExp(`12\\+${ws}*év`, "i")],
  ["50 perc", new RegExp(`50${ws}*perc`, "i")],
  ["Erős Barbara", /Er[őöo]s\s+Barbara/i],
  ["Barbara Erős", /Barbara\s+Er[őöo]s/i],
];

let pass = 0;
let fail = 0;
const report = (ok, name, hint = "") => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${!ok && hint ? ` -- ${hint}` : ""}`);
};
const show = (s) => JSON.stringify(s.slice(0, 60));

for (const [name, str] of required) {
  const needle = norm(str);
  report(built.includes(needle), `built contains: ${name}`, `missing ${show(needle)}`);
}
for (const [corpusName, corpus] of [["built", built], ["app source", source]]) {
  for (const [name, re] of forbidden) {
    const m = corpus.match(re);
    report(!m, `${corpusName} lacks: ${name}`, m ? `found ${show(corpus.slice(Math.max(0, m.index - 10), m.index + 40))}` : "");
  }
}
// No em dash in the authored sources: app ts/tsx/css and the github-pages entry files
// (the built bundle is skipped: library code may contain one).
{
  const dashDirs = [[appDir, [".ts", ".tsx", ".css"]], [join(root, "github-pages"), [".html", ".tsx"]]];
  const dashFiles = dashDirs.flatMap(([dir, exts]) => (existsSync(dir) ? walk(dir, exts) : []));
  const hit = dashFiles.map((f) => [f, decode(readFileSync(f, "utf8"))]).find(([, text]) => text.includes("—"));
  report(!hit, "app source lacks: em dash (—)", hit ? `found in ${hit[0]}: ${show(hit[1].slice(Math.max(0, hit[1].indexOf("—") - 20), hit[1].indexOf("—") + 40))}` : "");
}
// "díjmentes" only inside the three v2 strings (case-insensitive; longest first so nesting cannot leak).
{
  const masks = FREE_STRINGS.map((x) => norm(x).toLowerCase()).sort((p, q) => q.length - p.length);
  for (const [corpusName, corpus] of [["built", built], ["app source", source]]) {
    let rest = corpus.toLowerCase();
    for (const mk of masks) rest = rest.split(mk).join("\u0000");
    const idx = rest.indexOf("díjmentes");
    report(idx < 0, `${corpusName}: díjmentes only inside the v2 strings`, idx >= 0 ? `stray ${show(rest.slice(Math.max(0, idx - 15), idx + 40))}` : "");
  }
}

// Page title in the built index.html
{
  const indexPath = join(distDir, "index.html");
  const html = existsSync(indexPath) ? decode(readFileSync(indexPath, "utf8")) : "";
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  report(title === "Juhász Nagy Anna – Lélek & Nyelv", "index.html <title> equals the v2 title", `got ${JSON.stringify(title)}`);
}

// Privacy subpage in the built site
{
  const privPath = join(distDir, "adatkezeles", "index.html");
  const exists = existsSync(privPath);
  report(exists, "dist-github-pages/adatkezeles/index.html exists", `missing ${privPath}`);
  const html = exists ? decode(readFileSync(privPath, "utf8")) : "";
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  report(title === "Adatkezelési tájékoztató – Juhász Nagy Anna", "adatkezeles/index.html <title> equals the privacy page title", `got ${JSON.stringify(title)}`);
}

// Share metadata: canonical, Open Graph and Twitter card in both built pages
{
  const SITE = SITE_URL;
  const pages = [
    ["index.html", join(distDir, "index.html"), SITE],
    ["adatkezeles/index.html", join(distDir, "adatkezeles", "index.html"), `${SITE}adatkezeles/`],
  ];
  const metaContent = (html, attr, key) => {
    for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
      const tag = m[0];
      if (new RegExp(`${attr}="${key}"`, "i").test(tag)) return tag.match(/content="([^"]*)"/i)?.[1];
    }
    return undefined;
  };
  for (const [label, path, url] of pages) {
    const html = existsSync(path) ? decode(readFileSync(path, "utf8")) : "";
    const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*>/i)?.[0]?.match(/href="([^"]*)"/i)?.[1];
    report(canonical === url, `${label} canonical is ${url}`, `got ${JSON.stringify(canonical)}`);
    const ogUrl = metaContent(html, "property", "og:url");
    report(ogUrl === url, `${label} og:url is ${url}`, `got ${JSON.stringify(ogUrl)}`);
    const ogImage = metaContent(html, "property", "og:image");
    report(ogImage === `${SITE}og-image.png`, `${label} og:image is ${SITE}og-image.png`, `got ${JSON.stringify(ogImage)}`);
    report(metaContent(html, "property", "og:image:type") === "image/png", `${label} og:image:type is image/png`);
    report(!!metaContent(html, "property", "og:image:alt"), `${label} og:image:alt is non-empty`);
    report(!!metaContent(html, "property", "og:site_name"), `${label} og:site_name is non-empty`);
    report(metaContent(html, "property", "og:image:width") === "1200", `${label} og:image:width is 1200`);
    report(metaContent(html, "property", "og:image:height") === "630", `${label} og:image:height is 630`);
    report(metaContent(html, "name", "twitter:card") === "summary_large_image", `${label} twitter:card is summary_large_image`, `got ${JSON.stringify(metaContent(html, "name", "twitter:card"))}`);
    report(!html.includes("%SITE_URL%"), `${label} has no unreplaced %SITE_URL% token`);
  }
  const imgPath = join(distDir, "og-image.png");
  let dims = "missing";
  if (existsSync(imgPath)) {
    const b = readFileSync(imgPath);
    const isPng = b.length >= 24 && b.subarray(1, 4).toString("latin1") === "PNG";
    dims = isPng ? `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}` : "not a PNG";
  }
  report(dims === "1200x630", "dist-github-pages/og-image.png is a 1200x630 PNG", `got ${dims}`);
}

// E-mail and endpoint checks (exact endpoint values are asserted in verify-render)
report(built.includes(EMAIL), "built contains the expected contact e-mail");
report(built.includes("https://formsubmit.co/"), "built contains the form endpoint prefix https://formsubmit.co/");
report(built.includes("https://formsubmit.co/ajax/"), "built contains the AJAX endpoint prefix https://formsubmit.co/ajax/");
report(!built.includes(OLD_EMAIL), "built lacks the old contact e-mail");

if (srcFiles.length === 0) report(false, "app source readable", `no .ts/.tsx under ${appDir}`);

console.log(`verify-content: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
