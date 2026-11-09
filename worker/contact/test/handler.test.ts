import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handle } from '../src/handler.ts';
import worker from '../src/index.ts';
import { ALLOWED_ORIGIN, DESTINATION, FIELDS } from '../src/contract.ts';
import type { EmailMessage, Env } from '../src/env.ts';

const ORIGIN = 'https://lelekesnyelv.hu';

const SECRET_NAME = 'Éva Őri "Zs" <b>, &';
const SECRET_EMAIL = 'eva.ori@example.hu';
const SECRET_PHONE = '+36 30 123 4567';
const SECRET_MESSAGE = 'Szia, ez titkos üzenet: <script>alert("x")</script> & több\nsor';

function validBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    [FIELDS.topic]: 'Angolóra',
    [FIELDS.name]: SECRET_NAME,
    [FIELDS.email]: SECRET_EMAIL,
    [FIELDS.pref]: 'Telefonon',
    [FIELDS.phone]: SECRET_PHONE,
    [FIELDS.message]: SECRET_MESSAGE,
    [FIELDS.consent]: 'Elfogadva',
    _honey: '',
    _subject: 'attacker subject',
    _template: 'table',
    _captcha: 'false',
    extra: 'UNKNOWN-KEY-VALUE',
    ...overrides,
  };
}

interface Harness {
  env: Env;
  sent: EmailMessage[];
  send: ReturnType<typeof vi.fn>;
  rlIp: ReturnType<typeof vi.fn>;
  rlGlobal: ReturnType<typeof vi.fn>;
}

function makeEnv(opts: { ip?: boolean; global?: boolean; send?: (m: EmailMessage) => Promise<unknown> } = {}): Harness {
  const sent: EmailMessage[] = [];
  const send = vi.fn(async (m: EmailMessage) => {
    sent.push(m);
    return opts.send ? opts.send(m) : { messageId: 'x' };
  });
  const rlIp = vi.fn(async () => ({ success: opts.ip ?? true }));
  const rlGlobal = vi.fn(async () => ({ success: opts.global ?? true }));
  return {
    env: { EMAIL: { send }, RL_IP: { limit: rlIp }, RL_GLOBAL: { limit: rlGlobal } },
    sent,
    send,
    rlIp,
    rlGlobal,
  };
}

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://urlap.lelekesnyelv.hu/', {
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json', ...headers },
    body: (typeof body === 'string' || body instanceof Uint8Array ? body : JSON.stringify(body)) as BodyInit,
  });
}

function streamOf(bytes: Uint8Array, chunk = 4096) {
  let offset = 0;
  const pulls = { count: 0 };
  const stream = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        pulls.count += 1;
        if (offset >= bytes.byteLength) {
          controller.close();
          return;
        }
        controller.enqueue(bytes.slice(offset, offset + chunk));
        offset += chunk;
      },
    },
    { highWaterMark: 0 },
  );
  return { stream, pulls };
}

let logSpy: ReturnType<typeof vi.spyOn>;
let infoSpy: ReturnType<typeof vi.spyOn>;
let warnSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function jsonOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

function expectJson(response: Response) {
  expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
}

function expectCors(response: Response) {
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
  expect(response.headers.get('Vary')).toBe('Origin');
}

function expectNoCors(response: Response) {
  expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  expect(response.headers.get('Access-Control-Allow-Methods')).toBeNull();
}

describe('constants', () => {
  it('uses the exact allowed origin and the destination of the binding', () => {
    expect(ALLOWED_ORIGIN).toBe(ORIGIN);
    expect(DESTINATION).toBe('juhasznagyanna@gmail.com');
  });
});

describe('GET /health', () => {
  it('answers 200 without sending or rate limiting', async () => {
    const h = makeEnv();
    const res = await handle(new Request('https://urlap.lelekesnyelv.hu/health'), h.env);
    expect(res.status).toBe(200);
    expectJson(res);
    expect(await jsonOf(res)).toEqual({ ok: true });
    expect(h.send).not.toHaveBeenCalled();
    expect(h.rlIp).not.toHaveBeenCalled();
    expect(h.rlGlobal).not.toHaveBeenCalled();
  });
});

