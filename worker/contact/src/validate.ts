import { CONSENT_VALUE, FIELDS, PHONE_PREF, REPLY_PREFS, TOPICS } from './contract.ts';
import type { Submission } from './mail.ts';

export type ValidationResult = { ok: true; value: Submission } | { ok: false; field: string };

const EMAIL_FORBIDDEN = /[\s<>,;]/;
const PHONE_CHARS = /^[0-9 +\-()]*$/;

function str(input: Record<string, unknown>, key: string): string | undefined {
  const v = input[key];
  return typeof v === 'string' ? v : undefined;
}

function validEmail(email: string): boolean {
  if (email.length === 0 || email.length > 254) return false;
  if (EMAIL_FORBIDDEN.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts as [string, string];
  if (!local || !domain.includes('.')) return false;
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  return true;
}

/** Reads exactly the contract fields; every other key is ignored. First failure wins. */
export function validate(input: Record<string, unknown>): ValidationResult {
  const topic = str(input, FIELDS.topic);
  if (topic === undefined || !TOPICS.includes(topic)) return { ok: false, field: FIELDS.topic };

  const nameRaw = str(input, FIELDS.name);
  const name = nameRaw?.trim();
  if (name === undefined || name.length < 1 || name.length > 100) return { ok: false, field: FIELDS.name };

  const emailRaw = str(input, FIELDS.email);
  const email = emailRaw?.trim();
  if (email === undefined || !validEmail(email)) return { ok: false, field: FIELDS.email };

  const pref = str(input, FIELDS.pref);
  if (pref === undefined || !REPLY_PREFS.includes(pref)) return { ok: false, field: FIELDS.pref };

  // A missing phone key counts as empty; a present non-string value is invalid.
  const phoneValue = input[FIELDS.phone];
  if (phoneValue !== undefined && typeof phoneValue !== 'string') return { ok: false, field: FIELDS.phone };
  const phone = (phoneValue ?? '').trim();
  if (phone.length > 30 || !PHONE_CHARS.test(phone)) return { ok: false, field: FIELDS.phone };
  if (pref === PHONE_PREF && phone.length === 0) return { ok: false, field: FIELDS.phone };

  const message = str(input, FIELDS.message)?.trim();
  if (message === undefined || message.length < 1 || message.length > 5000) return { ok: false, field: FIELDS.message };

  const consent = str(input, FIELDS.consent);
  if (consent !== CONSENT_VALUE) return { ok: false, field: FIELDS.consent };

  return { ok: true, value: { topic, name, email, pref, phone, message, consent } };
}
