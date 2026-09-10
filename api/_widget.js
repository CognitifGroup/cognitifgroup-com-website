/* ============================================================
   HOP C — SHARED PROXY PLUMBING
   CGL-MESSAGING-PROTOCOL-001 v1.0 §4

   Petalyx talks to lexx3_listen.py, and only to lexx3_listen.py.
   That service is text-only by contract: no cosine, no cosine_bias,
   no k-space, no numeric field of any kind ever crosses this
   boundary. It authenticates with X-Widget-Key.

   X-Gateway-Key belongs to Hop A/B (h1_gateway.py, port 8100,
   server-to-server, numeric). Petalyx must never hold it, and it
   must never appear anywhere in this directory.

   Petalyx runs in a browser, so it cannot hold X-Widget-Key either.
   These functions are the only thing that does.

   Both values are unset until the backend team issues them. Until
   then every endpoint here answers 503 and says exactly what is
   missing, rather than failing somewhere less legible.
   ============================================================ */

/** Base URL of lexx3_listen.py, no trailing slash. */
export function baseUrl() {
  const raw = process.env.PETALYX_BASE_URL;
  if (!raw) return null;
  return raw.replace(/\/+$/, '');
}

export function widgetKey() {
  return process.env.PETALYX_WIDGET_KEY || null;
}

/**
 * Guard every handler with the same two checks, so a missing value is
 * one loud log line and a 503 rather than a 401 from upstream that
 * looks like a wrong key.
 */
export function requireConfig(res, tag) {
  const base = baseUrl();
  const key  = widgetKey();
  const missing = [];
  if (!base) missing.push('PETALYX_BASE_URL');
  if (!key)  missing.push('PETALYX_WIDGET_KEY');
  if (missing.length) {
    console.error(`[${tag}] not configured — missing ${missing.join(' and ')}. ` +
      'Set them in .env locally, or in the Vercel project environment variables. ' +
      'Both are still pending from the backend team.');
    res.status(503).json({ error: 'widget_not_configured', missing });
    return null;
  }
  return { base, key };
}

/** A session token is a path segment upstream, so it is validated as one. */
export const TOKEN_RE = /^[A-Za-z0-9._-]{8,200}$/;

/**
 * The session can take a while to build upstream (Hop A runs LEXX2 as a
 * subprocess and has no timeout of its own), so initiate is given room.
 * A per-iteration call is on the participant's critical path and is not.
 */
export const TIMEOUT_INITIATE_MS = 20000;
export const TIMEOUT_RESPONSE_MS = 8000;

/**
 * One upstream call. Returns { status, contentType, text }, or throws an
 * Error whose message is 'timeout' or 'unreachable'.
 */
export async function callUpstream(url, key, payload, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // The narrow, Petalyx-facing credential. Never X-Gateway-Key.
        'X-Widget-Key': key,
      },
      // §4.3's abandon takes no body at all, so none is sent.
      body: payload === undefined ? undefined : JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await upstream.text();
    return {
      status: upstream.status,
      contentType: upstream.headers.get('content-type') || 'application/json',
      text,
    };
  } catch (e) {
    throw new Error(e && e.name === 'AbortError' ? 'timeout' : 'unreachable');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Pass the upstream answer through untouched, status included. This is a
 * pipe, not a translator: the widget sees exactly what lexx3_listen said,
 * so a contract change shows up as itself instead of as our paraphrase.
 */
export function relay(res, out) {
  res.status(out.status);
  res.setHeader('Content-Type', out.contentType);
  // A session is unique and single-use. Nothing here may ever be cached.
  res.setHeader('Cache-Control', 'no-store');
  return res.send(out.text);
}

export function relayFailure(res, e, tag) {
  const timedOut = e.message === 'timeout';
  console.error(`[${tag}] could not reach lexx3_listen: ${timedOut ? 'timed out' : String(e.message)}`);
  return res.status(504).json({ error: timedOut ? 'upstream_timeout' : 'upstream_unreachable' });
}

/** Log the statuses that can only mean a misconfiguration on our side. */
export function noteStatus(tag, out, context) {
  if (out.status === 401) {
    console.error(`[${tag}] 401 — PETALYX_WIDGET_KEY is set but not accepted. ` +
                  'Check the value against the one the backend team issued, and check ' +
                  'it is the widget key and not the gateway key.');
  } else if (out.status === 422) {
    console.error(`[${tag}] 422 invalid_request for`, JSON.stringify(context),
                  '— the request contract has moved. Body:', out.text.slice(0, 500));
  } else if (out.status >= 500) {
    console.error(`[${tag}] upstream ${out.status}:`, out.text.slice(0, 500));
  }
}

export function methodGuard(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'method_not_allowed' });
    return false;
  }
  return true;
}

export function readBody(req) {
  const b = req.body;
  if (typeof b === 'string') { try { return JSON.parse(b); } catch (e) { return {}; } }
  return b || {};
}