describe('OPTIONS preflight', () => {
  it('returns the full CORS answer for the allowed origin', async () => {
    const h = makeEnv();
    const res = await handle(new Request('https://urlap.lelekesnyelv.hu/', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), h.env);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('POST');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Accept');
    expect(res.headers.get('Access-Control-Max-Age')).toBe('86400');
    expect(res.headers.get('Vary')).toBe('Origin');
    expectJson(res);
    expect(h.send).not.toHaveBeenCalled();
  });

  it.each(['https://evil.example', 'http://lelekesnyelv.hu', 'https://lelekesnyelv.hu.evil.example', 'https://www.lelekesnyelv.hu', null])(
    'rejects origin %s with 403 JSON and no CORS headers',
    async (origin) => {
      const h = makeEnv();
      const headers: Record<string, string> = origin ? { Origin: origin } : {};
      const res = await handle(new Request('https://urlap.lelekesnyelv.hu/', { method: 'OPTIONS', headers }), h.env);
      expect(res.status).toBe(403);
      expectJson(res);
      expectNoCors(res);
      expect(await jsonOf(res)).toEqual({ success: false, error: 'forbidden' });
    },
  );
});

describe('other methods and paths', () => {
  it.each([
    ['GET', '/'],
    ['PUT', '/'],
    ['DELETE', '/'],
    ['HEAD', '/health'],
    ['POST', '/health'],
    ['POST', '/other'],
    ['GET', '/other'],
    ['OPTIONS', '/other'],
  ])('%s %s answers 405 JSON', async (method, path) => {
    const h = makeEnv();
    const res = await handle(new Request(`https://urlap.lelekesnyelv.hu${path}`, { method, headers: { Origin: ORIGIN } }), h.env);
    expect(res.status).toBe(405);
    expectJson(res);
    if (method !== 'HEAD') expect(await jsonOf(res)).toEqual({ success: false, error: 'method' });
    expect(h.send).not.toHaveBeenCalled();
  });
});

