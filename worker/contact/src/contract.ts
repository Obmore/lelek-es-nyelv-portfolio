// The form contract shared with the site. scripts/verify-worker-contract.mjs reads this file with
// simple regexes and compares it with app/content.ts and app/page.tsx, so keep each list as a
// plain array literal of single-quoted strings.

export const ALLOWED_ORIGIN = 'https://lelekesnyelv.hu';
export const DESTINATION = 'juhasznagyanna@gmail.com';
export const SENDER = 'urlap@lelekesnyelv.hu';
export const SENDER_NAME = 'Lélek & Nyelv űrlap';

export const TOPICS = ['Mentálhigiénés beszélgetés', 'Angolóra', 'Mindkettő', 'Egyéb'];
export const REPLY_PREFS = ['E-mailben', 'Telefonon', 'Mindegy'];
export const PHONE_PREF = 'Telefonon';
export const CONSENT_VALUE = 'Elfogadva';
export const HONEYPOT = '_honey';

export const FIELDS = {
  topic: 'Megkeresés témája',
  name: 'Név',
  email: 'email',
  pref: 'Preferált elérhetőség',
  phone: 'Telefonszám',
  message: 'Üzenet',
  consent: 'Adatkezelési hozzájárulás',
};
