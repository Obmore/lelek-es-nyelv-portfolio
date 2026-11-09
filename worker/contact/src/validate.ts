import { CONSENT_VALUE, FIELDS, PHONE_PREF, REPLY_PREFS, TOPICS } from './contract.ts';
import { stripControl } from './mail.ts';
import type { Submission } from './mail.ts';

export type ValidationResult = { ok: true; value: Submission } | { ok: false; field: string };

const PHONE_CHARS = /^[0-9 +\-()/.]*$/;
const LOCAL_PART = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const DOMAIN_LABEL = /^[\p{L}\p{N}-]+$/u;
const TLD = /^\p{L}{2,}$/u;
const HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

function str(input: Record<string, unknown>, key: string): string | undefined {
  const v = Object.hasOwn(input, key) ? input[key] : undefined;
  return typeof v === 'string' ? v : undefined;
}

function validEmail(email: string): boolean {
  if (email.length === 0 || email.length > 254) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts as [string, string];
  if (!LOCAL_PART.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  const labels = domain.split('.');
  if (labels.length < 2) return false;
  for (const label of labels) {
    if (!DOMAIN_LABEL.test(label) || label.startsWith('-') || label.endsWith('-')) return false;
  }
  return TLD.test(labels[labels.length - 1]!);
}

/** Reads exactly the contract fields (own keys only); every other key is ignored. First failure wins. */
export function validate(input: Record<string, unknown>): ValidationResult {
  const topic = str(input, FIELDS.topic);
  if (topic === undefined || !TOPICS.includes(topic)) return { ok: false, field: FIELDS.topic };

  const nameRaw = str(input, FIELDS.name);
  const name = nameRaw === undefined ? undefined : stripControl(nameRaw);
  if (name === undefined || name.length < 1 || name.length > 100 || !HAS_LETTER_OR_DIGIT.test(name)) {
    return { ok: false, field: FIELDS.name };
  }

  const email = str(input, FIELDS.email)?.trim();
  if (email === undefined || !validEmail(email)) return { ok: false, field: FIELDS.email };

  const pref = str(input, FIELDS.pref);
  if (pref === undefined || !REPLY_PREFS.includes(pref)) return { ok: false, field: FIELDS.pref };

  // A missing phone key counts as empty; a present non-string value is invalid.
  const phoneValue = Object.hasOwn(input, FIELDS.phone) ? input[FIELDS.phone] : undefined;
  if (phoneValue !== undefined && typeof phoneValue !== 'string') return { ok: false, field: FIELDS.phone };
  const phone = (phoneValue ?? '').trim();
  if (phone.length > 30 || !PHONE_CHARS.test(phone)) return { ok: false, field: FIELDS.phone };
  if (phone.length > 0 && phone.replace(/\D/g, '').length < 6) return { ok: false, field: FIELDS.phone };
  if (pref === PHONE_PREF && phone.length === 0) return { ok: false, field: FIELDS.phone };

  const message = str(input, FIELDS.message)?.trim();
  if (message === undefined || message.length < 1 || message.length > 5000) return { ok: false, field: FIELDS.message };

  const consent = str(input, FIELDS.consent);
  if (consent !== CONSENT_VALUE) return { ok: false, field: FIELDS.consent };

  return { ok: true, value: { topic, name, email, pref, phone, message, consent } };
}