describe('POST /', () => {
  it('rejects a wrong origin with 403, no CORS headers, before rate limiting or reading the body', async () => {
    const h = makeEnv();
    const req = post(validBody(), { Origin: 'https://evil.example' });
    const res = await handle(req, h.env);
    expect(res.status).toBe(403);
    expectJson(res);
    expectNoCors(res);
    expect(await jsonOf(res)).toEqual({ success: false, error: 'forbidden' });
    expect(h.rlIp).not.toHaveBeenCalled();
    expect(req.bodyUsed).toBe(false);
    expect(h.send).not.toHaveBeenCalled();
  });

  it('rejects a missing origin with 403', async () => {
    const h = makeEnv();
    const req = new Request('https://urlap.lelekesnyelv.hu/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody()),
    });
    const res = await handle(req, h.env);
    expect(res.status).toBe(403);
    expect(h.send).not.toHaveBeenCalled();
  });

  it('sends exactly one mail and answers 200 with CORS headers', async () => {
    const h = makeEnv();
    const res = await handle(post(validBody(), { 'cf-connecting-ip': '203.0.113.7' }), h.env);
    expect(res.status).toBe(200);
    expectJson(res);
    expectCors(res);
    expect(await jsonOf(res)).toEqual({ success: true });
    expect(h.send).toHaveBeenCalledTimes(1);
    expect(h.rlIp).toHaveBeenCalledWith({ key: '203.0.113.7' });
    expect(h.rlGlobal).toHaveBeenCalledWith({ key: 'global' });
    const mail = h.sent[0]!;
    expect(mail.to).toBe(DESTINATION);
    expect(mail.from).toEqual({ email: 'urlap@lelekesnyelv.hu', name: 'Lélek & Nyelv űrlap' });
    expect(mail.replyTo.email).toBe(SECRET_EMAIL);
    expect(mail.replyTo.name).toBe(SECRET_NAME);
    expect(mail.subject).toMatch(/^Új megkeresés a Lélek & Nyelv oldalról: Angolóra \(\d{4}\.\d{2}\.\d{2}\. \d{2}:\d{2}\)$/);
    expect(Object.keys(mail).sort()).toEqual(['from', 'html', 'replyTo', 'subject', 'text', 'to']);
  });

  it('uses "unknown" as the rate limit key without cf-connecting-ip', async () => {
    const h = makeEnv();
    await handle(post(validBody()), h.env);
    expect(h.rlIp).toHaveBeenCalledWith({ key: 'unknown' });
  });

  it('writes all 7 fields with Hungarian labels into the text body', async () => {
    const h = makeEnv();
    await handle(post(validBody()), h.env);
    const text = h.sent[0]!.text;
    expect(text).toContain('Téma: Angolóra');
    expect(text).toContain(`Név: ${SECRET_NAME}`);
    expect(text).toContain(`E-mail: ${SECRET_EMAIL}`);
    expect(text).toContain('Preferált elérhetőség: Telefonon');
    expect(text).toContain(`Telefonszám: ${SECRET_PHONE}`);
    expect(text).toContain(`Üzenet: ${SECRET_MESSAGE}`);
    expect(text).toContain('Adatkezelési hozzájárulás: Elfogadva');
  });

  it('escapes special characters in the HTML and keeps them verbatim in the text', async () => {
    const h = makeEnv();
    await handle(post(validBody({ [FIELDS.name]: 'é ő " < , & \'' })), h.env);
    const mail = h.sent[0]!;
    expect(mail.text).toContain('Név: é ő " < , & \'');
    expect(mail.html).toContain('é ő &quot; &lt; , &amp; &#39;');
    expect(mail.html).not.toContain('é ő "');
    expect(mail.html).not.toMatch(/<script/i);
  });

  it('escapes the message in the HTML and keeps its line breaks', async () => {
    const h = makeEnv();
    await handle(post(validBody({ [FIELDS.message]: 'a <b>x</b> & "y"\r\nsecond line\nthird' })), h.env);
    const html = h.sent[0]!.html;
    expect(html).toContain('a &lt;b&gt;x&lt;/b&gt; &amp; &quot;y&quot;<br>second line<br>third');
    expect(html).not.toContain('<b>x</b>');
    expect(html).toContain('<table');
  });

  it('never copies unknown keys into the mail', async () => {
    const h = makeEnv();
    await handle(post(validBody({ headers: { Bcc: 'x@evil.example' }, bcc: 'x@evil.example', to: 'x@evil.example' })), h.env);
    const mail = h.sent[0]!;
    const all = JSON.stringify(mail);
    expect(all).not.toContain('UNKNOWN-KEY-VALUE');
    expect(all).not.toContain('attacker subject');
    expect(all).not.toContain('evil.example');
    expect(mail.subject).not.toContain('attacker');
    expect(mail.to).toBe(DESTINATION);
    expect('headers' in mail).toBe(false);
  });

  it('strips CR/LF and control characters from the Reply-To name', async () => {
    const h = makeEnv();
    await handle(post(validBody({ [FIELDS.name]: 'Anna\r\nBcc: x@evil.example\u0000\u0007 Kiss' })), h.env);
    const name = h.sent[0]!.replyTo.name!;
    expect([...name].some((c) => c.charCodeAt(0) < 32)).toBe(false);
    expect(name).toBe('Anna Bcc: x@evil.example Kiss');
  });

  it('accepts a missing phone when the preference is not Telefonon', async () => {
    const h = makeEnv();
    const body = validBody({ [FIELDS.pref]: 'E-mailben' });
    delete body[FIELDS.phone];
    const res = await handle(post(body), h.env);
    expect(res.status).toBe(200);
    expect(h.send).toHaveBeenCalledTimes(1);
  });

  it('accepts an empty phone for Mindegy and accepts every topic', async () => {
    for (const topic of ['Mentálhigiénés beszélgetés', 'Angolóra', 'Mindkettő', 'Egyéb']) {
      const h = makeEnv();
      const res = await handle(post(validBody({ [FIELDS.topic]: topic, [FIELDS.pref]: 'Mindegy', [FIELDS.phone]: '' })), h.env);
      expect(res.status).toBe(200);
      expect(h.sent[0]!.subject).toContain(`oldalról: ${topic} (`);
    }
  });

  it('rejects another content type with 415, with CORS headers', async () => {
    const h = makeEnv();
    const req = post(JSON.stringify(validBody()), { 'Content-Type': 'text/plain' });
    const res = await handle(req, h.env);
    expect(res.status).toBe(415);
    expectJson(res);
    expectCors(res);
    expect(await jsonOf(res)).toEqual({ success: false, error: 'unsupported_type' });
    expect(h.send).not.toHaveBeenCalled();
  });

  it('accepts application/json with a charset parameter', async () => {
    const h = makeEnv();
    const res = await handle(post(validBody(), { 'Content-Type': 'application/json; charset=utf-8' }), h.env);
    expect(res.status).toBe(200);
  });

  it('answers 400 invalid_json for malformed JSON, arrays, null and scalars', async () => {
    for (const raw of ['{not json', '[]', 'null', '42', '"text"', '']) {
      const h = makeEnv();
      const res = await handle(post(raw), h.env);
      expect(res.status, raw).toBe(400);
      expectCors(res);
      expect(await jsonOf(res)).toEqual({ success: false, error: 'invalid_json' });
      expect(h.send).not.toHaveBeenCalled();
    }
  });

  it('answers 400 invalid_json for a body that is not valid UTF-8', async () => {
    const h = makeEnv();
    const req = new Request('https://urlap.lelekesnyelv.hu/', {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: new Uint8Array([0x7b, 0x22, 0xff, 0xfe, 0x22, 0x7d]),
    });
    const res = await handle(req, h.env);
    expect(res.status).toBe(400);
    expect(await jsonOf(res)).toEqual({ success: false, error: 'invalid_json' });
  });

  it('answers 413 for a 40 KiB body streamed without Content-Length', async () => {
    const h = makeEnv();
    const bytes = new TextEncoder().encode(JSON.stringify(validBody({ [FIELDS.message]: 'x'.repeat(40 * 1024) })));
    const { stream } = streamOf(bytes);
    const req = new Request('https://urlap.lelekesnyelv.hu/', {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: stream,
      duplex: 'half',
    } as RequestInit);
    expect(req.headers.get('Content-Length')).toBeNull();
    const res = await handle(req, h.env);
    expect(res.status).toBe(413);
    expectJson(res);
    expectCors(res);
    expect(await jsonOf(res)).toEqual({ success: false, error: 'too_large' });
    expect(h.send).not.toHaveBeenCalled();
  });

  it('stops reading the stream at the cap instead of draining it', async () => {
    const h = makeEnv();
    const bytes = new Uint8Array(10 * 1024 * 1024).fill(0x61);
    const { stream, pulls } = streamOf(bytes, 4096);
    const req = new Request('https://urlap.lelekesnyelv.hu/', {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: stream,
      duplex: 'half',
    } as RequestInit);
    const res = await handle(req, h.env);
    expect(res.status).toBe(413);
    expect(pulls.count).toBeLessThan(20);
  });

  it('does not trust a small Content-Length header', async () => {
    const h = makeEnv();
    const bytes = new TextEncoder().encode(JSON.stringify(validBody({ [FIELDS.message]: 'x'.repeat(40 * 1024) })));
    const { stream } = streamOf(bytes);
    const req = new Request('https://urlap.lelekesnyelv.hu/', {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'Content-Length': '100' },
      body: stream,
      duplex: 'half',
    } as RequestInit);
    const res = await handle(req, h.env);
    expect(res.status).toBe(413);
  });

  it('accepts a body just under the cap', async () => {
    const h = makeEnv();
    const res = await handle(post(validBody({ [FIELDS.message]: 'y'.repeat(5000), extra: 'z'.repeat(20 * 1024) })), h.env);
    expect(res.status).toBe(200);
  });

  describe('honeypot', () => {
    it('answers 200 success, sends nothing and logs the outcome honeypot', async () => {
      const h = makeEnv();
      const res = await handle(post(validBody({ _honey: 'bot' })), h.env);
      expect(res.status).toBe(200);
      expectCors(res);
      expect(await jsonOf(res)).toEqual({ success: true });
      expect(h.send).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect((logSpy.mock.calls[0]![0] as { outcome: string }).outcome).toBe('honeypot');
    });

    it('triggers even when the other fields are invalid', async () => {
      const h = makeEnv();
      const res = await handle(post({ _honey: 'x' }), h.env);
      expect(res.status).toBe(200);
      expect(h.send).not.toHaveBeenCalled();
    });
  });

  describe('rate limits', () => {
    it('answers 429 when the IP limit is exceeded, before reading the body', async () => {
      const h = makeEnv({ ip: false });
      const { stream, pulls } = streamOf(new TextEncoder().encode(JSON.stringify(validBody())));
      const req = new Request('https://urlap.lelekesnyelv.hu/', {
        method: 'POST',
        headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
        body: stream,
        duplex: 'half',
      } as RequestInit);
      const res = await handle(req, h.env);
      expect(res.status).toBe(429);
      expectJson(res);
      expectCors(res);
      expect(await jsonOf(res)).toEqual({ success: false, error: 'rate_limited' });
      expect(req.bodyUsed).toBe(false);
      expect(pulls.count).toBe(0);
      expect(h.send).not.toHaveBeenCalled();
    });

    it('answers 429 when the global limit is exceeded, before reading the body', async () => {
      const h = makeEnv({ global: false });
      const req = post(validBody());
      const res = await handle(req, h.env);
      expect(res.status).toBe(429);
      expect(h.rlIp).toHaveBeenCalledTimes(1);
      expect(h.rlGlobal).toHaveBeenCalledTimes(1);
      expect(req.bodyUsed).toBe(false);
      expect(h.send).not.toHaveBeenCalled();
    });

    it('rate limits before the content type and honeypot checks', async () => {
      const h = makeEnv({ ip: false });
      const res = await handle(post('x', { 'Content-Type': 'text/plain' }), h.env);
      expect(res.status).toBe(429);
    });
  });

  describe('validation', () => {
    const cases: [string, Record<string, unknown>, string][] = [
      ['unknown topic', { [FIELDS.topic]: 'Valami más' }, FIELDS.topic],
      ['missing topic', { [FIELDS.topic]: undefined }, FIELDS.topic],
      ['non-string topic', { [FIELDS.topic]: 3 }, FIELDS.topic],
      ['empty name', { [FIELDS.name]: '   ' }, FIELDS.name],
      ['101-char name', { [FIELDS.name]: 'n'.repeat(101) }, FIELDS.name],
      ['non-string name', { [FIELDS.name]: ['Anna'] }, FIELDS.name],
      ['email without @', { [FIELDS.email]: 'nincs.kukac.hu' }, FIELDS.email],
      ['email with two @', { [FIELDS.email]: 'a@b@c.hu' }, FIELDS.email],
      ['email without dot in domain', { [FIELDS.email]: 'a@localhost' }, FIELDS.email],
      ['email with space', { [FIELDS.email]: 'a b@c.hu' }, FIELDS.email],
      ['email with <', { [FIELDS.email]: 'a<b@c.hu' }, FIELDS.email],
      ['email with >', { [FIELDS.email]: 'a>b@c.hu' }, FIELDS.email],
      ['email with comma', { [FIELDS.email]: 'a@b.hu,x@evil.hu' }, FIELDS.email],
      ['email with semicolon', { [FIELDS.email]: 'a@b.hu;x@evil.hu' }, FIELDS.email],
      ['email with LF', { [FIELDS.email]: 'a@b.hu\nBcc: x@evil.hu' }, FIELDS.email],
      ['email with CR', { [FIELDS.email]: 'a@b.hu\rBcc: x@evil.hu' }, FIELDS.email],
      ['255-char email', { [FIELDS.email]: `${'a'.repeat(244)}@example.hu` }, FIELDS.email],
      ['empty local part', { [FIELDS.email]: '@example.hu' }, FIELDS.email],
      ['non-string email', { [FIELDS.email]: 5 }, FIELDS.email],
      ['unknown preference', { [FIELDS.pref]: 'Postán' }, FIELDS.pref],
      ['non-string preference', { [FIELDS.pref]: null }, FIELDS.pref],
      ['phone required for Telefonon', { [FIELDS.pref]: 'Telefonon', [FIELDS.phone]: '  ' }, FIELDS.phone],
      ['phone missing for Telefonon', { [FIELDS.pref]: 'Telefonon', [FIELDS.phone]: undefined }, FIELDS.phone],
      ['phone with letters', { [FIELDS.phone]: '06 30 abc' }, FIELDS.phone],
      ['phone over 30 chars', { [FIELDS.phone]: '1'.repeat(31) }, FIELDS.phone],
      ['non-string phone', { [FIELDS.phone]: 123456 }, FIELDS.phone],
      ['empty message', { [FIELDS.message]: ' \n ' }, FIELDS.message],
      ['5001-char message', { [FIELDS.message]: 'm'.repeat(5001) }, FIELDS.message],
      ['non-string message', { [FIELDS.message]: { a: 1 } }, FIELDS.message],
      ['missing consent', { [FIELDS.consent]: undefined }, FIELDS.consent],
      ['wrong consent', { [FIELDS.consent]: 'igen' }, FIELDS.consent],
      ['boolean consent', { [FIELDS.consent]: true }, FIELDS.consent],
    ];

    it.each(cases)('rejects %s with 400 and the field name', async (_label, overrides, field) => {
      const h = makeEnv();
      const body = validBody(overrides);
      for (const [k, v] of Object.entries(overrides)) if (v === undefined) delete body[k];
      const res = await handle(post(body), h.env);
      expect(res.status).toBe(400);
      expectJson(res);
      expectCors(res);
      expect(await jsonOf(res)).toEqual({ success: false, error: 'invalid', field });
      expect(h.send).not.toHaveBeenCalled();
    });

    it('reports the first failing field in contract order', async () => {
      const h = makeEnv();
      const res = await handle(post(validBody({ [FIELDS.message]: '', [FIELDS.name]: '' })), h.env);
      expect(await jsonOf(res)).toEqual({ success: false, error: 'invalid', field: FIELDS.name });
    });

    it('accepts boundary values', async () => {
      const h = makeEnv();
      const res = await handle(
        post(
          validBody({
            [FIELDS.name]: 'n'.repeat(100),
            [FIELDS.email]: `${'a'.repeat(64)}@${'b'.repeat(60)}.hu`,
            [FIELDS.phone]: '+36 (30) 123-4567'.padEnd(30, '0'),
            [FIELDS.message]: 'm'.repeat(5000),
          }),
        ),
        h.env,
      );
      expect(res.status).toBe(200);
    });
  });

  describe('send failures', () => {
    it('answers 502 send_failed when send() throws, without logging the error', async () => {
      const err = Object.assign(new Error(`failed for ${SECRET_EMAIL} ${SECRET_MESSAGE}`), { code: 'E_DELIVERY_FAILED' });
      const h = makeEnv({
        send: async () => {
          throw err;
        },
      });
      const res = await handle(post(validBody()), h.env);
      expect(res.status).toBe(502);
      expectJson(res);
      expectCors(res);
      expect(await jsonOf(res)).toEqual({ success: false, error: 'send_failed' });
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy.mock.calls[0]![0]).toMatchObject({ outcome: 'send_failed', status: 502, code: 'E_DELIVERY_FAILED' });
      expect(JSON.stringify(logSpy.mock.calls)).not.toContain(SECRET_EMAIL);
    });

    it('answers 504 send_timeout when send() is too slow', async () => {
      const h = makeEnv({ send: () => new Promise(() => undefined) });
      const res = await handle(post(validBody()), h.env, { sendTimeoutMs: 20 });
      expect(res.status).toBe(504);
      expectJson(res);
      expectCors(res);
      expect(await jsonOf(res)).toEqual({ success: false, error: 'send_timeout' });
      expect(h.send).toHaveBeenCalledTimes(1);
    });

    it('does not time out a send that finishes in time', async () => {
      const h = makeEnv({ send: () => new Promise((resolve) => setTimeout(() => resolve({}), 5)) });
      const res = await handle(post(validBody()), h.env, { sendTimeoutMs: 500 });
      expect(res.status).toBe(200);
    });
  });
});

