#!/usr/bin/env node
// Drift check between the site form and the contact Worker's contract.
// Compares app/content.ts (topics, contact address) and app/page.tsx (field names, select options,
// consent value) with worker/contact/src/contract.ts and worker/contact/wrangler.jsonc.
// Plain Node, no dependencies. Exit: 0 all match, 1 any difference, 2 a source could not be parsed.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL } from "../site.config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const content = read("app/content.ts");
const page = read("app/page.tsx");
const contract = read("worker/contact/src/contract.ts");
const wrangler = read("worker/contact/wrangler.jsonc");
const handler = read("worker/contact/src/handler.ts");

const failures = [];
const fail = (message) => failures.push(message);
const broken = (message) => {
  console.error(`verify-worker-contract: cannot parse ${message}`);
  process.exit(2);
};

const QUOTED = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g;
const strings = (text) => [...text.matchAll(QUOTED)].map((m) => m[1] ?? m[2]);

function arrayConst(source, name, label) {
  const m = source.match(new RegExp(`export const ${name}\\s*=\\s*\\[([^\\]]*)\\]`));
  if (!m) broken(`${name} in ${label}`);
  return strings(m[1]);
}

function stringConst(source, name, label) {
  const m = source.match(new RegExp(`(?:export )?const ${name}\\s*=\\s*('(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*")`));
  if (!m) broken(`${name} in ${label}`);
  return strings(m[1])[0];
}

function objectValues(source, name, label) {
  const m = source.match(new RegExp(`export const ${name}\\s*=\\s*\\{([^}]*)\\}`));
  if (!m) broken(`${name} in ${label}`);
  return [...m[1].matchAll(/:\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g)].map((x) => strings(x[1])[0]);
}

function sameSet(label, site, worker) {
  const missingInWorker = site.filter((v) => !worker.includes(v));
  const extraInWorker = worker.filter((v) => !site.includes(v));
  if (missingInWorker.length) fail(`${label}: in the site but not in the Worker: ${JSON.stringify(missingInWorker)}`);
  if (extraInWorker.length) fail(`${label}: in the Worker but not in the site: ${JSON.stringify(extraInWorker)}`);
}

// Worker side.
const workerTopics = arrayConst(contract, "TOPICS", "contract.ts");
const workerPrefs = arrayConst(contract, "REPLY_PREFS", "contract.ts");
const workerPhonePref = stringConst(contract, "PHONE_PREF", "contract.ts");
const workerConsent = stringConst(contract, "CONSENT_VALUE", "contract.ts");
const workerHoney = stringConst(contract, "HONEYPOT", "contract.ts");
const workerDestination = stringConst(contract, "DESTINATION", "contract.ts");
const workerFields = objectValues(contract, "FIELDS", "contract.ts");
const workerOrigin = stringConst(contract, "ALLOWED_ORIGIN", "contract.ts");
const workerSender = stringConst(contract, "SENDER", "contract.ts");
const limitsMatch = contract.match(/export const LIMITS\s*=\s*\{([^}]*)\}/);
if (!limitsMatch) broken("LIMITS in contract.ts");
const workerLimits = Object.fromEntries([...limitsMatch[1].matchAll(/(\w+)\s*:\s*(\d+)/g)].map((m) => [m[1], Number(m[2])]));
const workerDomain = wrangler.match(/"pattern"\s*:\s*"([^"]*)"/)?.[1];
if (!workerDomain) broken("the custom-domain pattern in wrangler.jsonc");

// Site side.
const topicsMatch = content.match(/export const topics\s*=\s*\[([^\]]*)\]/);
if (!topicsMatch) broken("topics in app/content.ts");
const siteTopics = strings(topicsMatch[1]);
const siteEmail = stringConst(content, "CONTACT_EMAIL", "app/content.ts");

const defaultReply = stringConst(page, "DEFAULT_REPLY", "app/page.tsx");
const phoneReply = stringConst(page, "PHONE_REPLY", "app/page.tsx");
const selectMatch = page.match(/<select[^>]*name="Preferált elérhetőség"[\s\S]*?<\/select>/);
if (!selectMatch) broken('<select name="Preferált elérhetőség"> in app/page.tsx');
const sitePrefs = [...selectMatch[0].matchAll(/<option>([\s\S]*?)<\/option>/g)].map((m) => {
  const inner = m[1].trim();
  const ref = inner.match(/^\{(\w+)\}$/);
  if (!ref) return inner;
  if (ref[1] === "DEFAULT_REPLY") return defaultReply;
  if (ref[1] === "PHONE_REPLY") return phoneReply;
  return broken(`option expression {${ref[1]}} in app/page.tsx`);
});

