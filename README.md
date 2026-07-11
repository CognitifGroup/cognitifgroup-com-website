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
```

## Notable behaviour

- **Homepage hero** — pinned, scroll-driven: five scenes choreograph the Petalyx flower (bloom → rotate → alternate left/right → solution statement). Falls back to a plain stacked layout when JavaScript is off or `prefers-reduced-motion` is set.
- **Petalyx graphic** — built at runtime as inline SVG (`buildPetalyx` in main.js); six petals, counter-rotated labels, NOTA at 6 o'clock, hover lift, idle sway.
- **Ember cursor trail** — inner pages only, fine pointers only, disabled under reduced motion.
- **Film grain** — fixed overlay, animated only when motion is allowed.

## Deploy

Static — serve the folder as-is (Vercel, Netlify, GitHub Pages, any web server).
Local preview: `python3 -m http.server 8123` from this folder.