describe('logging', () => {
  it('writes exactly one log line per request with only outcome, status and ms', async () => {
    const scenarios: [Request, Parameters<typeof makeEnv>[0], string][] = [
      [new Request('https://urlap.lelekesnyelv.hu/health'), {}, 'health'],
      [new Request('https://urlap.lelekesnyelv.hu/', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), {}, 'preflight'],
      [new Request('https://urlap.lelekesnyelv.hu/', { method: 'GET' }), {}, 'method'],
      [post(validBody(), { Origin: 'https://evil.example' }), {}, 'forbidden'],
      [post(validBody()), { ip: false }, 'rate_limited'],
      [post('x', { 'Content-Type': 'text/plain' }), {}, 'unsupported_type'],
      [post('{oops'), {}, 'invalid_json'],
      [post(validBody({ _honey: 'x' })), {}, 'honeypot'],
      [post(validBody({ [FIELDS.consent]: 'nem' })), {}, 'invalid'],
      [post(validBody()), {}, 'ok'],
    ];
    for (const [req, opts, outcome] of scenarios) {
      logSpy.mockClear();
      const h = makeEnv(opts);
      await handle(req, h.env);
      expect(logSpy, outcome).toHaveBeenCalledTimes(1);
      const line = logSpy.mock.calls[0]![0] as Record<string, unknown>;
      expect(Object.keys(line).sort(), outcome).toEqual(['ms', 'outcome', 'status']);
      expect(line.outcome).toBe(outcome);
      expect(typeof line.ms).toBe('number');
    }
  });

  it('uses the injected clock for ms', async () => {
    const h = makeEnv();
    let t = 1000;
    await handle(new Request('https://urlap.lelekesnyelv.hu/health'), h.env, { now: () => (t += 7) });
    expect((logSpy.mock.calls[0]![0] as { ms: number }).ms).toBe(7);
  });

  it('never logs a submitted value on any path', async () => {
    const huge = new TextEncoder().encode(JSON.stringify(validBody({ [FIELDS.message]: `${SECRET_MESSAGE}${'x'.repeat(40 * 1024)}` })));
    const thrown = Object.assign(new Error(`${SECRET_NAME} ${SECRET_EMAIL} ${SECRET_PHONE} ${SECRET_MESSAGE}`), { code: 'E_INTERNAL_SERVER_ERROR' });
    const runs: Array<() => Promise<Response>> = [
      () => handle(post(validBody()), makeEnv().env),
      () => handle(post(validBody({ _honey: SECRET_NAME })), makeEnv().env),
      () => handle(post(validBody({ [FIELDS.consent]: SECRET_MESSAGE })), makeEnv().env),
      () => handle(post(validBody({ [FIELDS.topic]: SECRET_MESSAGE })), makeEnv().env),
      () => handle(post(validBody({ [FIELDS.email]: `${SECRET_NAME}@${SECRET_EMAIL}` })), makeEnv().env),
      () => handle(post(validBody()), makeEnv({ ip: false }).env),
      () => handle(post(validBody(), { Origin: 'https://evil.example' }), makeEnv().env),
      () => handle(post(JSON.stringify(validBody()), { 'Content-Type': 'text/plain' }), makeEnv().env),
      () => handle(post(`${JSON.stringify(validBody())}{`), makeEnv().env),
      () => handle(post(huge), makeEnv().env),
      () =>
        handle(
          post(validBody()),
          makeEnv({
            send: async () => {
              throw thrown;
            },
          }).env,
        ),
      () => handle(post(validBody()), makeEnv({ send: () => new Promise(() => undefined) }).env, { sendTimeoutMs: 10 }),
    ];
    for (const run of runs) await run();

    const calls = [...logSpy.mock.calls, ...infoSpy.mock.calls, ...warnSpy.mock.calls, ...errorSpy.mock.calls];
    expect(calls.length).toBe(runs.length);
    const dump = JSON.stringify(calls);
    for (const secret of [SECRET_NAME, SECRET_EMAIL, SECRET_PHONE, SECRET_MESSAGE, 'Éva', 'Őri', 'eva.ori', '30 123', 'titkos', 'UNKNOWN-KEY-VALUE']) {
      expect(dump, secret).not.toContain(secret);
    }
  });
});

