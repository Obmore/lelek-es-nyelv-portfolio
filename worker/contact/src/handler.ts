import { ALLOWED_ORIGIN, DESTINATION, HONEYPOT, SENDER, SENDER_NAME } from './contract.ts';
import type { Deps, Env } from './env.ts';
import { buildHtml, buildSubject, buildText, cleanDisplayName } from './mail.ts';
import { validate } from './validate.ts';

const MAX_BODY_BYTES = 32 * 1024;
const DEFAULT_SEND_TIMEOUT_MS = 10_000;

type Outcome =
  | 'ok'
  | 'honeypot'
  | 'invalid'
  | 'forbidden'
  | 'rate_limited'
  | 'too_large'
  | 'unsupported_type'
  | 'invalid_json'
  | 'send_failed'
  | 'send_timeout'
  | 'method'
  | 'health'
  | 'preflight';

interface Routed {
  response: Response;
  outcome: Outcome;
  code?: string;
}

class TooLargeError extends Error {}
class SendTimeoutError extends Error {}

function json(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });
}

/** Reads the request body as a stream and stops at the cap, whatever Content-Length says. */
async function readCapped(request: Request): Promise<Uint8Array> {
  if (!request.body) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new TooLargeError();
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

async function sendWithTimeout(send: () => Promise<unknown>, ms: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new SendTimeoutError()), ms);
  });
  try {
    await Promise.race([send(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Only the string code of a send() error is ever logged, and only if it looks like a known code. */
function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string' && /^E_[A-Z_]{1,60}$/.test(code)) return code;
  }
  return undefined;
}

async function route(request: Request, env: Env, deps: Deps): Promise<Routed> {
  const url = new URL(request.url);
  const allowed = request.headers.get('Origin') === ALLOWED_ORIGIN;
  const cors = { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, Vary: 'Origin' };
  const forbidden: Routed = { response: json(403, { success: false, error: 'forbidden' }), outcome: 'forbidden' };

  if (request.method === 'GET' && url.pathname === '/health') {
    return { response: json(200, { ok: true }), outcome: 'health' };
  }

  if (request.method === 'OPTIONS' && url.pathname === '/') {
    if (!allowed) return forbidden;
    return {
      response: json(204, null, {
        ...cors,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Max-Age': '86400',
      }),
      outcome: 'preflight',
    };
  }

  if (request.method !== 'POST' || url.pathname !== '/') {
    return { response: json(405, { success: false, error: 'method' }), outcome: 'method' };
  }

  if (!allowed) return forbidden;

  const reply = (status: number, body: unknown, outcome: Outcome, code?: string): Routed => ({
    response: json(status, body, cors),
    outcome,
    code,
  });

  // Rate limits run before the body is read. If the limiter itself throws, the request goes on.
  try {
    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
    const byIp = await env.RL_IP.limit({ key: ip });
    const overall = byIp.success ? await env.RL_GLOBAL.limit({ key: 'global' }) : byIp;
    if (!byIp.success || !overall.success) {
      return reply(429, { success: false, error: 'rate_limited' }, 'rate_limited');
    }
  } catch {
    // fail open
  }

  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return reply(415, { success: false, error: 'unsupported_type' }, 'unsupported_type');
  }

  let bytes: Uint8Array;
  try {
    bytes = await readCapped(request);
  } catch (error) {
    if (error instanceof TooLargeError) return reply(413, { success: false, error: 'too_large' }, 'too_large');
    return reply(400, { success: false, error: 'invalid_json' }, 'invalid_json');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    return reply(400, { success: false, error: 'invalid_json' }, 'invalid_json');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return reply(400, { success: false, error: 'invalid_json' }, 'invalid_json');
  }
  const input = parsed as Record<string, unknown>;

  const honey = input[HONEYPOT];
  if (honey !== undefined && honey !== null && honey !== '') {
    return reply(200, { success: true }, 'honeypot');
  }

  const result = validate(input);
  if (!result.ok) {
    return reply(400, { success: false, error: 'invalid', field: result.field }, 'invalid');
  }
  const s = result.value;

  try {
    await sendWithTimeout(
      () =>
        env.EMAIL.send({
          to: DESTINATION,
          from: { email: SENDER, name: SENDER_NAME },
          replyTo: { email: s.email, name: cleanDisplayName(s.name) },
          subject: buildSubject(s.topic, (deps.now ?? Date.now)()),
          text: buildText(s),
          html: buildHtml(s),
        }),
      deps.sendTimeoutMs ?? DEFAULT_SEND_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof SendTimeoutError) return reply(504, { success: false, error: 'send_timeout' }, 'send_timeout');
    return reply(502, { success: false, error: 'send_failed' }, 'send_failed', errorCode(error));
  }

  return reply(200, { success: true }, 'ok');
}

export async function handle(request: Request, env: Env, deps: Deps = {}): Promise<Response> {
  const now = deps.now ?? Date.now;
  const started = now();
  const { response, outcome, code } = await route(request, env, deps);
  // The only log line per request: outcome, status and duration. Never a submitted value.
  const line: Record<string, unknown> = { outcome, status: response.status, ms: now() - started };
  if (code) line.code = code;
  console.log(line);
  return response;
}
