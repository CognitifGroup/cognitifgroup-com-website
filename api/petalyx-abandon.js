/* ============================================================
   POST /api/petalyx-abandon
     -> POST {base}/petalyx/session/{session_token}/abandon

   CGL-MESSAGING-PROTOCOL-001 v1.0 §4, Hop C.

   In:  { session_token }
   Out: the upstream response, status and body, unmodified.

   §4.3 specifies no request body upstream, so none is sent — the token
   is a path segment and nothing else is needed.

   Sent when a participant cancels or leaves part-way. It is a courtesy
   to the backend — it lets a session close now rather than sit until the
   5-minute sliding window expires it — so a failure here is logged and
   never surfaced to the participant, who is already gone.
   ============================================================ */

import {
  requireConfig, callUpstream, relay, relayFailure, noteStatus,
  methodGuard, readBody, TOKEN_RE, TIMEOUT_RESPONSE_MS,
} from './_widget.js';

const TAG = 'petalyx-abandon';

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  const cfg = requireConfig(res, TAG);
  if (!cfg) return;

  const token = (readBody(req).session_token || '').toString().trim();
  if (!TOKEN_RE.test(token)) {
    return res.status(400).json({ error: 'bad_request' });
  }

  let out;
  try {
    out = await callUpstream(
      `${cfg.base}/petalyx/session/${encodeURIComponent(token)}/abandon`,
      cfg.key, undefined, TIMEOUT_RESPONSE_MS);
  } catch (e) {
    return relayFailure(res, e, TAG);
  }

  noteStatus(TAG, out, { session_token: 'redacted' });
  return relay(res, out);
}
