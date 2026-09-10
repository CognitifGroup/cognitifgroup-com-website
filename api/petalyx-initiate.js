/* ============================================================
   POST /api/petalyx-initiate
     -> POST {base}/petalyx/session/initiate     (lexx3_listen.py)

   CGL-MESSAGING-PROTOCOL-001 v1.0 §4, Hop C.

   In:  { version_id, gender, age_band }   — exactly these three.
   Out: the upstream response, status and body, unmodified.

   The body is rebuilt from three values rather than passed through, so
   a client that sends extra fields gets them dropped at this boundary
   instead of earning a 422 downstream.

   Replaces the old api/h1-initiate.js, which called h1_gateway.py on
   port 8100 directly. That was Hop A/B — internal, numeric, and never
   meant for the Petalyx UI.
   ============================================================ */

import {
  requireConfig, callUpstream, relay, relayFailure, noteStatus,
  methodGuard, readBody, TIMEOUT_INITIATE_MS,
} from './_widget.js';

const TAG = 'petalyx-initiate';

const GENDERS   = ['M', 'F', 'O'];
const AGE_BANDS = ['18-34', '35-54', '55+'];

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  const cfg = requireConfig(res, TAG);
  if (!cfg) return;

  const body = readBody(req);
  const version_id = typeof body.version_id === 'string' ? body.version_id.trim() : '';
  const gender     = typeof body.gender === 'string' ? body.gender.trim() : '';
  const age_band   = typeof body.age_band === 'string' ? body.age_band.trim() : '';

  // Checked here so a malformed client never spends an upstream call, and
  // so a 422 from upstream can only ever mean the contract itself moved.
  if (!version_id || !GENDERS.includes(gender) || !AGE_BANDS.includes(age_band)) {
    console.warn(`[${TAG}] rejected a malformed request before forwarding:`,
      JSON.stringify({ version_id, gender, age_band }));
    return res.status(400).json({ error: 'bad_request' });
  }

  const payload = { version_id, gender, age_band };

  let out;
  try {
    out = await callUpstream(
      `${cfg.base}/petalyx/session/initiate`, cfg.key, payload, TIMEOUT_INITIATE_MS);
  } catch (e) {
    return relayFailure(res, e, TAG);
  }

  noteStatus(TAG, out, payload);
  if (out.status === 404) {
    // session_unavailable — the version_id is not one lexx3_listen knows.
    console.warn(`[${TAG}] 404 for version_id:`, version_id);
  }
  return relay(res, out);
}
