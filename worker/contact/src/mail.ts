export interface Submission {
  topic: string;
  name: string;
  email: string;
  pref: string;
  phone: string;
  message: string;
  consent: string;
}

const LABELS: [keyof Submission, string][] = [
  ['topic', 'Téma'],
  ['name', 'Név'],
  ['email', 'E-mail'],
  ['pref', 'Preferált elérhetőség'],
  ['phone', 'Telefonszám'],
  ['message', 'Üzenet'],
  ['consent', 'Adatkezelési hozzájárulás'],
];

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

/** The visitor's name without control characters (used for validation and the mail body). */
export function stripControl(value: string): string {
  return value.replace(CONTROL_CHARS, ' ').trim();
}

/** Reply-To display name: control characters and the address/quoting characters <>"@,;:\ become spaces. */
export function cleanDisplayName(value: string): string {
  return value
    .replace(CONTROL_CHARS, ' ')
    .replace(/[<>"@,;:\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Reply-To address with the domain converted to ASCII (punycode) through the URL API; the mail body keeps the typed address. */
export function asciiEmail(email: string): string {
  const at = email.lastIndexOf('@');
  try {
    return `${email.slice(0, at)}@${new URL(`http://${email.slice(at + 1)}`).hostname}`;
  } catch {
    return email;
  }
}

const BUDAPEST_TIME = new Intl.DateTimeFormat('hu-HU', {
  timeZone: 'Europe/Budapest',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** 'YYYY.MM.DD. HH:MM' in Budapest local time, built from parts so it does not depend on the locale's separators. */
export function formatBudapestTime(epochMs: number): string {
  const p: Record<string, string> = {};
  for (const part of BUDAPEST_TIME.formatToParts(new Date(epochMs))) p[part.type] = part.value;
  return `${p.year}.${p.month}.${p.day}. ${p.hour}:${p.minute}`;
}

/** Topic is an allowlisted value; the time makes the subject unique so Gmail does not thread all visitors together. */
export function buildSubject(topic: string, epochMs: number): string {
  return `Új megkeresés a Lélek & Nyelv oldalról: ${topic} (${formatBudapestTime(epochMs)})`;
}

export function buildText(s: Submission): string {
  return LABELS.map(([key, label]) => `${label}: ${s[key]}`).join('\n') + '\n';
}

export function buildHtml(s: Submission): string {
  const rows = LABELS.map(([key, label]) => {
    const value = escapeHtml(s[key]).replace(/\r\n|\r|\n/g, '<br>');
    return `<tr><th align="left" valign="top" style="padding:4px 12px 4px 0">${escapeHtml(label)}</th><td style="padding:4px 0">${value}</td></tr>`;
  }).join('');
  return `<table cellpadding="0" cellspacing="0" style="font-family:sans-serif;font-size:15px">${rows}</table>`;
}
