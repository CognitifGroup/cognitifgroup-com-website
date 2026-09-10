# Petalyx demo — generated

Do not edit anything in this folder by hand. It is compiled output.

Rebuild from the `petalyx-source` repository:

    node tools/build-demo.mjs

| file | what it is |
| --- | --- |
| `index.html` | the release demo — this is what deploys. |
| `petalyx.<hash>.js` | the engine it loads: obfuscated, no developer code, no keys, no network write path. Every edition config is baked in; session data comes from the H1 gateway at runtime. |
| `petalyx.<hash>.css` | the widget's stylesheet, shared by both builds. |
| `dev.html` + `petalyx.dev.js` | the same widget unobfuscated with the developer shortcuts left in. **Gitignored** — only ever on the machine that built it, and it refuses to run anywhere but localhost. |
| `editions.json` | what the carousel on `petalyx.html` is built from. |
| `images/` | only the files the editions actually reference. |

The engine is a file of its own rather than an inline `<script>`. An
inline script is RAWTEXT — the HTML parser ends it at the first
`</script` in the text, and anything that rewrites the served HTML on the
way to the browser (a live-reload injector, a browser extension) can end
it somewhere else again, which paints the engine onto the page as source
code instead of running it. A separate file cannot be ended early.

Filenames are content-hashed, so a rebuild is a new URL and a hard-cached
page can never pair a stale engine with a fresh carousel.

The host page frames `dev.html` on localhost and `index.html` everywhere
else, falling back to `index.html` when `dev.html` has not been built.

See the header comment in `petalyx-source/tools/build-demo.mjs` for what
that does and does not protect, and for what moving the instrument
server-side would take.

If the host can set response headers, add:

    Content-Security-Policy: frame-ancestors https://www.cognitifgroup.com https://cognitifgroup.com
    X-Frame-Options: SAMEORIGIN
    Cross-Origin-Resource-Policy: same-origin

That replaces the JavaScript frame guard in the bundle, which a copier
can edit out and a header cannot.