const formMatch = page.match(/<form[\s\S]*?<\/form>/);
if (!formMatch) broken("<form> in app/page.tsx");
const formNames = [...formMatch[0].matchAll(/\bname="([^"]+)"/g)].map((m) => m[1]);
// Hidden and honeypot inputs start with an underscore; only _honey is part of the contract.
const siteFields = [...new Set(formNames.filter((n) => !n.startsWith("_")))];
const siteHidden = [...new Set(formNames.filter((n) => n.startsWith("_")))];
const consentValue = formMatch[0].match(/name="Adatkezelési hozzájárulás"[^>]*\bvalue="([^"]*)"/)?.[1];

for (const [label, list] of [["site topics", siteTopics], ["Worker topics", workerTopics], ["site reply preferences", sitePrefs], ["Worker reply preferences", workerPrefs], ["site form fields", siteFields], ["Worker fields", workerFields]]) {
  if (list.length === 0) fail(`${label}: parsed to an empty list`);
}
sameSet("topics", siteTopics, workerTopics);
sameSet("reply preferences", sitePrefs, workerPrefs);
sameSet("form field names", siteFields, workerFields);
if (phoneReply !== workerPhonePref) fail(`phone preference: site PHONE_REPLY ${JSON.stringify(phoneReply)} vs Worker ${JSON.stringify(workerPhonePref)}`);
if (consentValue !== workerConsent) fail(`consent value: site ${JSON.stringify(consentValue)} vs Worker ${JSON.stringify(workerConsent)}`);
// maxLength of each text field must equal the Worker's LIMITS.
for (const [key, fieldName, tag] of [["name", "Név", "input"], ["email", "email", "input"], ["phone", "Telefonszám", "input"], ["message", "Üzenet", "textarea"]]) {
  const el = formMatch[0].match(new RegExp(`<${tag}\\b[^>]*\\bname="${fieldName}"[^>]*>`))?.[0];
  if (!el) {
    fail(`maxLength: no <${tag}> named ${fieldName} in the form`);
    continue;
  }
  const siteMax = el.match(/\bmaxLength=\{(\d+)\}/)?.[1];
  if (siteMax === undefined || Number(siteMax) !== workerLimits[key]) fail(`maxLength of ${fieldName}: site ${siteMax} vs Worker LIMITS.${key} ${workerLimits[key]}`);
}
// The form posts to the Worker's custom domain.
const siteEndpoint = stringConst(content, "FORM_ENDPOINT", "app/content.ts");
if (siteEndpoint !== `https://${workerDomain}/`) fail(`endpoint: FORM_ENDPOINT ${JSON.stringify(siteEndpoint)} vs https://${workerDomain}/ from wrangler.jsonc`);
if (!siteHidden.includes(workerHoney)) fail(`honeypot: the form has no input named ${workerHoney}`);
if (!/\binput\[HONEYPOT\]/.test(handler)) fail("honeypot: the Worker handler does not read input[HONEYPOT]");
const siteOrigin = new URL(SITE_URL).origin;
if (workerOrigin !== siteOrigin) fail(`origin: Worker ALLOWED_ORIGIN ${JSON.stringify(workerOrigin)} vs the origin of SITE_URL ${JSON.stringify(siteOrigin)}`);
const senderDomain = workerSender.split("@")[1];
if (senderDomain !== new URL(siteOrigin).host) fail(`sender: domain of SENDER ${JSON.stringify(senderDomain)} vs site host ${JSON.stringify(new URL(siteOrigin).host)}`);
if (workerDestination !== siteEmail) fail(`destination: Worker ${JSON.stringify(workerDestination)} vs CONTACT_EMAIL ${JSON.stringify(siteEmail)}`);
const bindingDestination = wrangler.match(/"destination_address"\s*:\s*"([^"]*)"/)?.[1];
if (bindingDestination !== workerDestination) fail(`destination: wrangler.jsonc ${JSON.stringify(bindingDestination)} vs contract.ts ${JSON.stringify(workerDestination)}`);

if (failures.length) {
  console.error("verify-worker-contract: FAILED");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `verify-worker-contract: ok (${siteTopics.length} topics, ${sitePrefs.length} reply options, ${siteFields.length} fields, honeypot ${workerHoney}, destination matches)`,
);
