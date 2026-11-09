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

/** Display name for Reply-To: no CR/LF or other control characters. */
export function cleanDisplayName(value: string): string {
  return value.replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim();
}

export function buildSubject(topic: string): string {
  return `Új megkeresés a Lélek & Nyelv oldalról: ${topic}`;
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