describe('send() is never called on a rejection path', () => {
  it('covers every rejection', async () => {
    const huge = new TextEncoder().encode(JSON.stringify(validBody({ [FIELDS.message]: 'x'.repeat(40 * 1024) })));
    const requests: Array<[Request, Parameters<typeof makeEnv>[0]]> = [
      [new Request('https://urlap.lelekesnyelv.hu/health'), {}],
      [new Request('https://urlap.lelekesnyelv.hu/', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), {}],
      [new Request('https://urlap.lelekesnyelv.hu/', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } }), {}],
      [new Request('https://urlap.lelekesnyelv.hu/', { method: 'GET' }), {}],
      [post(validBody(), { Origin: 'https://evil.example' }), {}],
      [post(validBody()), { ip: false }],
      [post(validBody()), { global: false }],
      [post(validBody(), { 'Content-Type': 'text/plain' }), {}],
      [post(huge), {}],
      [post('{'), {}],
      [post(validBody({ _honey: 'x' })), {}],
      [post(validBody({ [FIELDS.name]: '' })), {}],
    ];
    for (const [req, opts] of requests) {
      const h = makeEnv(opts);
      await handle(req, h.env);
      expect(h.send).not.toHaveBeenCalled();
    }
  });
});

describe('subject', () => {
  async function subjectAt(iso: string, topic = 'Angolóra'): Promise<string> {
    const h = makeEnv();
    await handle(post(validBody({ [FIELDS.topic]: topic })), h.env, { now: () => Date.parse(iso) });
    return h.sent[0]!.subject;
  }

  it('appends the Budapest time in winter (CET, UTC+1)', async () => {
    expect(await subjectAt('2026-11-09T19:53:00Z')).toBe('Új megkeresés a Lélek & Nyelv oldalról: Angolóra (2026.11.09. 20:53)');
    expect(await subjectAt('2026-01-15T10:05:00Z')).toBe('Új megkeresés a Lélek & Nyelv oldalról: Angolóra (2026.01.15. 11:05)');
  });

  it('appends the Budapest time in summer (CEST, UTC+2)', async () => {
    expect(await subjectAt('2026-07-15T10:05:00Z')).toBe('Új megkeresés a Lélek & Nyelv oldalról: Angolóra (2026.07.15. 12:05)');
  });

  it('rolls over midnight with 00 hours, not 24', async () => {
    expect(await subjectAt('2026-01-14T23:30:00Z', 'Egyéb')).toBe('Új megkeresés a Lélek & Nyelv oldalról: Egyéb (2026.01.15. 00:30)');
  });

  it('gives two submissions a minute apart different subjects', async () => {
    const a = await subjectAt('2026-11-09T19:53:00Z');
    const b = await subjectAt('2026-11-09T19:54:00Z');
    expect(a).not.toBe(b);
  });

  it('contains no visitor text', async () => {
    const subject = await subjectAt('2026-11-09T19:53:00Z');
    for (const secret of ['Éva', 'Őri', SECRET_EMAIL, SECRET_PHONE, 'titkos', 'UNKNOWN-KEY-VALUE', 'attacker']) {
      expect(subject).not.toContain(secret);
    }
  });
});

describe('default export', () => {
  it('delegates fetch to handle', async () => {
    const h = makeEnv();
    const res = await worker.fetch(new Request('https://urlap.lelekesnyelv.hu/health'), h.env);
    expect(res.status).toBe(200);
    expect(await jsonOf(res)).toEqual({ ok: true });
    const sent = await worker.fetch(post(validBody()), h.env);
    expect(sent.status).toBe(200);
    expect(h.send).toHaveBeenCalledTimes(1);
  });
});
