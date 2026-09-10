/* ============================================================
   POST /api/petalyx-response
     -> POST {base}/petalyx/session/{session_token}/response

   CGL-MESSAGING-PROTOCOL-001 v1.0 §4, Hop C.

   In:  { session_token, position, petal_selected, raw_latency_ms }
   Out: the upstream response, status and body, unmodified.

   session_token is lifted out of the body and put in the path, which is
   where the protocol has it. Everything else is forwarded as the three
   documented fields and nothing more.

   petal_selected is a petal string, the literal 'nota', or null for a
   timeout. The participant's chosen WORD is never sent: the backend
   already holds the mapping, so the word is not ours to transmit and
   sending it would put vocabulary on a wire that does not need it.
   ============================================================ */

import {
  requireConfig, callUpstream, relay, relayFailure, noteStatus,
  methodGuard, readBody, TOKEN_RE, TIMEOUT_RESPONSE_MS,
} from './_widget.js';

const TAG = 'petalyx-response';

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  const cfg = requireConfig(res, TAG);
  if (!cfg) return;

  const body = readBody(req);
  const token = typeof body.session_token === 'string' ? body.session_token.trim() : '';
  const position = Number.isInteger(body.position) ? body.position : null;
  const latency  = Number.isInteger(body.raw_latency_ms) ? body.raw_latency_ms : null;

  // null is a real, meaningful value here — it is how a timeout is
  // reported — so it has to survive validation rather than be treated
  // as absent.
  const sel = body.petal_selected;
  const petal_selected =
    sel === null ? null : (typeof sel === 'string' && sel.trim() ? sel.trim() : undefined);

  // §4.2 rejects a position outside 1-50 and a negative latency with a
  // 422. Both are caught here so a client bug never spends an upstream
  // call and never looks like a contract change.
  if (!TOKEN_RE.test(token) || position === null || position < 1 || position > 50 ||
      latency === null || latency < 0 || petal_selected === undefined) {
    console.warn(`[${TAG}] rejected a malformed request before forwarding:`,
      JSON.stringify({ position, petal_selected: sel, raw_latency_ms: body.raw_latency_ms,
                       token_shape: token ? 'present' : 'missing' }));
    return res.status(400).json({ error: 'bad_request' });
  }

  const payload = { position, petal_selected, raw_latency_ms: latency };

  let out;
  try {
    out = await callUpstream(
      `${cfg.base}/petalyx/session/${encodeURIComponent(token)}/response`,
      cfg.key, payload, TIMEOUT_RESPONSE_MS);
  } catch (e) {
    return relayFailure(res, e, TAG);
  }

  // 404 here is session_expired or session_unavailable and 409 is
  // session_already_closed — both are normal outcomes of a real
  // participant's timing, not faults, so they are relayed without noise.
  noteStatus(TAG, out, payload);
  return relay(res, out);
}
