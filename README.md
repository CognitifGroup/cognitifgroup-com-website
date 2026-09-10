# Cognitif Group — Website

Premium marketing site for Cognitif Group Limited. Pure HTML / CSS / vanilla JS — no frameworks, no build step, no dependencies beyond Google Fonts (Fraunces + DM Sans).

## Structure

```
index.html                  Cinematic scroll-driven homepage
in-2-minutes.html           Just a Minute — plain-English intro
petalyx.html                Petalyx™ — the capture layer
semantic-bathymetry.html    Semantic Bathymetry™ — the discipline
insightvault.html           Insightvault — the analysis layer
architecture.html           Technology — the four layers
about.html                  About Us — governance, team, company details
privacy.html                Privacy statement
bibliography.html           Selected further reading
assets/css/style.css        Single shared stylesheet (design system)
assets/js/main.js           Single shared script (nav, reveals, Petalyx graphic, scroll hero, ember trail)
assets/img/                 Brand + content imagery
demo/petalyx/               GENERATED — the embedded Petalyx demo (do not hand-edit)
```

## The Petalyx demo

`petalyx.html` carries a carousel of the nine Petalyx™ editions. Choosing
one scatters the rest and opens that edition's demo — the real widget,
a real fifty-round session, in a sandboxed iframe, with minimise and close.

Everything under `demo/petalyx/` is compiled output, built from the
**petalyx-source** repository rather than edited here:

```
cd ../petalyx-source
npm --prefix tools install     # first time only
node tools/build-demo.mjs      # writes ../cognitifgroup-com-website/demo/petalyx/
```

| file | what it is |
| --- | --- |
| `demo/petalyx/index.html` | the release build. This is what deploys. |
| `demo/petalyx/petalyx.<hash>.js` | the engine it loads — obfuscated, no developer code, no gateway key. |
| `demo/petalyx/supabase.<hash>.js` | the Supabase client, vendored rather than pulled from a CDN so an ad-blocker cannot silently stop sessions being written. |
| `demo/petalyx/petalyx.<hash>.css` | the widget's stylesheet, shared by both builds. |
| `demo/petalyx/dev.html` + `petalyx.dev.js` | the same widget unobfuscated with the developer shortcuts left in. **Gitignored**, and it refuses to run anywhere but localhost. |
| `demo/petalyx/editions.json` | what the carousel is built from, generated from the edition configs. |

The engine is its own file rather than an inline `<script>`, because an
inline script ends at the first `</script` the HTML parser sees — and
anything that rewrites the served HTML on the way to the browser, such as
a live-reload injector or a browser extension, can end it somewhere else
again and paint the engine onto the page as source code. Filenames are
content-hashed, so a hard-cached page can never pair a stale engine with
a fresh carousel.

The page frames `dev.html` when it is served from localhost — a terminal
server, Live Server, anything — and `index.html` everywhere else, falling
back to the release build when `dev.html` has not been built. So the
developer shortcuts are there while you work and are not in the file that
ships.

### Data, and the backend (Hop C)

The demo runs real sessions. Session data is **not** in the build — it is
issued per participant by `lexx3_listen.py`, which is Hop C of
CGL-MESSAGING-PROTOCOL-001 v1.0 and the only hop the Petalyx UI ever
talks to. The consent screen inside the widget is the reviewed ICO text
and says so before anything starts.

Hop C is text-only by contract: no `cosine`, no `cosine_bias`, no
`cell_hash`, no `kA`–`kF`. Scoring is the backend's — `lexx3_listen.py`
hands the session to EVO1 itself, asynchronously, after the reveal has
already been shown (§5, steps 10–14). The widget's own EVO1/EVO3/H2 path
is therefore **not** used on a live session; it remains only for the
offline fixture, which still carries local k-space vectors.

Three serverless functions hold the credential, and nothing else does:

| function | upstream |
| --- | --- |
| `api/petalyx-initiate.js` | `POST /petalyx/session/initiate` |
| `api/petalyx-response.js` | `POST /petalyx/session/{session_token}/response` |
| `api/petalyx-abandon.js`  | `POST /petalyx/session/{session_token}/abandon` |

`api/_widget.js` is shared plumbing, not a route (Vercel does not expose
`api/_*`). Each function rebuilds the upstream body from exactly the
documented fields, so a client that sends anything extra has it dropped
at this boundary. The participant's chosen **word** is never forwarded —
only the petal; the backend already holds the mapping.

**Before this runs anywhere you must set `PETALYX_BASE_URL` and
`PETALYX_WIDGET_KEY`** — locally in a `.env` (copy `.env.example`), and
in the Vercel project's environment variables for deployment. Both are
still pending from the backend team; until they are set every
`/api/petalyx-*` route answers `503 widget_not_configured` and logs which
one is missing. Neither may ever appear in a committed file.

`X-Widget-Key` is *not* `X-Gateway-Key`. The latter is Hop A/B's
server-to-server credential for `h1_gateway.py` on port 8100, it is
numeric-bearing, and Petalyx must never hold it — it appears nowhere in
either repository.

Tests: `node --test api/__tests__/petalyx-proxy.test.mjs`. They stub
upstream, so they need no credentials and no network.

Only editions with a `versionId` in their config are launchable; the rest
show on the carousel as "more editions coming". Arsenal is the only live
one, currently pointed at the backend team's Romance-dimension test
version until a real Arsenal version is issued.

See the header comment in `petalyx-source/tools/build-demo.mjs` for what
the build protects, what it does not, and what moving the instrument
further server-side would take.

## Notable behaviour

- **Homepage hero** — a prominent animated Cognitif mark, adapted to the website's motion language and isolated in a lightweight embedded document.
- **Ember cursor trail** — inner pages only, fine pointers only, disabled under reduced motion.
- **Film grain** — fixed overlay, animated only when motion is allowed.

## Deploy

Static — serve the folder as-is (Vercel, Netlify, GitHub Pages, any web server).
Local preview: `python3 -m http.server 8123` from this folder.
