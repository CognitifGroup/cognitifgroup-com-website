/**
 * Hop C proxy tests — CGL-MESSAGING-PROTOCOL-001 v1.0 §4.
 *
 *   node --test api/__tests__/petalyx-proxy.test.mjs
 *
 * Upstream is stubbed, so these run with no credentials and no network.
 * Two rules are load-bearing and are asserted on every path:
 *   1. only the documented fields are ever forwarded
 *   2. X-Widget-Key never appears in anything sent back to the browser
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.PETALYX_BASE_URL   = 'http://stub.invalid:8300/';   // trailing slash on purpose
process.env.PETALYX_WIDGET_KEY = 'stub-widget-key';

const initiate = (await import('../petalyx-initiate.js')).default;
const respond  = (await import('../petalyx-response.js')).default;
const abandon  = (await import('../petalyx-abandon.js')).default;

const TOKEN = 'a'.repeat(64);
let calls = [];

function stubUpstream(status, body) {
  globalThis.fetch = async (url, opts) => {
    calls.push({ url, opts });
    return {
      status,
      headers: { get: () => 'application/json' },
      text: async () => JSON.stringify(body),
    };
  };
}

function mockRes() {
  const r = { code: 0, headers: {}, body: null };
  r.status = c => { r.code = c; return r; };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.json = b => { r.body = b; return r; };
  r.send = b => { r.body = b; return r; };
  return r;
}

const req = body => ({ method: 'POST', body });
const beforeEach = () => { calls = []; };

// ---------- initiate ----------

test('initiate posts to the §4.1 path with X-Widget-Key', async () => {
  beforeEach();
  stubUpstream(200, { session_token: TOKEN, status: 'initiated', roster: [], iterations: [] });
  const res = mockRes();
  await initiate(req({ version_id: 'v9_dev', gender: 'F', age_band: '18-34' }), res);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://stub.invalid:8300/petalyx/session/initiate');
  assert.equal(calls[0].opts.headers['X-Widget-Key'], 'stub-widget-key');
  assert.equal(calls[0].opts.headers['X-Gateway-Key'], undefined);
  assert.equal(res.code, 200);
});

test('initiate forwards exactly the three documented fields', async () => {
  beforeEach();
  stubUpstream(200, {});
  await initiate(req({
    version_id: 'v9_dev', gender: 'M', age_band: '55+',
    dimension_id: 'loyalty', edition_id: 'arsenal', cosine: 1, extra: 'x',
  }), mockRes());
  assert.deepEqual(JSON.parse(calls[0].opts.body),
    { version_id: 'v9_dev', gender: 'M', age_band: '55+' });
});

test('initiate rejects a bad demographic without spending an upstream call', async () => {
  beforeEach();
  stubUpstream(200, {});
  const res = mockRes();
  await initiate(req({ version_id: 'v9_dev', gender: 'X', age_band: '18-34' }), res);
  assert.equal(calls.length, 0);
  assert.equal(res.code, 400);
});

test('initiate relays 500 session_initiation_failed unchanged', async () => {
  beforeEach();
  stubUpstream(500, { error: 'session_initiation_failed' });
  const res = mockRes();
  await initiate(req({ version_id: 'v9_dev', gender: 'F', age_band: '18-34' }), res);
  assert.equal(res.code, 500);
  assert.equal(JSON.parse(res.body).error, 'session_initiation_failed');
});

test('initiate relays 404 session_unavailable unchanged', async () => {
  beforeEach();
  stubUpstream(404, { error: 'session_unavailable' });
  const res = mockRes();
  await initiate(req({ version_id: 'nope', gender: 'F', age_band: '18-34' }), res);
  assert.equal(res.code, 404);
});

// ---------- response ----------

test('response puts the token in the path and the three fields in the body', async () => {
  beforeEach();
  stubUpstream(200, { status: 'received', position: 1 });
  const res = mockRes();
  await respond(req({
    session_token: TOKEN, position: 1, petal_selected: '12', raw_latency_ms: 542,
  }), res);
  assert.equal(calls[0].url, `http://stub.invalid:8300/petalyx/session/${TOKEN}/response`);
  assert.deepEqual(JSON.parse(calls[0].opts.body),
    { position: 1, petal_selected: '12', raw_latency_ms: 542 });
  assert.equal(res.code, 200);
});

test('response never forwards the session_token in the body', async () => {
  beforeEach();
  stubUpstream(200, {});
  await respond(req({ session_token: TOKEN, position: 3, petal_selected: 'nota', raw_latency_ms: 900 }), mockRes());
  assert.equal(JSON.parse(calls[0].opts.body).session_token, undefined);
});

test('response never forwards a word, even when a client sends one', async () => {
  beforeEach();
  stubUpstream(200, {});
  await respond(req({
    session_token: TOKEN, position: 3, petal_selected: '4', raw_latency_ms: 900,
    word: 'power', selected_word: 'power', cosine: 0.8,
  }), mockRes());
  const sent = JSON.parse(calls[0].opts.body);
  assert.deepEqual(Object.keys(sent).sort(), ['petal_selected', 'position', 'raw_latency_ms']);
});

test('response accepts null petal_selected as a timeout', async () => {
  beforeEach();
  stubUpstream(200, {});
  const res = mockRes();
  await respond(req({ session_token: TOKEN, position: 7, petal_selected: null, raw_latency_ms: 1000 }), res);
  assert.equal(JSON.parse(calls[0].opts.body).petal_selected, null);
  assert.equal(res.code, 200);
});

test('response rejects a position outside 1-50 before forwarding', async () => {
  beforeEach();
  stubUpstream(200, {});
  for (const position of [0, 51, -1]) {
    const res = mockRes();
    await respond(req({ session_token: TOKEN, position, petal_selected: '12', raw_latency_ms: 10 }), res);
    assert.equal(res.code, 400, `position ${position}`);
  }
  assert.equal(calls.length, 0);
});

test('response rejects a negative latency before forwarding', async () => {
  beforeEach();
  stubUpstream(200, {});
  const res = mockRes();
  await respond(req({ session_token: TOKEN, position: 1, petal_selected: '12', raw_latency_ms: -5 }), res);
  assert.equal(calls.length, 0);
  assert.equal(res.code, 400);
});

test('response rejects a malformed token before forwarding', async () => {
  beforeEach();
  stubUpstream(200, {});
  const res = mockRes();
  await respond(req({ session_token: '../../etc', position: 1, petal_selected: '12', raw_latency_ms: 10 }), res);
  assert.equal(calls.length, 0);
  assert.equal(res.code, 400);
});

test('response relays the completion ack with trivial_response intact', async () => {
  beforeEach();
  const ack = { status: 'completed', trivial_response: { position: '8', name: 'Player D', icon: 'icon_4.png' } };
  stubUpstream(200, ack);
  const res = mockRes();
  await respond(req({ session_token: TOKEN, position: 50, petal_selected: '8', raw_latency_ms: 400 }), res);
  assert.deepEqual(JSON.parse(res.body), ack);
});

test('response relays 404 session_expired and 409 session_already_closed unchanged', async () => {
  for (const [status, error] of [[404, 'session_expired'], [409, 'session_already_closed'], [422, 'invalid_request']]) {
    beforeEach();
    stubUpstream(status, { error });
    const res = mockRes();
    await respond(req({ session_token: TOKEN, position: 1, petal_selected: '12', raw_latency_ms: 10 }), res);
    assert.equal(res.code, status);
    assert.equal(JSON.parse(res.body).error, error);
  }
});

// ---------- abandon ----------

test('abandon hits the §4.3 path with no request body', async () => {
  beforeEach();
  stubUpstream(200, { status: 'abandoned' });
  const res = mockRes();
  await abandon(req({ session_token: TOKEN }), res);
  assert.equal(calls[0].url, `http://stub.invalid:8300/petalyx/session/${TOKEN}/abandon`);
  assert.equal(calls[0].opts.body, undefined);
  assert.equal(res.code, 200);
});

// ---------- cross-cutting ----------

test('the widget key never appears in any response body or header', async () => {
  const key = process.env.PETALYX_WIDGET_KEY;
  const seen = [];
  for (const [fn, body, status, upstream] of [
    [initiate, { version_id: 'v', gender: 'F', age_band: '18-34' }, 200, { ok: 1 }],
    [initiate, { version_id: 'v', gender: 'F', age_band: '18-34' }, 401, { error: 'unauthorized' }],
    [initiate, { version_id: '', gender: 'F', age_band: '18-34' }, 200, {}],
    [respond, { session_token: TOKEN, position: 1, petal_selected: '12', raw_latency_ms: 5 }, 401, { error: 'unauthorized' }],
    [abandon, { session_token: TOKEN }, 404, { error: 'session_expired' }],
  ]) {
    beforeEach();
    stubUpstream(status, upstream);
    const res = mockRes();
    await fn(req(body), res);
    seen.push(JSON.stringify(res.body) + JSON.stringify(res.headers));
  }
  for (const s of seen) assert.equal(s.includes(key), false);
});

test('every endpoint refuses a non-POST', async () => {
  for (const fn of [initiate, respond, abandon]) {
    const res = mockRes();
    await fn({ method: 'GET', body: {} }, res);
    assert.equal(res.code, 405);
  }
});

test('nothing is cached', async () => {
  beforeEach();
  stubUpstream(200, {});
  const res = mockRes();
  await initiate(req({ version_id: 'v', gender: 'F', age_band: '18-34' }), res);
  assert.equal(res.headers['Cache-Control'], 'no-store');
});
