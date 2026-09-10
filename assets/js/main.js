/* ============================================================
   COGNITIF GROUP — shared behaviour
   nav · reveals · Petalyx graphic · scroll hero
   ============================================================ */
(function () {
  "use strict";

  var doc = document.documentElement;
  var motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (motionOK) doc.classList.add("motion-ok");
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ----------------------------------------------------------
     Theme — light by default; an explicit choice persists.
  ---------------------------------------------------------- */
  var themeButtons = document.querySelectorAll(".theme-toggle");
  var themeFrames = document.querySelectorAll(".hx-logo-animation iframe");
  function syncEmbeddedTheme(theme) {
    themeFrames.forEach(function (frame) {
      if (frame.contentWindow) {
        frame.contentWindow.postMessage({ type: "cognitif-theme", theme: theme }, window.location.origin);
      }
    });
  }
  function syncThemeImages(theme) {
    var dark = theme === "dark";
    document.querySelectorAll("[data-theme-src-light][data-theme-src-dark]").forEach(function (img) {
      var next = img.getAttribute(dark ? "data-theme-src-dark" : "data-theme-src-light");
      if (next && img.getAttribute("src") !== next) img.setAttribute("src", next);
    });
    document.querySelectorAll("[data-theme-srcset-light][data-theme-srcset-dark]").forEach(function (source) {
      var next = source.getAttribute(dark ? "data-theme-srcset-dark" : "data-theme-srcset-light");
      if (next && source.getAttribute("srcset") !== next) source.setAttribute("srcset", next);
    });
  }
  function syncThemeControls() {
    var dark = doc.getAttribute("data-theme") === "dark";
    var action = dark ? "Switch to light mode" : "Switch to dark mode";
    themeButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", action);
      button.setAttribute("title", action);
    });
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", dark ? "#0d1428" : "#f7f2e5");
    syncThemeImages(dark ? "dark" : "light");
    syncEmbeddedTheme(dark ? "dark" : "light");
  }
  function setTheme(theme) {
    doc.setAttribute("data-theme", theme);
    doc.style.colorScheme = theme;
    try { window.localStorage.setItem("cognitif-theme", theme); } catch (e) {}
    syncThemeControls();
    window.dispatchEvent(new Event("resize"));
  }
  syncThemeControls();
  themeFrames.forEach(function (frame) {
    frame.addEventListener("load", function () {
      syncEmbeddedTheme(doc.getAttribute("data-theme") === "dark" ? "dark" : "light");
    });
  });
  themeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setTheme(doc.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  });

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  /* ----------------------------------------------------------
     Fixed header — scrolled state
  ---------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  function onHeaderScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onHeaderScroll, { passive: true });
  onHeaderScroll();

  /* ----------------------------------------------------------
     Mobile menu
  ---------------------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("mobile-menu");
  if (toggle && menu) {
    menu.querySelectorAll(".mm-link").forEach(function (a, i) {
      a.style.setProperty("--i", i);
    });
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      if (open) {
        var first = menu.querySelector("a");
        if (first) first.focus({ preventScroll: true });
      }
    };
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* ----------------------------------------------------------
     Reveal on scroll
  ---------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".rv");
  if (revealEls.length && "IntersectionObserver" in window && motionOK) {
    var reveal = function (el) { el.classList.add("in"); ro.unobserve(el); };
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) reveal(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });
    revealEls.forEach(function (el) { ro.observe(el); });

    /* safety net — the threshold above never fires for a zero-height
       element (e.g. an image not yet sized), which would leave it
       stuck invisible. A geometry sweep reveals anything already well
       inside the viewport regardless of intersection ratio. */
    var sweep = function () {
      var vh = window.innerHeight;
      document.querySelectorAll(".rv:not(.in)").forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) reveal(el);
      });
    };
    window.addEventListener("scroll", sweep, { passive: true });
    window.addEventListener("load", sweep);
    setTimeout(sweep, 1200);
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ----------------------------------------------------------
     Petalyx graphic builder
     Six petals at 12/2/4/6/8/10 o'clock; NOTA at 6.
  ---------------------------------------------------------- */
  var SVGNS = "http://www.w3.org/2000/svg";
  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function buildPetalyx(container, opts) {
    opts = opts || {};
    var words = opts.words || ["Trust", "Loyalty", "Strength", "Safe", "Steady"];
    var centre = opts.centre || "Prompt";
    var svg = el("svg", {
      viewBox: "-300 -300 600 600",
      role: "img",
      "aria-label": "Petalyx capture interface: the prompt word " + centre +
        " surrounded by five radial response words and a None of the Above option"
    });
    svg.classList.add("px");
    container.appendChild(svg);

    var defs = el("defs", {}, svg);
    var grad = el("radialGradient", { id: "pxGrad", cx: "50%", cy: "18%", r: "95%" }, defs);
    el("stop", { offset: "0%", "stop-color": "#e09a6c", "stop-opacity": "0.15" }, grad);
    el("stop", { offset: "55%", "stop-color": "#c67b52", "stop-opacity": "0.05" }, grad);
    el("stop", { offset: "100%", "stop-color": "#c67b52", "stop-opacity": "0" }, grad);
    var ripGrad = el("radialGradient", { id: "pxRip", cx: "50%", cy: "50%", r: "50%" }, defs);
    el("stop", { offset: "0%", "stop-color": "#e09a6c", "stop-opacity": "0.3" }, ripGrad);
    el("stop", { offset: "55%", "stop-color": "#c67b52", "stop-opacity": "0.12" }, ripGrad);
    el("stop", { offset: "100%", "stop-color": "#c67b52", "stop-opacity": "0" }, ripGrad);

    /* ripple layer sits behind the wireframe + petals */
    var ripLayer = el("g", { class: "px-ripples", "aria-hidden": "true" }, svg);

    /* rotating wireframe layer (rings + axes) */
    var rot = el("g", { class: "px-rot" }, svg);
    var rings = el("g", { class: "px-rings" }, rot);
    el("circle", { class: "px-ring", r: 122, "stroke-width": 0.8 }, rings);
    el("circle", { class: "px-ring px-ring--dash", r: 188, "stroke-width": 0.8 }, rings);
    el("circle", { class: "px-ring", r: 254, "stroke-width": 0.7 }, rings);
    for (var t = 0; t < 60; t++) {
      var a = (t / 60) * Math.PI * 2;
      var len = t % 5 === 0 ? 8 : 4;
      el("line", {
        class: "px-tick",
        x1: Math.cos(a) * 254, y1: Math.sin(a) * 254,
        x2: Math.cos(a) * (254 - len), y2: Math.sin(a) * (254 - len),
        "stroke-width": 0.7
      }, rings);
    }
    for (var ax = 0; ax < 6; ax++) {
      var aa = (-90 + ax * 60) * Math.PI / 180;
      el("line", {
        class: "px-axis",
        x1: Math.cos(aa) * 58, y1: Math.sin(aa) * 58,
        x2: Math.cos(aa) * 250, y2: Math.sin(aa) * 250,
        "stroke-width": 0.8
      }, rings);
    }

    /* petals — angle 0 = 12 o'clock, clockwise */
    var petalPath = "M0,-60 C36,-96 42,-166 0,-228 C-42,-166 -36,-96 0,-60 Z";
    var innerPath = "M0,-78 C24,-104 28,-152 0,-196 C-28,-152 -24,-104 0,-78 Z";
    var angles = [0, 60, 120, 180, 240, 300];

    angles.forEach(function (deg, i) {
      var isNota = deg === 180;
      var word = isNota ? "None of the Above" : words[i > 3 ? i - 1 : i];
      var g = el("g", { class: "px-petal" + (isNota ? " px-petal--nota" : "") }, rot);
      g.style.setProperty("--i", i);
      var sway = el("g", { class: "px-sway" }, g);
      var spin = el("g", { transform: "rotate(" + deg + ")" }, sway);
      var lift = el("g", { class: "px-lift" }, spin);

      el("path", { class: "px-shape", d: petalPath }, lift);
      el("path", { class: "px-inner", d: innerPath }, lift);
      el("line", { class: "px-vein", x1: 0, y1: -64, x2: 0, y2: -222 }, lift);
      el("circle", { class: "px-node", r: 2.6, cy: -228 }, lift);

      /* label — counter-rotated so it reads level */
      var lg = el("g", { transform: "translate(0,-142)" }, lift);
      var lr = el("g", { transform: "rotate(" + (-deg) + ")" }, lg);
      var text = el("text", { class: "px-label" + (isNota ? " px-label--nota" : "") }, lr);
      text.textContent = word;
    });

    /* static centre */
    var cg = el("g", { class: "px-center-g" }, svg);
    el("circle", { class: "px-center-halo", r: 78 }, cg);
    el("circle", { class: "px-center-ring", r: 62 }, cg);
    var cw = el("text", { class: "px-center-word", y: 4 }, cg);
    cw.textContent = centre;

    /* bloom + idle */
    if (opts.spin && motionOK) svg.classList.add("px--spin");
    function bloom() {
      svg.classList.add("is-bloomed");
      if (opts.idle !== false) {
        setTimeout(function () { svg.classList.add("is-idle"); },
          motionOK ? (opts.spin ? 3400 : 2300) : 0);
      }
    }
    if (opts.revealOnVisible && motionOK && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { bloom(); io.disconnect(); }
      }, { threshold: 0.35 });
      io.observe(svg);
    } else {
      requestAnimationFrame(function () { requestAnimationFrame(bloom); });
    }

    /* click ripple — a quick radial pulse radiating from the click point */
    svg.addEventListener("pointerdown", function (e) {
      if (!motionOK || e.button > 0) return;
      var ctm = svg.getScreenCTM();
      if (!ctm) return;
      var pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      var loc = pt.matrixTransform(ctm.inverse());
      var g2 = el("g", {
        class: "px-ripple",
        transform: "translate(" + loc.x.toFixed(1) + "," + loc.y.toFixed(1) + ")"
      }, ripLayer);
      el("circle", { class: "px-rip-glow", r: 215, fill: "url(#pxRip)" }, g2);
      el("circle", { class: "px-rip-ring", r: 235 }, g2);
      el("circle", { class: "px-rip-ring px-rip-ring--2", r: 235 }, g2);
      setTimeout(function () { if (g2.parentNode) g2.parentNode.removeChild(g2); }, 1150);
    });

    return { svg: svg, rot: rot };
  }
  window.__buildPetalyx = buildPetalyx;

  document.querySelectorAll("[data-petalyx]").forEach(function (holder) {
    var target = holder.querySelector(".hx-petal-move") || holder;
    var built = buildPetalyx(target, {
      idle: holder.getAttribute("data-idle") !== "false",
      spin: holder.hasAttribute("data-spin"),
      revealOnVisible: holder.getAttribute("data-reveal") === "visible"
    });
    holder.__px = built;
  });

  /* ----------------------------------------------------------
     Cinematic scroll hero (home)
  ---------------------------------------------------------- */
  var hero = document.querySelector("[data-hero]");
  if (hero && motionOK) {
    var stage = hero.querySelector(".hx-stage");
    var petalHolder = hero.querySelector(".hx-petal");
    var mover = hero.querySelector(".hx-petal-move");
    var rotLayer = petalHolder.querySelector(".px-rot");
    var labels = petalHolder.querySelectorAll(".px-label, .px-center-g");
    var scenes = Array.prototype.slice.call(hero.querySelectorAll(".hx-scene"));
    var progressBar = hero.querySelector(".hx-progress span");
    var counter = hero.querySelector(".hx-counter");
    var cue = hero.querySelector(".hx-cue");
    var N = scenes.length;

    hero.classList.add("is-pinned");
    hero.style.height = (N * 120 + 40) + "vh";

    /* petal choreography per scene: [x vw, y svh, scale, opacity, labelOpacity] */
    var TARGETS = [
      [0, 48, 1.0, 1.0, 1],
      [23, 0, 0.8, 0.9, 0],
      [-23, 0, 0.8, 0.9, 0],
      [23, 0, 0.76, 0.9, 0],
      [0, 0, 1.18, 0.3, 0]
    ];
    var isNarrow = false;
    function measure() { isNarrow = window.innerWidth < 761; }
    measure();
    window.addEventListener("resize", measure);

    var cur = { x: 0, y: 48, s: 1, o: 1, l: 1, r: 0 };
    var running = false;

    function sceneOpacity(seg, i) {
      /* seg in [0..N]; scene i owns [i, i+1] */
      var d = seg - i;
      var inn = i === 0 ? 1 : smooth(d / 0.3);
      var out = i === N - 1 ? 1 : 1 - smooth((d - 0.72) / 0.28);
      return clamp(Math.min(inn, out), 0, 1);
    }

    function frame() {
      var vh = window.innerHeight;
      var rect = hero.getBoundingClientRect();
      var total = rect.height - vh;
      var p = clamp(-rect.top / total, 0, 1);
      var seg = p * N;

      /* interpolate petal targets between scene indexes —
         hold for most of the window, glide near the boundary */
      var idx = clamp(Math.floor(seg), 0, N - 1);
      var frac = smooth(clamp((seg - idx - 0.66) / 0.34, 0, 1));
      var a = TARGETS[idx], b = TARGETS[clamp(idx + 1, 0, N - 1)];
      var tx = lerp(a[0], b[0], frac);
      var ty = lerp(a[1], b[1], frac);
      var ts = lerp(a[2], b[2], frac);
      var to = lerp(a[3], b[3], frac);
      var tl = lerp(a[4], b[4], frac);
      if (isNarrow) { tx = 0; ts = Math.min(ts, 1); }

      /* damped follow */
      cur.x = lerp(cur.x, tx, 0.11);
      cur.y = lerp(cur.y, ty, 0.11);
      cur.s = lerp(cur.s, ts, 0.11);
      cur.o = lerp(cur.o, to, 0.13);
      cur.l = lerp(cur.l, tl, 0.16);
      cur.r = lerp(cur.r, p * 210, 0.11);

      mover.style.transform =
        "translate3d(" + (cur.x * window.innerWidth / 100) + "px," +
        (cur.y * vh / 100) + "px,0) scale(" + cur.s + ")";
      mover.style.opacity = cur.o.toFixed(3);
      rotLayer.setAttribute("transform", "rotate(" + cur.r.toFixed(2) + ")");
      labels.forEach(function (n) { n.style.opacity = cur.l.toFixed(3); });

      scenes.forEach(function (sc, i) {
        var o = sceneOpacity(seg, i);
        var dir = sc.getAttribute("data-align") === "right" ? 1 : -1;
        var d = seg - i;
        var ampIn = isNarrow ? 20 : 46;
        var ampOut = isNarrow ? 12 : 30;
        var shift = (1 - smooth(i === 0 ? 1 : d / 0.3)) * ampIn * dir
                  - (i === N - 1 ? 0 : smooth((d - 0.72) / 0.28)) * ampOut * dir;
        sc.style.opacity = o.toFixed(3);
        sc.style.visibility = o > 0.01 ? "visible" : "hidden";
        var base = sc.classList.contains("hx-scene--center")
          ? (sc.classList.contains("hx-scene--intro") ? "translateX(-50%)" : (isNarrow ? "translateX(-50%)" : "translate(-50%,-50%)"))
          : (isNarrow ? "" : "translateY(-50%)");
        sc.style.transform = base + " translateX(" + shift.toFixed(1) + "px)";
      });

      if (progressBar) progressBar.style.transform = "scaleY(" + p + ")";
      if (counter) counter.textContent =
        "0" + clamp(Math.round(seg + 0.5), 1, N) + " — 0" + N;
      if (cue) cue.style.opacity = p > 0.04 ? "0" : "1";

      if (rect.bottom > 0 && rect.top < vh) {
        requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    function wake() {
      if (!running) { running = true; requestAnimationFrame(frame); }
    }
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    wake();
  }

  /* ----------------------------------------------------------
     Interactive 3D wireframe visualisations
     data-viz="terrainbox" — glass-box terrain with attractor rings
     data-viz="surface"    — affective energy surface (peaks & basins)
  ---------------------------------------------------------- */
  function gauss(u, v, cx, cz, s) {
    var dx = u - cx, dz = v - cz;
    return Math.exp(-(dx * dx + dz * dz) / (2 * s * s));
  }
  function vnHash(x, y) {
    var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function vnNoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    var a = vnHash(xi, yi), b = vnHash(xi + 1, yi);
    var c = vnHash(xi, yi + 1), d = vnHash(xi + 1, yi + 1);
    var ux = xf * xf * (3 - 2 * xf), uy = yf * yf * (3 - 2 * yf);
    return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
  }
  /* palette ramp (light theme): basins slate blue → mid warm grey → peaks copper */
  function heightColor(h, alpha) {
    var r, g, b;
    if (h < 0) {
      var t = clamp(-h, 0, 1);
      r = lerp(146, 84, t); g = lerp(138, 104, t); b = lerp(120, 150, t);
    } else {
      var t2 = clamp(h, 0, 1);
      r = lerp(146, 160, t2); g = lerp(138, 95, t2); b = lerp(120, 60, t2);
    }
    return "rgba(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + "," + alpha + ")";
  }

  var VIZ_CONF = {
    surface: {
      nx: 42, nz: 30, rx: -0.44, ry0: 0.6, zoom: 1.14, lift: 0.63,
      hmax: 0.85, box: false, plumb: null,
      height: function (u, v) {
        var h = 0;
        h += 0.95 * gauss(u, v, -0.5, -0.3, 0.22);
        h += 0.55 * gauss(u, v, 0.32, 0.5, 0.3);
        h += 0.8 * gauss(u, v, 0.6, -0.45, 0.2);
        h -= 0.85 * gauss(u, v, -0.05, 0.28, 0.26);
        h -= 0.55 * gauss(u, v, 0.72, 0.1, 0.2);
        h += (vnNoise(u * 3.2 + 9, v * 3.2 + 4) - 0.5) * 0.5;
        return h;
      },
      labels: [
        { u: -0.5, v: -0.3, above: true, text: "Attractor peak" },
        { u: -0.05, v: 0.28, above: false, text: "Repulsive basin" }
      ]
    },
    bathy: {
      nx: 44, nz: 30, rx: -0.42, ry0: 0.5, zoom: 1.04, lift: 0.64,
      hmax: 0.95, box: false, plumb: null,
      height: function (u, v) {
        var h = 1.1 * gauss(u, v, -0.55, -0.2, 0.17)
              + 0.85 * gauss(u, v, -0.22, 0.3, 0.15)
              + 0.7 * gauss(u, v, -0.62, 0.42, 0.13)
              + 0.6 * gauss(u, v, -0.05, -0.52, 0.16)
              - 0.22 * gauss(u, v, 0.55, 0.3, 0.5);
        h += (vnNoise(u * 3.1 + 11, v * 3.1 + 2) - 0.5) * 0.3 * clamp(0.62 - u * 0.5, 0.12, 1);
        return h;
      },
      labels: [
        { u: -0.55, v: -0.2, above: true, text: "Attractors · low temperature" },
        { u: 0.5, v: 0.28, above: true, text: "Diffuse spaces · high temperature" }
      ]
    },
    terrainbox: {
      nx: 26, nz: 26, rx: 0.76, ry0: 0.62, zoom: 0.62, lift: 0.8,
      rxMin: 0.54, rxMax: 0.94,
      userRxMin: -0.12, userRxMax: 0.16,
      hmax: 1.0, box: true, plumb: { u: 0.42, v: 0.42 },
      height: function (u, v) {
        var h = 0.95 * gauss(u, v, -0.18, -0.1, 0.42)
              + 0.35 * gauss(u, v, 0.5, -0.55, 0.35)
              + 0.25 * gauss(u, v, -0.65, 0.45, 0.35)
              + (vnNoise(u * 2.4 + 3, v * 2.4 + 7) - 0.5) * 0.18;
        return Math.max(h - 0.04, 0.001) - 0.001;
      },
      labels: []
    }
  };

  function initViz(panel) {
    var conf = VIZ_CONF[panel.getAttribute("data-viz")];
    var canvas = panel.querySelector("canvas");
    if (!conf || !canvas) return;
    var formScroll = panel.getAttribute("data-form") === "scroll" && motionOK;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;

    /* precompute grid heights */
    var nx = conf.nx, nz = conf.nz;
    var narrow = window.innerWidth < 700;
    if (narrow) { nx = Math.round(nx * 0.7); nz = Math.round(nz * 0.7); }
    var hs = [];
    for (var iz = 0; iz <= nz; iz++) {
      for (var ix = 0; ix <= nx; ix++) {
        hs.push(conf.height(ix / nx * 2 - 1, iz / nz * 2 - 1));
      }
    }

    var userRy = 0, userRx = 0;
    var appearT = null, amp = motionOK ? 0 : 1;
    var running = false, visible = false, t0 = performance.now();

    function resize() {
      W = panel.clientWidth; H = panel.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    resize();
    window.addEventListener("resize", function () { resize(); kick(); });

    function project(u, y, v, m) {
      /* u,v in -1..1 ground plane; y up */
      var x = u * m.cy + v * m.sy;
      var z = -u * m.sy + v * m.cy;
      var yy = y * m.cx - z * m.sx;
      var zz = y * m.sx + z * m.cx;
      var f = 3.4 / (3.4 - zz * 0.9);
      return {
        x: W / 2 + x * f * m.S,
        y: H * conf.lift + (-yy) * f * m.S,
        f: f
      };
    }

    function draw(now) {
      var te = (now - t0) / 1000;
      if (formScroll) {
        /* the surface forms as it scrolls into view — and un-forms scrolling back */
        var fr = panel.getBoundingClientRect();
        var fvh = window.innerHeight;
        amp = smooth(clamp((fvh * 0.92 - fr.top) / (fvh * 0.58), 0, 1));
      } else if (appearT !== null && motionOK) {
        var ap = clamp((now - appearT) / 1500, 0, 1);
        amp = smooth(ap);
      }
      var swing = motionOK ? (1 - amp) * -0.55 : 0;
      var drift = motionOK ? Math.sin(te * 0.22) * 0.1 : 0;
      var ry = conf.ry0 + userRy + drift + swing;
      /* tilt is clamped to bird's-eye territory — you can spin the chart
         and peer further down onto it, but never up from underneath */
      var rx = clamp(conf.rx + userRx,
        conf.rxMin !== undefined ? conf.rxMin : -0.9,
        conf.rxMax !== undefined ? conf.rxMax : -0.3
      );
      var m = {
        cy: Math.cos(ry), sy: Math.sin(ry),
        cx: Math.cos(rx), sx: Math.sin(rx),
        S: Math.min(W, H * 1.5) * 0.36 * conf.zoom
      };
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";

      function gh(ix, iz) { return hs[iz * (nx + 1) + ix] * conf.hmax * amp; }

      /* glass box */
      if (conf.box) {
        var top = conf.hmax * 1.18;
        var C = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        ctx.strokeStyle = "rgba(24,32,64,0.16)";
        ctx.beginPath();
        for (var e = 0; e < 4; e++) {
          var p1 = project(C[e][0], 0, C[e][1], m);
          var p2 = project(C[(e + 1) % 4][0], 0, C[(e + 1) % 4][1], m);
          var p3 = project(C[e][0], top, C[e][1], m);
          var p4 = project(C[(e + 1) % 4][0], top, C[(e + 1) % 4][1], m);
          ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
          ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
          ctx.moveTo(p1.x, p1.y); ctx.lineTo(p3.x, p3.y);
        }
        ctx.stroke();
      }

      /* mesh — batch segments into colour buckets */
      var buckets = {};
      function seg(x1, y1, x2, y2, h) {
        var key = Math.round(clamp(h, -1, 1) * 4);
        (buckets[key] = buckets[key] || []).push(x1, y1, x2, y2);
      }
      var P = new Array((nx + 1) * (nz + 1));
      for (var jz = 0; jz <= nz; jz++) {
        for (var jx = 0; jx <= nx; jx++) {
          P[jz * (nx + 1) + jx] = project(jx / nx * 2 - 1, gh(jx, jz), jz / nz * 2 - 1, m);
        }
      }
      for (var kz = 0; kz <= nz; kz++) {
        for (var kx = 0; kx <= nx; kx++) {
          var p0 = P[kz * (nx + 1) + kx];
          if (kx < nx) {
            var pa = P[kz * (nx + 1) + kx + 1];
            seg(p0.x, p0.y, pa.x, pa.y, (gh(kx, kz) + gh(kx + 1, kz)) / (2 * conf.hmax || 1));
          }
          if (kz < nz) {
            var pb = P[(kz + 1) * (nx + 1) + kx];
            seg(p0.x, p0.y, pb.x, pb.y, (gh(kx, kz) + gh(kx, kz + 1)) / (2 * conf.hmax || 1));
          }
        }
      }
      for (var key in buckets) {
        var arr = buckets[key];
        var hval = key / 4;
        ctx.strokeStyle = heightColor(hval, 0.2 + Math.abs(hval) * 0.55);
        ctx.beginPath();
        for (var s2 = 0; s2 < arr.length; s2 += 4) {
          ctx.moveTo(arr[s2], arr[s2 + 1]);
          ctx.lineTo(arr[s2 + 2], arr[s2 + 3]);
        }
        ctx.stroke();
      }

      /* plumb line + attractor rings (terrain box) */
      if (conf.plumb) {
        var pu = conf.plumb.u, pv = conf.plumb.v;
        var ptop = project(pu, conf.hmax * 1.18, pv, m);
        var pbot = project(pu, 0, pv, m);
        ctx.strokeStyle = "rgba(166,98,62,0.75)";
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(ptop.x, ptop.y); ctx.lineTo(pbot.x, pbot.y);
        ctx.stroke();
        ctx.setLineDash([]);
        for (var ring = 0; ring < 4; ring++) {
          var rr = (0.09 + ring * 0.085) * (motionOK ? (0.9 + 0.1 * Math.sin(te * 1.6 - ring * 0.9)) : 1);
          var a2 = 0.55 - ring * 0.12 + (motionOK ? 0.12 * Math.sin(te * 1.6 - ring * 0.9) : 0);
          ctx.strokeStyle = "rgba(166,98,62," + clamp(a2, 0.06, 0.7) * amp + ")";
          ctx.beginPath();
          for (var th = 0; th <= 26; th++) {
            var ang = th / 26 * Math.PI * 2;
            var rp = project(pu + Math.cos(ang) * rr, 0.004, pv + Math.sin(ang) * rr, m);
            if (th === 0) ctx.moveTo(rp.x, rp.y); else ctx.lineTo(rp.x, rp.y);
          }
          ctx.stroke();
        }
        var dot = project(pu, 0.004, pv, m);
        ctx.fillStyle = "rgba(166,98,62," + 0.9 * amp + ")";
        ctx.beginPath(); ctx.arc(dot.x, dot.y, 2.6, 0, Math.PI * 2); ctx.fill();
      }

      /* floating labels (surface) */
      if (conf.labels.length && amp > 0.85) {
        ctx.font = "500 13px 'DM Sans', sans-serif";
        ctx.textAlign = "left";
        conf.labels.forEach(function (L) {
          var hh = conf.height(L.u, L.v) * conf.hmax * amp;
          var pl = project(L.u, hh, L.v, m);
          var ly = L.above ? pl.y - 34 : pl.y + 34;
          ctx.strokeStyle = "rgba(24,32,64,0.35)";
          ctx.beginPath();
          ctx.moveTo(pl.x, pl.y + (L.above ? -6 : 6));
          ctx.lineTo(pl.x + 14, ly);
          ctx.lineTo(pl.x + 22, ly);
          ctx.stroke();
          ctx.fillStyle = "rgba(24,32,64,0.62)";
          ctx.fillText(L.text.toUpperCase(), pl.x + 27, ly + 3);
        });
      }
    }

    var dragging = false, lx = 0, ly2 = 0;
    canvas.addEventListener("pointerdown", function (e) {
      dragging = true; lx = e.clientX; ly2 = e.clientY;
      panel.classList.add("is-dragging", "was-dragged");
      canvas.setPointerCapture(e.pointerId);
      kick();
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      userRy += (e.clientX - lx) * 0.006;
      userRx += (e.clientY - ly2) * 0.0028;
      userRx = clamp(userRx,
        conf.userRxMin !== undefined ? conf.userRxMin : -0.6,
        conf.userRxMax !== undefined ? conf.userRxMax : 0.6
      );
      lx = e.clientX; ly2 = e.clientY;
      kick();
    });
    ["pointerup", "pointercancel"].forEach(function (ev) {
      canvas.addEventListener(ev, function () {
        dragging = false;
        panel.classList.remove("is-dragging");
      });
    });

    function loop(now) {
      if (!visible) { running = false; return; }
      draw(now);
      if (motionOK || dragging || (appearT && amp < 1)) {
        requestAnimationFrame(loop);
      } else {
        running = false;
      }
    }
    function kick() {
      if (!running) { running = true; requestAnimationFrame(loop); }
    }

    if ("IntersectionObserver" in window) {
      var vio = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) {
          if (appearT === null) appearT = performance.now();
          kick();
        }
      }, { threshold: 0.2 });
      vio.observe(panel);
    } else {
      visible = true; appearT = performance.now(); kick();
    }
  }

  document.querySelectorAll("[data-viz]").forEach(initViz);

  /* ----------------------------------------------------------
     Live iso-contour engine — marching squares over a drifting
     noise field. One engine, three voices:
       [data-lines="deep"]  faint cream isolines fading down a
                            page top (replaces static texture)
       [data-lines="light"] navy isolines on cream "surfacing"
                            bands, bending around the cursor
       hero "bathy" field   the Semantic Bathymetry overture
  ---------------------------------------------------------- */
  function isoField(canvas, o) {
    var host = o.host || canvas.parentElement;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    var narrow = window.innerWidth < 700;
    var cell = (o.cell || 34) * (narrow ? 1.3 : 1);
    var levels = o.levels || [0.36, 0.44, 0.5, 0.56, 0.64];
    var rgb = o.rgb || "58,66,98";
    var alpha = o.alpha || 0.08;
    var accent = o.accent || null;
    var speed = o.speed == null ? 0.03 : o.speed;
    var nScale = o.scale || 0.004;
    var curPow = (o.cursor === false || !finePointer) ? 0 : (o.cursorPow || 0.6);
    var fadeDown = o.fadeDown || 0;
    var pings = !!o.pings;

    var W = 0, H = 0, gx = 0, gy = 0, vals = null;
    var visible = false, running = false;
    var t0 = performance.now();
    var mx = -1e5, my = -1e5, ex = -1e5, ey = -1e5;
    var pingList = [], nextPing = 2.2;

    function resize() {
      W = host.clientWidth; H = host.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      gx = Math.max(10, Math.round(W / cell));
      gy = Math.max(7, Math.round(H / cell));
      vals = new Float32Array((gx + 1) * (gy + 1));
    }
    resize();
    window.addEventListener("resize", function () { resize(); kick(); });

    if (curPow && motionOK) {
      window.addEventListener("pointermove", function (e) {
        if (!visible) return;
        var r = canvas.getBoundingClientRect();
        mx = e.clientX - r.left; my = e.clientY - r.top;
      }, { passive: true });
    }

    function compute(tt) {
      var i = 0;
      var s1 = nScale, s2 = nScale * 2.15;
      for (var jy = 0; jy <= gy; jy++) {
        var py = jy / gy * H;
        for (var jx = 0; jx <= gx; jx++, i++) {
          var px = jx / gx * W;
          var n = vnNoise(px * s1 + tt, py * s1 * 1.18 - tt * 0.7) * 0.68
                + vnNoise(px * s2 + 37 - tt * 0.5, py * s2 + tt * 0.85) * 0.32;
          if (curPow) {
            var dx = px - ex, dy = py - ey;
            n += curPow * 0.15 * Math.exp(-(dx * dx + dy * dy) / 28800);
          }
          vals[i] = n;
        }
      }
    }

    function drawLevel(lv) {
      var cw = W / gx, ch = H / gy;
      ctx.beginPath();
      for (var jy = 0; jy < gy; jy++) {
        var y = jy * ch;
        var row = jy * (gx + 1);
        for (var jx = 0; jx < gx; jx++) {
          var a = vals[row + jx], b = vals[row + jx + 1];
          var d = vals[row + gx + 1 + jx], c = vals[row + gx + 2 + jx];
          var aa = a > lv, bb = b > lv, cc = c > lv, dd = d > lv;
          if (aa === bb && bb === cc && cc === dd) continue;
          var x = jx * cw;
          var n = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0, t;
          if (aa !== bb) { t = (lv - a) / (b - a); x1 = x + cw * t; y1 = y; n = 1; }
          if (bb !== cc) {
            t = (lv - b) / (c - b);
            if (!n) { x1 = x + cw; y1 = y + ch * t; n = 1; }
            else { x2 = x + cw; y2 = y + ch * t; n = 2; }
          }
          if (dd !== cc && n < 2) {
            t = (lv - d) / (c - d);
            if (!n) { x1 = x + cw * t; y1 = y + ch; n = 1; }
            else { x2 = x + cw * t; y2 = y + ch; n = 2; }
          }
          if (aa !== dd && n < 2) {
            t = (lv - a) / (d - a);
            x2 = x; y2 = y + ch * t; n = 2;
          }
          if (n === 2) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
        }
      }
      ctx.stroke();
    }

    function frame(now) {
      var tt = (now - t0) / 1000 * speed;
      ex = ex < -9e4 ? mx : lerp(ex, mx, 0.08);
      ey = ey < -9e4 ? my : lerp(ey, my, 0.08);
      compute(tt);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      for (var li = 0; li < levels.length; li++) {
        var al = alpha * (0.62 + 0.38 * Math.sin(li * 1.9 + 0.8));
        ctx.strokeStyle = accent && accent.index === li
          ? "rgba(" + accent.rgb + "," + (al * 1.9).toFixed(3) + ")"
          : "rgba(" + rgb + "," + al.toFixed(3) + ")";
        drawLevel(levels[li]);
      }
      if (pings && motionOK) {
        var te = (now - t0) / 1000;
        if (te > nextPing) {
          pingList.push({ x: W * (0.15 + 0.7 * Math.random()), y: H * (0.2 + 0.55 * Math.random()), t: now });
          nextPing = te + 3.2 + Math.random() * 2.4;
        }
        pingList = pingList.filter(function (p) {
          var age = (now - p.t) / 1700;
          if (age >= 1) return false;
          var alp = (1 - age) * 0.4;
          ctx.strokeStyle = "rgba(166,98,62," + alp.toFixed(3) + ")";
          ctx.beginPath(); ctx.arc(p.x, p.y, 8 + age * 120, 0, 6.2832); ctx.stroke();
          ctx.strokeStyle = "rgba(166,98,62," + (alp * 0.5).toFixed(3) + ")";
          ctx.beginPath(); ctx.arc(p.x, p.y, (8 + age * 120) * 0.55, 0, 6.2832); ctx.stroke();
          return true;
        });
      }
      if (fadeDown) {
        ctx.globalCompositeOperation = "destination-in";
        var g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(Math.min(fadeDown, 1), "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";
      }
    }

    function loop(now) {
      if (!visible || !motionOK) { running = false; return; }
      frame(now);
      requestAnimationFrame(loop);
    }
    function kick() {
      if (!motionOK) { frame(t0 + 8000); return; }
      if (visible && !running) { running = true; requestAnimationFrame(loop); }
    }

    if ("IntersectionObserver" in window) {
      var iso2 = new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        kick();
      }, { threshold: 0.02 });
      iso2.observe(host);
    } else {
      visible = true;
    }
    kick();
  }

  document.querySelectorAll("[data-lines]").forEach(function (sec) {
    var cv = document.createElement("canvas");
    cv.className = "band-lines";
    cv.setAttribute("aria-hidden", "true");
    sec.insertBefore(cv, sec.firstChild);
    if (sec.getAttribute("data-lines") === "light") {
      isoField(cv, {
        host: sec, rgb: "24,32,64", alpha: 0.15, cell: 42,
        speed: 0.026, cursorPow: 0.8,
        levels: [0.36, 0.43, 0.5, 0.57, 0.64]
      });
    } else {
      isoField(cv, {
        host: sec, rgb: "58,66,98", alpha: 0.11, cell: 46,
        speed: 0.016, cursorPow: 0.35, fadeDown: 0.85,
        levels: [0.38, 0.46, 0.54, 0.62]
      });
    }
  });

  /* ----------------------------------------------------------
     Page-hero canvases — a shared scaffold and one bespoke
     instrument per page, in the same wireframe language.
  ---------------------------------------------------------- */
  function canvasFX(canvas, render) {
    var host = canvas.parentElement;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    var W = 0, H = 0;
    function resize() {
      W = canvas.clientWidth || host.clientWidth;
      H = canvas.clientHeight || host.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    resize();
    window.addEventListener("resize", function () { resize(); kick(); });
    window.addEventListener("load", function () { resize(); kick(); });
    requestAnimationFrame(function () { resize(); kick(); });
    var visT = null, visible = false, running = false;
    function loop(now) {
      if (!visible) { running = false; return; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      render(ctx, W, H, (now - visT) / 1000, canvas);
      requestAnimationFrame(loop);
    }
    function kick() {
      if (visible && !running) { running = true; requestAnimationFrame(loop); }
    }
    if (motionOK && "IntersectionObserver" in window) {
      var iofx = new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible && visT === null) visT = performance.now();
        kick();
      }, { threshold: 0.04 });
      iofx.observe(host);
    } else {
      /* reduced motion: render the settled final state once */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render(ctx, W, H, 9, canvas);
    }
  }

  /* Semantic Bathymetry — the echogram: stacked depth ridgelines
     drift like a sounding chart being drawn; a survey line drops a
     ping and reads off the depth where it lands */
  function makeBathyHero() {
    var soundings = [], nextSounding = 2.6;
    var mx = -1e5, my = -1e5, ex = -1e5, ey = -1e5, bound = false;
    var N = 15;
    return function (ctx, W, H, te, canvas) {
      var dark = doc.getAttribute("data-theme") === "dark";
      if (!bound) {
        bound = true;
        if (finePointer && motionOK) {
          window.addEventListener("pointermove", function (e) {
            var r = canvas.getBoundingClientRect();
            mx = e.clientX - r.left; my = e.clientY - r.top;
          }, { passive: true });
        }
      }
      ex = ex < -9e4 ? mx : lerp(ex, mx, 0.07);
      ey = ey < -9e4 ? my : lerp(ey, my, 0.07);

      var narrow = W < 860;
      var tDrift = motionOK ? te * 0.045 : 0.4;
      var step = Math.max(6, Math.round(W / 220));

      /* ridgelines, back (top) to front (bottom); each occludes the
         ones behind it, like strata on an echo sounder */
      for (var i = 0; i < N; i++) {
        var fi = i / (N - 1);
        var rowY = H * (0.32 + 0.62 * fi);
        var rowF = motionOK ? smooth(clamp((te * 1.3 - i * 0.09) / 0.7, 0, 1)) : 1;
        if (rowF <= 0) continue;
        var A = H * 0.15 * (0.4 + 0.6 * Math.pow(Math.sin(Math.PI * fi), 1.1));
        var xEnd = W * rowF;
        var copperRow = i % 4 === 2;

        ctx.beginPath();
        ctx.moveTo(0, rowY);
        for (var x = 0; x <= xEnd; x += step) {
          var env = narrow ? 0.85 : (0.3 + 0.7 * smooth((x / W - 0.24) / 0.55));
          var n = vnNoise(x * 0.004 + i * 13.7, tDrift + i * 0.6);
          var h = A * env * Math.pow(n, 1.7);
          if (finePointer && motionOK) {
            var dx = x - ex, dy = rowY - ey;
            h += 26 * Math.exp(-(dx * dx) / 16200) * Math.exp(-(dy * dy) / 9800);
          }
          ctx.lineTo(x, rowY - h);
        }
        /* occlude what's behind, then stroke the profile */
        ctx.lineTo(xEnd, rowY + 1.5);
        ctx.lineTo(0, rowY + 1.5);
        ctx.closePath();
        ctx.fillStyle = dark ? "rgb(12,19,38)" : "rgba(247,242,229,0.85)";
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, rowY);
        for (var x2 = 0; x2 <= xEnd; x2 += step) {
          var env2 = narrow ? 0.85 : (0.3 + 0.7 * smooth((x2 / W - 0.24) / 0.55));
          var n2 = vnNoise(x2 * 0.004 + i * 13.7, tDrift + i * 0.6);
          var h2 = A * env2 * Math.pow(n2, 1.7);
          if (finePointer && motionOK) {
            var dx2 = x2 - ex, dy2 = rowY - ey;
            h2 += 26 * Math.exp(-(dx2 * dx2) / 16200) * Math.exp(-(dy2 * dy2) / 9800);
          }
          ctx.lineTo(x2, rowY - h2);
        }
        ctx.strokeStyle = copperRow
          ? "rgba(" + (dark ? "198,123,82" : "160,95,60") + "," + (0.34 * rowF).toFixed(3) + ")"
          : "rgba(" + (dark ? "133,157,194" : "58,66,98") + "," + ((dark ? 0.3 : 0.22) * rowF).toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.stroke();

        /* depth scale tick at the left edge of every third stratum */
        if (i % 3 === 0 && !narrow) {
          var tickA = 0.3 * rowF;
          ctx.strokeStyle = "rgba(" + (dark ? "133,157,194" : "58,66,98") + "," + tickA.toFixed(3) + ")";
          ctx.beginPath();
          ctx.moveTo(W * 0.028, rowY); ctx.lineTo(W * 0.028 + 12, rowY);
          ctx.stroke();
          ctx.fillStyle = "rgba(" + (dark ? "180,196,219" : "58,66,98") + "," + (tickA * 0.9).toFixed(3) + ")";
          ctx.font = "500 13px 'DM Sans', sans-serif";
          ctx.textAlign = "left";
          ctx.fillText("−" + (20 + i * 12) + " m", W * 0.028 + 18, rowY + 3);
        }
      }

      /* soundings — a dashed survey line drops, pings, reads a depth */
      if (motionOK) {
        if (te > nextSounding) {
          var si = 2 + Math.floor(Math.random() * (N - 4));
          soundings.push({
            x: W * (narrow ? 0.15 + 0.7 * Math.random() : 0.34 + 0.58 * Math.random()),
            row: si, t: te, depth: 20 + si * 12 + Math.floor(Math.random() * 9)
          });
          nextSounding = te + 3.4 + Math.random() * 2.2;
          if (soundings.length > 2) soundings.shift();
        }
        soundings.forEach(function (s) {
          var age = te - s.t;
          if (age > 2.4) return;
          var rowY = H * (0.32 + 0.62 * (s.row / (N - 1)));
          var drop = smooth(clamp(age / 0.55, 0, 1));
          var fadeS = 1 - smooth(clamp((age - 1.6) / 0.8, 0, 1));
          var yTop = H * 0.14;
          ctx.strokeStyle = "rgba(" + (dark ? "224,154,108" : "166,98,62") + "," + (0.5 * fadeS).toFixed(3) + ")";
          ctx.setLineDash([4, 6]);
          ctx.beginPath();
          ctx.moveTo(s.x, yTop);
          ctx.lineTo(s.x, yTop + (rowY - yTop) * drop);
          ctx.stroke();
          ctx.setLineDash([]);
          if (age > 0.55) {
            var ringAge = clamp((age - 0.55) / 1.2, 0, 1);
            ctx.strokeStyle = "rgba(" + (dark ? "224,154,108" : "166,98,62") + "," + (0.45 * (1 - ringAge) * fadeS).toFixed(3) + ")";
            ctx.beginPath();
            ctx.ellipse(s.x, rowY, 8 + ringAge * 60, (8 + ringAge * 60) * 0.32, 0, 0, 6.2832);
            ctx.stroke();
            ctx.fillStyle = "rgba(" + (dark ? "224,154,108" : "140,78,46") + "," + (0.9 * fadeS).toFixed(3) + ")";
            ctx.beginPath(); ctx.arc(s.x, rowY, 2.4, 0, 6.2832); ctx.fill();
            ctx.fillStyle = "rgba(" + (dark ? "213,222,235" : "24,32,64") + "," + (0.6 * fadeS).toFixed(3) + ")";
            ctx.font = "500 13px 'DM Sans', sans-serif";
            ctx.textAlign = "left";
            ctx.fillText("−" + s.depth + " m", s.x + 12, rowY - 10);
          }
        });
      }
    };
  }

  /* About — a living fingerprint assembled from contour-like ridges.
     A biometric beam reads the field, then resolves to a privacy verdict. */
  function makeFingerprint() {
    return function (ctx, W, H, te) {
      var mobile = W < 760;
      var cx = mobile ? W * 0.5 : W * 0.73;
      var cy = mobile ? H * 0.49 : H * 0.5;
      var S = Math.min(mobile ? W * 0.82 : W * 0.38, H * (mobile ? 0.78 : 0.68));
      var intro = smooth(clamp(te / 1.35, 0, 1));
      var cycle = motionOK ? te % 5.6 : 4.05;
      var scanT = smooth(clamp((cycle - 0.55) / 2.85, 0, 1));
      var verdict = smooth(clamp((cycle - 3.35) / 0.28, 0, 1)) * (1 - smooth(clamp((cycle - 4.8) / 0.45, 0, 1)));
      var top = cy - S * 0.53, bottom = cy + S * 0.53;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      /* Registration frame: precise enough to feel biometric, quiet enough
         to remain part of the site's cartographic visual language. */
      var fw = S * 0.88, fh = S * 1.12, corner = S * 0.12;
      ctx.strokeStyle = "rgba(58,66,98," + (0.18 * intro).toFixed(3) + ")";
      ctx.lineWidth = 1;
      [[-1,-1,1,1], [1,-1,-1,1], [-1,1,1,-1], [1,1,-1,-1]].forEach(function (q) {
        var x = cx + q[0] * fw * 0.5, y = cy + q[1] * fh * 0.5;
        ctx.beginPath(); ctx.moveTo(x, y + q[3] * corner); ctx.lineTo(x, y); ctx.lineTo(x + q[2] * corner, y); ctx.stroke();
      });

      /* Nested asymmetric whorls. Each ridge has a small lower opening,
         avoiding a generic target shape and giving it a true fingerprint flow. */
      for (var i = 0; i < 24; i++) {
        var f = (i + 1) / 24;
        var reveal = smooth(clamp((intro * 1.45 - f * 0.42), 0, 1));
        if (reveal <= 0) continue;
        var rx = S * (0.105 + f * 0.36);
        var ry = S * (0.13 + f * 0.43);
        var start = Math.PI * (0.49 + f * 0.13);
        var end = Math.PI * (2.51 - f * 0.1);
        ctx.beginPath();
        for (var n = 0; n <= 150; n++) {
          var a = start + (end - start) * n / 150;
          var ripple = 1 + 0.018 * Math.sin(a * 5 + i * 0.72) + 0.012 * Math.sin(a * 9 - i * 0.31);
          var pinch = 1 - 0.12 * Math.exp(-Math.pow((a - Math.PI * 1.48) / 0.42, 2));
          var x = cx + Math.cos(a) * rx * ripple + Math.sin(a * 2.1) * S * 0.016 * f;
          var y = cy + Math.sin(a) * ry * ripple * pinch - S * 0.035 * f + Math.cos(a * 1.7) * S * 0.009;
          n ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        var scanned = scanT > f * 0.92;
        ctx.strokeStyle = scanned
          ? "rgba(166,98,62," + (0.28 + 0.42 * reveal).toFixed(3) + ")"
          : "rgba(58,66,98," + (0.12 + 0.25 * reveal).toFixed(3) + ")";
        ctx.lineWidth = i % 5 === 0 ? 1.35 : 0.85;
        ctx.stroke();
      }

      /* A few ridge endings and islands sell the biometric silhouette. */
      ctx.strokeStyle = "rgba(166,98,62," + (0.48 * intro).toFixed(3) + ")";
      ctx.lineWidth = 1.15;
      [[-.23,.28,-.12,.2], [.18,.33,.27,.23], [-.11,-.13,-.02,-.19], [.13,.02,.23,-.03]].forEach(function (p) {
        ctx.beginPath(); ctx.moveTo(cx + p[0] * S, cy + p[1] * S); ctx.quadraticCurveTo(cx, cy + (p[1] - 0.06) * S, cx + p[2] * S, cy + p[3] * S); ctx.stroke();
      });

      /* Scan beam and its soft copper wake. */
      if (cycle < 3.65 || !motionOK) {
        var sy = lerp(top, bottom, scanT);
        var grad = ctx.createLinearGradient(0, sy - S * 0.1, 0, sy + S * 0.1);
        grad.addColorStop(0, "rgba(160,95,60,0)");
        grad.addColorStop(0.5, "rgba(166,98,62," + (0.16 * intro).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(160,95,60,0)");
        ctx.fillStyle = grad; ctx.fillRect(cx - fw * 0.48, sy - S * 0.1, fw * 0.96, S * 0.2);
        ctx.strokeStyle = "rgba(140,78,46," + (0.78 * intro).toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - fw * 0.48, sy); ctx.lineTo(cx + fw * 0.48, sy); ctx.stroke();
      }

      var labelY = bottom + S * 0.12;
      ctx.textAlign = "center";
      ctx.font = "500 " + Math.max(9, S * 0.026) + "px 'DM Sans', sans-serif";
      ctx.letterSpacing = Math.max(2, S * 0.008) + "px";
      ctx.fillStyle = "rgba(58,66,98," + (0.34 * intro * (1 - verdict)).toFixed(3) + ")";
      ctx.fillText("PRIVACY ARCHITECTURE / SCANNING", cx, labelY);
      ctx.fillStyle = "rgba(166,98,62," + (0.96 * verdict).toFixed(3) + ")";
      ctx.fillText("NO PERSONAL DATA HELD", cx, labelY);
      if (verdict > 0.01) {
        ctx.strokeStyle = "rgba(166,98,62," + (0.38 * verdict).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(cx, cy, S * (0.49 + verdict * 0.018), 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    };
  }

  /* Insightvault — a vault door spins and unseals, dissolving into
     particles that reassemble as the dial mechanism around a hex-axis
     radar whose readings re-randomise cyclically */
  function makeVault() {
    var parts = null;
    var radarVals = [0.85, 0.55, 0.72, 0.62, 0.9, 0.48];
    var radarRegen = -1;
    return function (ctx, W, H, te) {
      var cx = W > 860 ? W * 0.66 : W * 0.5;
      var cy = H * 0.52;
      var R = Math.min(W * 0.3, H * 0.36);
      var sy = window.scrollY || 0;
      if (!parts) {
        parts = [];
        for (var i = 0; i < 170; i++) {
          parts.push({ sa: Math.random() * 6.2832, sr: 0.82 + Math.random() * 0.16, ring: i % 3, ang: Math.random() * 6.2832, d: Math.random() * 0.35 });
        }
      }

      /* — phase one: the sealed door. A heavy wheel — hub, spokes,
         rim — spins anticlockwise as it unseals, then breaks apart */
      if (te < 1.45 && motionOK) {
        var de = smooth(clamp(te / 1.25, 0, 1));
        var dAl = Math.min(te * 3.5, 1) * (1 - smooth(clamp((te - 0.95) / 0.45, 0, 1)));
        if (dAl > 0.005) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(-2.1 * de);
          ctx.strokeStyle = "rgba(24,32,64," + (0.55 * dAl).toFixed(3) + ")";
          ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.arc(0, 0, R * 0.92, 0, 6.2832); ctx.stroke();
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(0, 0, R * 0.3, 0, 6.2832); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, R * 0.09, 0, 6.2832); ctx.stroke();
          ctx.lineWidth = 2;
          for (var sp = 0; sp < 8; sp++) {
            var spa = sp / 8 * 6.2832;
            ctx.beginPath();
            ctx.moveTo(Math.cos(spa) * R * 0.09, Math.sin(spa) * R * 0.09);
            ctx.lineTo(Math.cos(spa) * R * 0.9, Math.sin(spa) * R * 0.9);
            ctx.stroke();
            ctx.fillStyle = "rgba(166,98,62," + (0.7 * dAl).toFixed(3) + ")";
            ctx.beginPath();
            ctx.arc(Math.cos(spa) * R * 0.3, Math.sin(spa) * R * 0.3, 3, 0, 6.2832);
            ctx.fill();
          }
          /* seal ticks around the rim */
          ctx.lineWidth = 1.2;
          for (var st = 0; st < 24; st++) {
            var sta = st / 24 * 6.2832;
            ctx.beginPath();
            ctx.moveTo(Math.cos(sta) * R * 0.92, Math.sin(sta) * R * 0.92);
            ctx.lineTo(Math.cos(sta) * R * 0.85, Math.sin(sta) * R * 0.85);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      var rings = [
        { r: 1.0, ticks: 72, dash: false, start: -2.4, drift: 0.045, w: 1.1 },
        { r: 0.82, ticks: 0, dash: true, start: 1.7, drift: -0.03, w: 1 },
        { r: 0.64, ticks: 36, dash: false, start: -1.1, drift: 0.02, w: 1 }
      ];
      rings.forEach(function (rg, ri) {
        var ap = clamp((te - 1.4 - 0.12 * ri) / 1.1, 0, 1);
        var e = 1 - Math.pow(1 - ap, 3);
        var rot = rg.start * (1 - e) + (motionOK ? te * rg.drift : 0) + sy * 0.0005 * (ri % 2 ? -1 : 1);
        var rr = R * rg.r;
        var al = 0.32 * e;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.strokeStyle = "rgba(24,32,64," + al.toFixed(3) + ")";
        ctx.lineWidth = rg.w;
        if (rg.dash) ctx.setLineDash([3, 9]);
        ctx.beginPath(); ctx.arc(0, 0, rr, 0, 6.2832); ctx.stroke();
        ctx.setLineDash([]);
        for (var t = 0; t < rg.ticks; t++) {
          var a = t / rg.ticks * 6.2832;
          var L = t % (rg.ticks / 12) === 0 ? 12 : 5;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
          ctx.lineTo(Math.cos(a) * (rr - L), Math.sin(a) * (rr - L));
          ctx.stroke();
        }
        ctx.restore();
      });

      /* the unlock — a click flash and bolts extending */
      var fl = clamp((te - 2.6) / 0.7, 0, 1);
      if (fl > 0 && fl < 1) {
        ctx.strokeStyle = "rgba(166,98,62," + (0.5 * (1 - fl)).toFixed(3) + ")";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, R * (1 + fl * 0.35), 0, 6.2832); ctx.stroke();
      }
      var bf = smooth(clamp((te - 2.55) / 0.5, 0, 1));
      for (var b = 0; b < 8; b++) {
        var ba = b / 8 * 6.2832 + 0.3927;
        var br = R * (1.02 + 0.07 * bf);
        ctx.fillStyle = "rgba(166,98,62," + (0.7 * bf).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(cx + Math.cos(ba) * br, cy + Math.sin(ba) * br, 2.4, 0, 6.2832); ctx.fill();
      }

      /* hex-axis radar inside the dial */
      var hf = smooth(clamp((te - 2.2) / 0.8, 0, 1));
      if (hf > 0) {
        ctx.save(); ctx.translate(cx, cy);
        var HR = R * 0.5;
        var k, v6, ha, hr;
        for (k = 1; k <= 3; k++) {
          ctx.strokeStyle = "rgba(24,32,64," + (0.14 * hf).toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (v6 = 0; v6 <= 6; v6++) {
            ha = -1.5708 + v6 / 6 * 6.2832;
            hr = HR * k / 3 * hf;
            v6 ? ctx.lineTo(Math.cos(ha) * hr, Math.sin(ha) * hr) : ctx.moveTo(Math.cos(ha) * hr, Math.sin(ha) * hr);
          }
          ctx.stroke();
        }
        ctx.strokeStyle = "rgba(24,32,64," + (0.1 * hf).toFixed(3) + ")";
        for (var s6 = 0; s6 < 6; s6++) {
          var sa = -1.5708 + s6 / 6 * 6.2832;
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(sa) * HR * hf, Math.sin(sa) * HR * hf);
          ctx.stroke();
        }
        /* the reading — draws out, holds, folds back to nothing, then
           re-draws with fresh values, cyclically */
        var pf;
        var CYC_START = 3.7, CYC_LEN = 6.4;
        if (!motionOK) {
          pf = 1;
        } else if (te < CYC_START) {
          pf = smooth(clamp((te - 2.7) / 0.9, 0, 1));
        } else {
          var ct = (te - CYC_START) % CYC_LEN;
          var cyc = Math.floor((te - CYC_START) / CYC_LEN);
          if (ct < CYC_LEN - 2.2) {
            pf = 1;                                         /* hold */
          } else if (ct < CYC_LEN - 1.4) {
            pf = 1 - smooth((ct - (CYC_LEN - 2.2)) / 0.8);  /* fold away */
          } else {
            if (radarRegen !== cyc) {                        /* new sounding */
              radarRegen = cyc;
              for (var rv6 = 0; rv6 < 6; rv6++) radarVals[rv6] = 0.38 + Math.random() * 0.57;
            }
            pf = smooth((ct - (CYC_LEN - 1.4)) / 0.9);      /* draw back out */
          }
        }
        if (pf > 0.004) {
          ctx.beginPath();
          for (var p6 = 0; p6 <= 6; p6++) {
            var pa = -1.5708 + (p6 % 6) / 6 * 6.2832;
            var pr = HR * radarVals[p6 % 6] * pf * (1 + (motionOK ? 0.02 * Math.sin(te * 1.4 + p6) : 0));
            p6 ? ctx.lineTo(Math.cos(pa) * pr, Math.sin(pa) * pr) : ctx.moveTo(Math.cos(pa) * pr, Math.sin(pa) * pr);
          }
          ctx.closePath();
          ctx.fillStyle = "rgba(160,95,60," + (0.1 * pf).toFixed(3) + ")";
          ctx.fill();
          ctx.strokeStyle = "rgba(166,98,62," + (0.6 * pf).toFixed(3) + ")";
          ctx.lineWidth = 1.2;
          ctx.stroke();
          for (var d6 = 0; d6 < 6; d6++) {
            var da = -1.5708 + d6 / 6 * 6.2832;
            var dr = HR * radarVals[d6] * pf;
            ctx.fillStyle = "rgba(166,98,62," + (0.85 * pf).toFixed(3) + ")";
            ctx.beginPath();
            ctx.arc(Math.cos(da) * dr, Math.sin(da) * dr, 2.6 + (motionOK ? Math.sin(te * 2 + d6 * 1.3) * 0.7 : 0), 0, 6.2832);
            ctx.fill();
          }
        }
        ctx.fillStyle = "rgba(166,98,62," + (0.8 * hf).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, 6.2832); ctx.fill();
        ctx.restore();
      }

      /* the door dissolves into particles, which drift outward and
         reassemble as the dial mechanism */
      if (te > 0.8 && te < 2.7 && motionOK) {
        var pIn = smooth(clamp((te - 0.8) / 0.3, 0, 1));
        var pOut = 1 - smooth(clamp((te - 2.1) / 0.55, 0, 1));
        var pAl = pIn * pOut;
        if (pAl > 0.004) {
          ctx.fillStyle = "rgba(166,98,62," + (0.65 * pAl).toFixed(3) + ")";
          parts.forEach(function (p) {
            var pe = 1 - Math.pow(1 - clamp((te - 1.0 - p.d) / 1.0, 0, 1), 3);
            /* start on the door's rim; scatter slightly as it breaks */
            var burst = smooth(clamp((te - 0.85) / 0.5, 0, 1)) * 0.12;
            var sr = R * (p.sr + burst);
            var sxx = cx + Math.cos(p.sa - 2.1) * sr;
            var syy = cy + Math.sin(p.sa - 2.1) * sr;
            var tr = R * rings[p.ring].r;
            var xx = lerp(sxx, cx + Math.cos(p.ang) * tr, pe);
            var yy = lerp(syy, cy + Math.sin(p.ang) * tr, pe);
            ctx.beginPath(); ctx.arc(xx, yy, 1.5, 0, 6.2832); ctx.fill();
          });
        }
      }
    };
  }

  /* Just a Minute — a numberless chronograph with a discrete
     one-second hand and a ring of reaction-time readings. */
  function makeMinute() {
    return function (ctx, W, H, te) {
      var cx = W > 860 ? W * 0.68 : W * 0.5;
      var cy = H * 0.52;
      var R = Math.min(W * 0.27, H * 0.35);
      var intro = smooth(clamp(te / 1.1, 0, 1));
      var sy = window.scrollY || 0;

      ctx.save();
      ctx.translate(cx, cy);

      ctx.strokeStyle = "rgba(24,32,64,0.28)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(0, 0, R, -1.5708, -1.5708 + intro * 6.2832);
      ctx.stroke();

      var tickTime = Math.max(0, te - 1.05);
      var tickIndex = Math.floor(tickTime) % 60;
      var tickPhase = tickTime - Math.floor(tickTime);
      var tickAdvance = tickPhase < 0.12
        ? 1 - Math.pow(1 - tickPhase / 0.12, 3)
        : 1;
      var prog = motionOK ? (tickIndex + tickAdvance) / 60 : 0.42;
      var sweepA = -1.5708 + prog * 6.2832;

      ctx.save();
      ctx.rotate(sy * 0.00022);
      for (var t = 0; t < 60; t++) {
        var a = -1.5708 + t / 60 * 6.2832;
        var tf = smooth(clamp((intro * 60 - t * 0.6) / 8, 0, 1));
        var behind = (sweepA - a + 12.566) % 6.2832;
        var glow = te > 1.1 ? Math.exp(-behind * 2.2) : 0;
        var maj = t % 5 === 0;
        var al = (maj ? 0.32 : 0.15) * tf + glow * 0.5;
        ctx.strokeStyle = behind < 0.5 && te > 1.1
          ? "rgba(166,98,62," + al.toFixed(3) + ")"
          : "rgba(24,32,64," + al.toFixed(3) + ")";
        ctx.lineWidth = maj ? 1.4 : 1;
        var l1 = R - (maj ? 16 : 9);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R);
        ctx.lineTo(Math.cos(a) * l1, Math.sin(a) * l1);
        ctx.stroke();
      }
      ctx.restore();

      var sweepFade = smooth(clamp((te - 1.05) / 0.55, 0, 1));
      if (sweepFade > 0.001) {
        var hx = Math.cos(sweepA) * (R - 26), hy = Math.sin(sweepA) * (R - 26);
        ctx.strokeStyle = "rgba(140,78,46," + (0.72 * sweepFade).toFixed(3) + ")";
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.fillStyle = "rgba(24,32,64," + (0.82 * sweepFade).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, 6.2832); ctx.fill();
        ctx.fillStyle = "rgba(140,78,46," + (0.95 * sweepFade).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(hx, hy, 3, 0, 6.2832); ctx.fill();
      }

      var wf = smooth(clamp((te - 0.7) / 1.0, 0, 1));
      if (wf > 0) {
        ctx.strokeStyle = "rgba(24,32,64," + (0.15 * wf).toFixed(3) + ")";
        ctx.lineWidth = 1;
        var r0 = R * 0.58;
        for (var w2 = 0; w2 < 96; w2++) {
          var wa = w2 / 96 * 6.2832 - 1.5708;
          var wig = vnNoise(w2 * 0.35, motionOK ? te * 0.5 : 3);
          var len = (4 + 20 * wig) * wf;
          ctx.beginPath();
          ctx.moveTo(Math.cos(wa) * r0, Math.sin(wa) * r0);
          ctx.lineTo(Math.cos(wa) * (r0 + len), Math.sin(wa) * (r0 + len));
          ctx.stroke();
        }
      }

      ctx.restore();
    };
  }

  /* Petalyx — the capture constellation: particles converge into
     five radial candidates + NOTA; pulses record reaction times */
  function makeCapture() {
    var parts = null, events = [], lastPulse = 0;
    return function (ctx, W, H, te) {
      var cx = W > 860 ? W * 0.66 : W * 0.5;
      var cy = H * 0.52;
      var R = Math.min(W * 0.27, H * 0.34);
      if (!parts) {
        parts = [];
        for (var i = 0; i < 150; i++) {
          parts.push({ sx: Math.random(), sy: Math.random(), a: Math.random() * 6.2832, d: Math.random() * 0.4, orbit: 0.72 + (Math.random() - 0.5) * 0.06 });
        }
      }
      var nodes = [];
      for (var n2 = 0; n2 < 6; n2++) nodes.push(-1.5708 + n2 * 1.0472);
      var intro = smooth(clamp((te - 0.2) / 1.1, 0, 1));
      var sy = window.scrollY || 0;
      var rot = sy * 0.00015 + (motionOK ? Math.sin(te * 0.1) * 0.02 : 0);

      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);

      ctx.strokeStyle = "rgba(24,32,64," + (0.14 * intro).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 8]);
      ctx.beginPath(); ctx.arc(0, 0, R * 0.72, 0, 6.2832); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(24,32,64," + (0.08 * intro).toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.2832); ctx.stroke();

      nodes.forEach(function (a, i) {
        var nx = Math.cos(a) * R * 0.72, ny = Math.sin(a) * R * 0.72;
        var isNota = i === 3;
        ctx.strokeStyle = "rgba(24,32,64," + (0.08 * intro).toFixed(3) + ")";
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); ctx.lineTo(nx, ny); ctx.stroke();
        ctx.fillStyle = "rgba(24,32,64," + ((isNota ? 0.24 : 0.52) * intro).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(nx, ny, isNota ? 3 : 4.2, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = "rgba(24,32,64," + (0.18 * intro).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(nx, ny, isNota ? 8 : 11, 0, 6.2832); ctx.stroke();
      });

      /* ghost petals — the Petalyx flower flashes into place over the
         constellation as it forms, then dissolves into pure geometry */
      if (motionOK && te > 0.5 && te < 2.4) {
        var gIn = smooth(clamp((te - 0.55) / 0.55, 0, 1));
        var gOut = 1 - smooth(clamp((te - 1.5) / 0.8, 0, 1));
        var gA = gIn * gOut;
        if (gA > 0.004) {
          var gs = (R * 0.72 / 228) * (0.82 + 0.18 * gIn);
          nodes.forEach(function (a, i) {
            var isNota = i === 3;
            ctx.save();
            ctx.rotate(a + 1.5708);
            ctx.scale(gs, gs);
            ctx.globalAlpha = gA * (isNota ? 0.4 : 1);
            ctx.strokeStyle = "rgba(24,32,64,0.85)";
            ctx.lineWidth = 1.4 / gs;
            ctx.beginPath();
            ctx.moveTo(0, -60);
            ctx.bezierCurveTo(36, -96, 42, -166, 0, -228);
            ctx.bezierCurveTo(-42, -166, -36, -96, 0, -60);
            ctx.closePath();
            ctx.stroke();
            ctx.strokeStyle = "rgba(166,98,62,0.45)";
            ctx.setLineDash([3 / gs, 6 / gs]);
            ctx.beginPath();
            ctx.moveTo(0, -78);
            ctx.bezierCurveTo(24, -104, 28, -152, 0, -196);
            ctx.bezierCurveTo(-28, -152, -24, -104, 0, -78);
            ctx.closePath();
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
          });
          ctx.globalAlpha = 1;
        }
      }

      var coreFade = smooth(clamp((te - 0.55) / 0.7, 0, 1));
      var pulse = motionOK ? 1 + Math.sin(te * 1.8) * 0.06 : 1;
      ctx.strokeStyle = "rgba(166,98,62," + (0.5 * intro * coreFade).toFixed(3) + ")";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 0, 22 * pulse, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = "rgba(166,98,62," + (0.85 * intro * coreFade).toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, 6.2832); ctx.fill();

      if (motionOK && te > 1.6 && te - lastPulse > 2.1) {
        lastPulse = te;
        events.push({ n: [0, 1, 2, 4, 5][Math.floor(Math.random() * 5)], t: te, ms: 280 + Math.round(Math.random() * 320) });
        if (events.length > 3) events.shift();
      }
      events.forEach(function (ev) {
        var age = te - ev.t;
        var a = nodes[ev.n];
        var nx = Math.cos(a) * R * 0.72, ny = Math.sin(a) * R * 0.72;
        if (age < 0.4) {
          var pp = smooth(age / 0.4);
          var rr = 30 + (R * 0.72 - 30) * pp;
          ctx.fillStyle = "rgba(166,98,62,0.9)";
          ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, 2.6, 0, 6.2832); ctx.fill();
        } else if (age < 1.5) {
          var fa = (age - 0.4) / 1.1;
          ctx.strokeStyle = "rgba(166,98,62," + (0.5 * (1 - fa)).toFixed(3) + ")";
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(nx, ny, 11 + fa * 30, 0, 6.2832); ctx.stroke();
          ctx.fillStyle = "rgba(24,32,64," + (0.55 * (1 - fa)).toFixed(3) + ")";
          ctx.font = "500 13px 'DM Sans', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(ev.ms + " ms", nx, ny - 20 - fa * 10);
        }
      });
      ctx.restore();

      if (te < 1.6 && motionOK) {
        var pAl = clamp(1 - te / 1.5, 0, 1);
        ctx.fillStyle = "rgba(24,32,64," + (0.5 * pAl).toFixed(3) + ")";
        parts.forEach(function (p) {
          var pe = 1 - Math.pow(1 - clamp((te - p.d) / 1.1, 0, 1), 3);
          ctx.beginPath();
          ctx.arc(
            lerp(p.sx * W, cx + Math.cos(p.a) * R * p.orbit, pe),
            lerp(p.sy * H, cy + Math.sin(p.a) * R * p.orbit, pe),
            1.3, 0, 6.2832
          );
          ctx.fill();
        });
      }
    };
  }

  /* Technology — four isometric wireframe layers assembling into
     the stack, with data pulses rising from capture to insight */
  function makeStack() {
    var pulses = [], last = 0;
    return function (ctx, W, H, te) {
      var cx = W > 860 ? W * 0.68 : W * 0.5;
      var cy = H * 0.55;
      var S = Math.min(W * 0.24, H * 0.3);
      var sy = window.scrollY || 0;
      var gap = S * 0.52 + clamp(sy, 0, 600) * 0.055;
      function iso(u, v) { return [cx + (u - v) * S, cy + (u + v) * S * 0.46]; }
      var CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      var accents = ["24,32,64", "166,98,62", "24,32,64", "166,98,62"];

      /* corner risers */
      var cf = smooth(clamp((te - 1.0) / 0.8, 0, 1));
      if (cf > 0) {
        ctx.strokeStyle = "rgba(24,32,64," + (0.09 * cf).toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 6]);
        ctx.beginPath();
        for (var r4 = 0; r4 < 4; r4++) {
          var pC = iso(CORNERS[r4][0], CORNERS[r4][1]);
          ctx.moveTo(pC[0], pC[1] + 1.5 * gap);
          ctx.lineTo(pC[0], pC[1] - 1.5 * gap);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      pulses = pulses.filter(function (pl) { return (te - pl.t) / 1.3 <= 1.3; });

      for (var i = 3; i >= 0; i--) {
        var lf = smooth(clamp((te - 0.14 * i) / 0.9, 0, 1));
        if (lf <= 0) continue;
        var flo = motionOK ? Math.sin(te * 0.7 + i * 0.9) * 4 : 0;
        var dy = -(i - 1.5) * gap + (1 - lf) * 50 + flo;
        var ox = (1 - lf) * (i % 2 ? 70 : -70);
        var flash = 0;
        for (var q = 0; q < pulses.length; q++) {
          var phq = (te - pulses[q].t) / 1.3 * 3;
          flash = Math.max(flash, 1 - Math.min(1, Math.abs(phq - i) * 3.5));
        }
        var col = accents[i];
        ctx.save();
        ctx.translate(ox, dy);
        ctx.globalAlpha = lf;
        ctx.strokeStyle = "rgba(" + col + "," + (0.38 + flash * 0.5).toFixed(3) + ")";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (var c4 = 0; c4 <= 4; c4++) {
          var pB = iso(CORNERS[c4 % 4][0], CORNERS[c4 % 4][1]);
          c4 ? ctx.lineTo(pB[0], pB[1]) : ctx.moveTo(pB[0], pB[1]);
        }
        ctx.stroke();
        ctx.strokeStyle = "rgba(" + col + ",0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var gl = 1; gl < 7; gl++) {
          var gv = gl / 7 * 2 - 1;
          var pA1 = iso(gv, -1), pA2 = iso(gv, 1);
          ctx.moveTo(pA1[0], pA1[1]); ctx.lineTo(pA2[0], pA2[1]);
          var pD1 = iso(-1, gv), pD2 = iso(1, gv);
          ctx.moveTo(pD1[0], pD1[1]); ctx.lineTo(pD2[0], pD2[1]);
        }
        ctx.stroke();
        ctx.fillStyle = "rgba(" + col + ",0.6)";
        for (var cn = 0; cn < 4; cn++) {
          var pN = iso(CORNERS[cn][0], CORNERS[cn][1]);
          ctx.beginPath(); ctx.arc(pN[0], pN[1], 2.2, 0, 6.2832); ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      if (motionOK && te > 1.6 && te - last > 1.7) {
        last = te;
        pulses.push({ t: te, u: Math.random() * 1.4 - 0.7, v: Math.random() * 1.4 - 0.7 });
      }
      pulses.forEach(function (pl) {
        var pp = (te - pl.t) / 1.3;
        if (pp > 1.3) return;
        /* travel finishes at pp = 1; the light then pops — a soft
           expanding fade at the top instead of an instant vanish */
        var travel = Math.min(pp, 1);
        var fade = pp <= 1 ? 1 : clamp(1 - (pp - 1) / 0.3, 0, 1);
        var pop = pp <= 1 ? 0 : (pp - 1) / 0.3;
        var base = iso(pl.u, pl.v);
        var yy = base[1] + 1.5 * gap - travel * 3 * gap - pop * 10;
        var gr = 14 * (1 + pop * 1.6);
        var g2 = ctx.createRadialGradient(base[0], yy, 0, base[0], yy, gr);
        g2.addColorStop(0, "rgba(166,98,62," + (0.55 * fade).toFixed(3) + ")");
        g2.addColorStop(1, "rgba(166,98,62,0)");
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.arc(base[0], yy, gr, 0, 6.2832); ctx.fill();
        ctx.fillStyle = "rgba(140,78,46," + (0.9 * fade).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(base[0], yy, 2.2 + pop * 1.5, 0, 6.2832); ctx.fill();
        if (pop > 0) {
          /* tiny spark ring as it pops away */
          ctx.strokeStyle = "rgba(140,78,46," + (0.5 * fade).toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(base[0], yy, 4 + pop * 14, 0, 6.2832); ctx.stroke();
        }
      });
    };
  }

  document.querySelectorAll("[data-hero-fx]").forEach(function (cv) {
    var kind = cv.getAttribute("data-hero-fx");
    var makers = { bathy: makeBathyHero, vault: makeVault, minute: makeMinute, capture: makeCapture, stack: makeStack, fingerprint: makeFingerprint };
    if (makers[kind]) canvasFX(cv, makers[kind]());
  });

  /* ----------------------------------------------------------
     Hero parallax — the overture recedes as content arrives
  ---------------------------------------------------------- */
  var phList = document.querySelectorAll(".ph");
  if (phList.length && motionOK) {
    var phRun = false;
    var phFrame = function () {
      phRun = false;
      phList.forEach(function (sec) {
        var r = sec.getBoundingClientRect();
        if (r.bottom < -80) return;
        var stackedMobileHero = window.innerWidth <= 760 &&
          sec.matches(".ph--capture, .ph--minute, .ph--vault");
        var sc = clamp(-r.top / Math.max(r.height * 0.9, 1), 0, 1);
        var cv2 = sec.querySelector(".ph-canvas");
        var inner = sec.querySelector(".ph-inner");
        var cue = sec.querySelector(".ph-cue");
        if (stackedMobileHero) {
          if (cv2) { cv2.style.transform = ""; cv2.style.opacity = ""; }
          if (inner) { inner.style.transform = ""; inner.style.opacity = ""; }
          if (cue) cue.style.opacity = "";
          return;
        }
        if (cv2) {
          cv2.style.transform = "translateY(" + (sc * r.height * 0.3).toFixed(1) + "px)";
          cv2.style.opacity = clamp(1 - sc * 1.35, 0, 1).toFixed(3);
        }
        if (inner) {
          inner.style.transform = "translateY(" + (sc * r.height * 0.14).toFixed(1) + "px)";
          inner.style.opacity = clamp(1 - sc * 1.7, 0, 1).toFixed(3);
        }
        if (cue) cue.style.opacity = clamp(1 - sc * 8, 0, 1).toFixed(3);
      });
    };
    window.addEventListener("scroll", function () {
      if (!phRun) { phRun = true; requestAnimationFrame(phFrame); }
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     Layer rows (Technology) — the phase artwork drifts gently
     against the scroll while its row slides in
  ---------------------------------------------------------- */
  var layerImgs = document.querySelectorAll(".layer-visual img");
  if (layerImgs.length && motionOK) {
    var liRun = false;
    var liFrame = function () {
      liRun = false;
      var vh = window.innerHeight;
      layerImgs.forEach(function (img) {
        var r = img.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        var d = (r.top + r.height / 2 - vh / 2) / vh;
        img.style.transform =
          "translateY(" + (d * 24).toFixed(1) + "px) scale(" + (1.06 - Math.min(Math.abs(d), 1) * 0.06).toFixed(3) + ")";
      });
    };
    window.addEventListener("scroll", function () {
      if (!liRun) { liRun = true; requestAnimationFrame(liFrame); }
    }, { passive: true });
    liFrame();
  }

  /* ----------------------------------------------------------
     Six-coordinate compass (Semantic Bathymetry) — the star and
     its pole words form as the reader scrolls them into view
  ---------------------------------------------------------- */
  function buildCompass(holder) {
    var svg = el("svg", {
      viewBox: "-680 -600 1360 1200",
      role: "img",
      "aria-label": "The six-coordinate compass: Approach versus Avoidance, Safety versus Threat, Power versus Powerlessness, Trust versus Suspicion, Moral Sanction versus Transgression, and Vitality versus Depletion, plotted together as one continuous star-shaped form"
    }, holder);

    var defs = el("defs", {}, svg);
    var grad = el("radialGradient", { id: "sbcFill", cx: "50%", cy: "42%", r: "72%" }, defs);
    el("stop", { offset: "0%", "stop-color": "#c67b52", "stop-opacity": "0.16" }, grad);
    el("stop", { offset: "38%", "stop-color": "#182040", "stop-opacity": "0.62" }, grad);
    el("stop", { offset: "100%", "stop-color": "#10162c", "stop-opacity": "0.88" }, grad);

    var R = 400;
    var gRing = el("g", { opacity: 0 }, svg);
    el("circle", { class: "sbc-ring", r: R, "stroke-width": 1.1 }, gRing);
    el("circle", { class: "sbc-ring sbc-ring--dash", r: R - 26, "stroke-width": 1 }, gRing);
    var gTicks = el("g", { class: "sbc-ticks" }, gRing);
    for (var t = 0; t < 72; t++) {
      var a = t / 72 * Math.PI * 2;
      var len = t % 6 === 0 ? 14 : 6;
      el("line", {
        class: "sbc-tick",
        x1: Math.cos(a) * R, y1: Math.sin(a) * R,
        x2: Math.cos(a) * (R - len), y2: Math.sin(a) * (R - len),
        "stroke-width": t % 6 === 0 ? 1.4 : 1
      }, gTicks);
    }
    var gAxes = el("g", { opacity: 0 }, svg);
    for (var ax = 0; ax < 6; ax++) {
      var aa = ax * 30 * Math.PI / 180;
      el("line", {
        class: "sbc-axis",
        x1: Math.cos(aa) * (R - 20), y1: Math.sin(aa) * (R - 20),
        x2: -Math.cos(aa) * (R - 20), y2: -Math.sin(aa) * (R - 20),
        "stroke-width": 1
      }, gAxes);
    }

    var AMPS = [1, 0.8, 0.92, 0.7, 0.95, 0.64];
    function starPath(scale, rotOff) {
      var d = "";
      var SR = 330 * scale;
      for (var k = 0; k <= 240; k++) {
        var th = k / 240 * Math.PI * 2;
        var phi = th + Math.PI / 2 + rotOff;
        var lobe = Math.pow(Math.abs(Math.cos(phi * 3)), 1.45);
        var idx = ((Math.round(phi / (Math.PI / 3)) % 6) + 6) % 6;
        var wob = 1 + 0.05 * Math.sin(th * 5 + 1.7) + 0.035 * Math.sin(th * 9 + 0.4);
        var r = SR * (0.34 + 0.66 * lobe * AMPS[idx]) * wob;
        d += (k ? "L" : "M") + (Math.cos(th) * r).toFixed(1) + "," + (Math.sin(th) * r).toFixed(1);
      }
      return d + "Z";
    }
    var gStarForm = el("g", { opacity: 0 }, svg);
    var gStarWrap = el("g", { class: "sbc-star-wrap" }, gStarForm);
    el("path", { class: "sbc-star", d: starPath(1, 0) }, gStarWrap);
    [[0.78, 0.05, ""], [0.58, 0.12, ""], [0.4, 0.2, " sbc-contour--cream"], [0.24, 0.3, ""]].forEach(function (c) {
      el("path", { class: "sbc-contour" + c[2], d: starPath(c[0], c[1]), fill: "none" }, gStarWrap);
    });
    el("circle", { class: "sbc-center-halo", r: 26 }, gStarWrap);
    el("circle", { class: "sbc-center-dot", r: 4.5 }, gStarWrap);

    var LABELS = [
      { pos: "Approach", neg: "Avoidance", sub: "Orientation vector", ang: -90 },
      { pos: "Safety", neg: "Threat", sub: "Security baseline", ang: -30 },
      { pos: "Power", neg: "Powerlessness", sub: "Agency capacity", ang: 30 },
      { pos: "Trust", neg: "Suspicion", sub: "Reliability index", ang: 90 },
      { pos: "Moral Sanction", neg: "Transgression", sub: "Integrity boundary", ang: 150 },
      { pos: "Vitality", neg: "Depletion", sub: "Momentum energy", ang: 210 }
    ];
    var labelRefs = [];
    LABELS.forEach(function (L) {
      var rad = L.ang * Math.PI / 180;
      var side = Math.abs(Math.cos(rad)) > 0.5 ? (Math.cos(rad) > 0 ? 1 : -1) : 0;
      var dist = side === 0 ? (Math.sin(rad) < 0 ? 492 : 496) : 452;
      var x = Math.cos(rad) * dist, y = Math.sin(rad) * dist;
      var anchor = side === 0 ? "middle" : (side > 0 ? "start" : "end");
      var xoff = side * 22;
      var g = el("g", { class: "sbc-label", opacity: 0 }, svg);
      var t1 = el("text", { class: "sbc-label-pos", x: xoff, y: -22, "text-anchor": anchor }, g);
      t1.textContent = L.pos;
      var t2 = el("text", { class: "sbc-label-neg", x: xoff, y: 8, "text-anchor": anchor }, g);
      var vs = el("tspan", { class: "sbc-label-vs" }, t2);
      vs.textContent = "vs ";
      var ns = el("tspan", {}, t2);
      ns.textContent = L.neg;
      var t3 = el("text", { class: "sbc-label-sub", x: xoff, y: 36, "text-anchor": anchor }, g);
      t3.textContent = L.sub;
      labelRefs.push({ g: g, x: x, y: y });
    });

    var f = 0, target = motionOK ? 0 : 1, alive = false, rafOn = false;
    function apply() {
      rafOn = false;
      f = lerp(f, target, 0.14);
      if (Math.abs(f - target) > 0.003) { rafOn = true; requestAnimationFrame(apply); }
      else f = target;
      var fe = smooth(f);
      gStarForm.setAttribute("opacity", fe.toFixed(3));
      gStarForm.setAttribute("transform",
        "scale(" + (0.25 + 0.75 * fe).toFixed(4) + ") rotate(" + ((1 - fe) * -75).toFixed(2) + ")");
      gRing.setAttribute("opacity", fe.toFixed(3));
      gAxes.setAttribute("opacity", fe.toFixed(3));
      labelRefs.forEach(function (L, i) {
        var li = smooth(clamp((fe - 0.3 - i * 0.05) / 0.5, 0, 1));
        L.g.setAttribute("opacity", li.toFixed(3));
        var k2 = 0.4 + 0.6 * li;
        L.g.setAttribute("transform", "translate(" + (L.x * k2).toFixed(1) + "," + (L.y * k2).toFixed(1) + ")");
      });
      if (fe > 0.995 && !alive) { alive = true; holder.classList.add("is-alive"); }
    }
    function onScroll() {
      if (!motionOK) return;
      var r = holder.getBoundingClientRect();
      var vh = window.innerHeight;
      target = clamp((vh * 0.94 - r.top) / (vh * 0.62), 0, 1);
      if (!rafOn) { rafOn = true; requestAnimationFrame(apply); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    if (motionOK) onScroll(); else { f = 1; apply(); }
  }
  document.querySelectorAll("[data-compass]").forEach(buildCompass);

  /* ----------------------------------------------------------
     Petalyx range — a carousel of editions, and the sandboxed
     demo that opens out of whichever one is chosen.

     The posters are built from demo/petalyx/editions.json, which
     petalyx-source/tools/build-demo.mjs generates from the edition
     config files themselves. Nothing about an edition is described
     twice, so a card cannot look one way here and behave another way
     when it launches.
  ---------------------------------------------------------- */
  var pxRange = document.getElementById("px-range");
  if (pxRange) (function () {
    var BASE     = "demo/petalyx/";
    var rail     = document.getElementById("px-rail");
    var note     = document.getElementById("px-rail-note");
    var viewport = document.getElementById("px-stage-viewport");
    var stageName = document.getElementById("px-stage-name");
    var stageSub  = document.getElementById("px-stage-sub");

    var overlay  = document.getElementById("px-overlay");
    var panel    = overlay.querySelector(".px-overlay__panel");
    var loading  = document.getElementById("px-stage-loading");
    var errorBox = document.getElementById("px-stage-error");
    var errorNote = document.getElementById("px-stage-error-note");

    var editions = [];
    var frame = null;      // the live iframe for the running session
    var openId = null;     // which edition that iframe is running
    var lastCard = null;   // the card the overlay grew out of
    var lastFocus = null;  // where focus goes when the overlay closes

    // The dev build is gitignored, so it only exists on a machine that
    // has run the build. Locally, prefer it; anywhere else, and if it
    // is simply not there, use the release build.
    var LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(window.location.hostname);
    var demoFile = BASE + "index.html";

    // A plain GET rather than a HEAD: some static servers answer HEAD
    // with a 405 or abort it, and getting that wrong would quietly drop
    // you onto the release build while you are trying to develop. This
    // only ever runs on localhost, and it warms the cache for the frame
    // that is about to load the same file.
    function pickDemoFile() {
      if (!LOCAL) return Promise.resolve();
      return fetch(BASE + "dev.html")
        .then(function (r) { if (r.ok) demoFile = BASE + "dev.html"; })
        .catch(function () { /* release build it is */ });
    }

    /* ---- posters ---- */

    // Fonts are per edition and there are nine of them, so each one is
    // fetched only once its card has actually been seen.
    var fontsAsked = {};
    function wantFont(href) {
      if (!href || fontsAsked[href]) return;
      fontsAsked[href] = true;
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }

    // The same fan the widget's own start screen draws: the cast either
    // side, and the result still face down in the middle.
    function castFan(ed) {
      var cast = ed.cast || [];
      if (cast.length < 3) return "";
      var half = Math.floor(cast.length / 2);
      var seats = cast.slice(0, half).map(function (c) { return { c: c }; })
        .concat([{ you: true }])
        .concat(cast.slice(half).map(function (c) { return { c: c }; }));
      var centre = (seats.length - 1) / 2;

      return seats.map(function (seat, i) {
        var d = i - centre, away = Math.abs(d);
        var style = "--r:" + (d * 7).toFixed(1) + "deg" +
                    ";--y:" + (Math.pow(away, 1.6) * 4).toFixed(1) + "px" +
                    ";--s:" + (1 - away * 0.05).toFixed(3);
        if (seat.you) return '<span class="px-card__seat px-card__seat--you" style="' + style + '">?</span>';
        var inner = seat.c.photo
          ? '<img src="' + BASE + seat.c.photo + '" alt="" loading="lazy" />'
          : seat.c.svg;
        return '<span class="px-card__seat" style="' + style + '">' + inner + "</span>";
      }).join("");
    }

    function poster(ed) {
      var t = ed.theme || {};
      var li = document.createElement("li");
      // An edition without a gateway version has no real session behind
      // it. It still shows — the range is the point — but it cannot be
      // opened onto placeholder words.
      li.className = "px-card" + (ed.launchable ? "" : " is-soon");
      li.dataset.edition = ed.id;
      li.style.cssText = [
        "--tint:" + t.accent,
        "--tint-soft:" + (t.accentSoft || t.accent),
        "--surface:" + t.bg,
        "--surface-image:" + (t.poster || t.bgImage || t.bg),
        "--poster-ink:" + (t.posterInk || t.ink),
        "--card-font:" + (ed.fonts && ed.fonts.display ? ed.fonts.display : "inherit")
      ].join(";");

      var mark = ed.mark && ed.mark.type === "image"
        ? '<img src="' + BASE + ed.mark.src + '" alt="" loading="lazy" />'
        : (ed.mark ? ed.mark.svg : "");

      var open = ed.launchable
        ? '<button class="px-card__face" type="button" data-px-open="' + ed.id + '">'
        : '<div class="px-card__face" aria-disabled="true">';
      var close = ed.launchable ? "</button>" : "</div>";
      var cue = ed.launchable
        ? '<span class="px-card__cue">Run this edition &rarr;</span>'
        : '<span class="px-card__cue px-card__cue--soon">More editions coming</span>';

      li.innerHTML =
        open +
          // Optional per-edition photography (see IMAGES.md in
          // petalyx-source). Without it the poster stands on the
          // edition's own palette and typeface.
          (ed.photo ? '<img class="px-card__photo" src="' + BASE + ed.photo + '" alt="" loading="lazy" />' : "") +
          '<span class="px-card__cast" aria-hidden="true">' + castFan(ed) + "</span>" +
          '<span class="px-card__wash" aria-hidden="true"></span>' +
          '<span class="px-card__head"><span class="px-card__name">' + ed.name + "</span>" +
            '<span class="px-card__mark" aria-hidden="true">' + mark + "</span></span>" +
          '<span class="px-card__body">' +
            '<span class="px-card__kicker">' + ed.sub + "</span>" +
            '<span class="px-card__q">' + ed.tagline + "</span>" +
            cue +
          "</span>" +
        close +
        '<p class="px-card__blurb">' + ed.blurb + "</p>";

      // A portrait that never arrives leaves its frame empty rather than
      // showing a broken image; the fan holds its shape either way.
      li.querySelectorAll("img").forEach(function (img) {
        img.onerror = function () { img.remove(); };
      });
      return li;
    }

    function build(list) {
      editions = list;
      list.forEach(function (ed) { rail.appendChild(poster(ed)); });
      pxRange.dataset.state = "idle";
      // No running count of what is unfinished. The posters already say
      // which ones can be opened, and an edition that is not ready yet
      // is not something a visitor needs a tally of.
      note.textContent = "Choose an edition to run it — one instrument, every skin.";
      syncArrows();

      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            var ed = byId(e.target.dataset.edition);
            if (ed && ed.fonts) wantFont(ed.fonts.href);
            io.unobserve(e.target);
          });
        }, { root: rail, rootMargin: "200px" });
        rail.querySelectorAll(".px-card").forEach(function (c) { io.observe(c); });
      } else {
        list.forEach(function (ed) { wantFont(ed.fonts && ed.fonts.href); });
      }
    }

    function byId(id) {
      for (var i = 0; i < editions.length; i++) if (editions[i].id === id) return editions[i];
      return null;
    }

    /* ---- rail paging ---- */
    function syncArrows() {
      var max = rail.scrollWidth - rail.clientWidth - 4;
      pxRange.querySelectorAll("[data-px-dir]").forEach(function (btn) {
        var fwd = +btn.dataset.pxDir > 0;
        btn.classList.toggle("is-off", fwd ? rail.scrollLeft >= max : rail.scrollLeft <= 4);
      });
    }
    pxRange.querySelectorAll("[data-px-dir]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = rail.querySelector(".px-card");
        var step = card ? card.getBoundingClientRect().width + 20 : 300;
        rail.scrollBy({ left: step * (+btn.dataset.pxDir), behavior: motionOK ? "smooth" : "auto" });
      });
    });
    rail.addEventListener("scroll", syncArrows, { passive: true });
    window.addEventListener("resize", syncArrows);

    /* ---- the cards that were not chosen ----
       They leave in the direction they already sit, nearest first, so it
       reads as the range clearing out of the way rather than a fade. */
    function scatter(chosenCard) {
      if (!motionOK) return;
      var pivot = chosenCard.getBoundingClientRect();
      var pivotX = pivot.left + pivot.width / 2;

      rail.querySelectorAll(".px-card").forEach(function (card) {
        if (card === chosenCard) { card.classList.add("is-chosen"); return; }
        var r = card.getBoundingClientRect();
        var away = (r.left + r.width / 2) - pivotX;
        var dir = away < 0 ? -1 : 1;
        var rank = Math.min(4, Math.round(Math.abs(away) / Math.max(r.width, 1)));
        card.style.setProperty("--dx", (dir * (140 + rank * 90)).toFixed(0) + "px");
        card.style.setProperty("--dy", (18 + rank * 14).toFixed(0) + "px");
        card.style.setProperty("--rot", (dir * (5 + rank * 2)).toFixed(0) + "deg");
        card.style.setProperty("--delay", (rank * 0.045).toFixed(3) + "s");
        card.classList.add("is-leaving");
      });
    }

    function clearScatter() {
      rail.querySelectorAll(".px-card").forEach(function (card) {
        card.classList.remove("is-leaving", "is-chosen");
        ["--dx", "--dy", "--rot", "--delay"].forEach(function (v) { card.style.removeProperty(v); });
      });
    }

    /* ---- growing the panel out of the thing that was pressed ----
       Measure the origin element, measure the panel where it has come to
       rest, and set the transform that would put one on top of the other.
       Removing that transform on the next tick plays it forwards.

       The scale is uniform. A non-uniform one would match the card's
       proportions exactly and stretch every glyph inside the panel on
       the way out, which costs more than the extra fidelity buys. */
    function growFrom(el) {
      if (!motionOK || !el) { overlay.dataset.anim = "open"; return; }
      var from = el.getBoundingClientRect();
      var to = panel.getBoundingClientRect();
      if (!to.width || !to.height) { overlay.dataset.anim = "open"; return; }

      var scale = Math.max(0.05, Math.min(1, from.width / to.width));
      var dx = (from.left + from.width / 2) - (to.left + to.width / 2);
      var dy = (from.top + from.height / 2) - (to.top + to.height / 2);

      overlay.dataset.anim = "from";
      panel.style.transition = "none";
      panel.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px) scale(" + scale.toFixed(4) + ")";
      void panel.offsetHeight;          // flush, so there is a start value
      panel.style.transition = "";
      overlay.dataset.anim = "to";
      window.setTimeout(function () {
        if (overlay.dataset.anim !== "to") return;
        // Drop the inline start transform as the state changes. Leaving
        // it in place would put the panel straight back at card size the
        // moment the "to" rule that overrode it stopped applying.
        panel.style.transform = "";
        overlay.dataset.anim = "open";
      }, 560);
    }

    function shrinkTo(el, done) {
      if (!motionOK) { done(); return; }
      var to = panel.getBoundingClientRect();
      var from = el && el.getBoundingClientRect();
      if (from && from.width && to.width) {
        var scale = Math.max(0.05, Math.min(1, from.width / to.width));
        var dx = (from.left + from.width / 2) - (to.left + to.width / 2);
        var dy = (from.top + from.height / 2) - (to.top + to.height / 2);
        panel.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px) scale(" + scale.toFixed(4) + ")";
      }
      overlay.dataset.anim = "out";
      window.setTimeout(done, 340);
    }

    /* ---- the page behind the overlay ----
       overflow:hidden on body is ignored by iOS Safari, so the page is
       pinned with position:fixed and the scroll position put back by
       hand afterwards. */
    var lockedAt = 0;
    function lockPage() {
      lockedAt = window.scrollY || window.pageYOffset || 0;
      document.body.style.top = (-lockedAt) + "px";
      document.body.classList.add("px-locked");
    }
    function unlockPage() {
      if (!document.body.classList.contains("px-locked")) return;
      document.body.classList.remove("px-locked");
      document.body.style.top = "";
      // While the body was fixed the document was only a viewport tall,
      // so the scroll range had collapsed. Force the layout back before
      // asking for the old position or the request is clamped to zero —
      // and ask for it instantly, since this site scrolls smoothly and
      // an animated jump back up the page is not what was wanted.
      void document.documentElement.scrollHeight;
      window.scrollTo({ top: lockedAt, left: 0, behavior: "instant" });
    }

    /* ---- focus ----
       An overlay that leaves the tab order running through the page
       behind it is unusable with a keyboard and lies to a screen reader. */
    function focusables() {
      return [].slice.call(panel.querySelectorAll(
        'button:not([disabled]), [href], iframe, [tabindex]:not([tabindex="-1"])'
      )).filter(function (el) { return el.offsetParent !== null || el.tagName === "IFRAME"; });
    }
    function trapFocus(e) {
      if (e.key !== "Tab" || overlay.hidden) return;
      var list = focusables();
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    /* ---- the frame, and knowing whether it actually started ---- */
    var readyTimer = 0;

    function showState(which, note) {
      loading.hidden = which !== "loading";
      errorBox.hidden = which !== "error";
      if (note) errorNote.textContent = note;
      overlay.dataset.ready = which === "ready" ? "1" : "0";
    }

    function mountFrame(id) {
      var ed = byId(id) || {};
      var f = document.createElement("iframe");
      f.title = "Petalyx demonstration — " + (ed.name || "") + " edition";
      f.setAttribute("sandbox", "allow-scripts allow-same-origin allow-downloads");
      f.setAttribute("allow", "fullscreen; web-share");
      f.setAttribute("referrerpolicy", "same-origin");
      // A frame that 404s or is blocked fires no useful event of its own,
      // so the demo reports its own boot and this is the deadline for it.
      f.addEventListener("error", function () {
        showState("error", "The demonstration could not be loaded.");
      });
      f.src = demoFile + "?edition=" + encodeURIComponent(id);
      viewport.appendChild(f);

      showState("loading");
      window.clearTimeout(readyTimer);
      readyTimer = window.setTimeout(function () {
        if (overlay.dataset.ready === "1") return;
        showState("error", "It didn’t finish starting. This is usually a hiccup rather than anything broken.");
      }, 8000);
      return f;
    }

    function open(id, origin) {
      var ed = byId(id);
      if (!ed) return;
      // The card, not the button inside it: the scatter compares against
      // the .px-card elements, and growing the panel out of the button
      // alone would start it from the wrong rectangle.
      var opener = rail.querySelector('[data-px-open="' + id + '"]');
      var card = opener ? opener.closest(".px-card") : null;
      if (card) lastCard = card;
      lastFocus = document.activeElement;

      if (frame && openId !== id) destroy();

      panel.style.setProperty("--stage-tint", ed.theme.accent);
      overlay.style.setProperty("--stage-tint", ed.theme.accent);
      stageName.textContent = ed.name;
      stageSub.textContent = ed.sub;

      overlay.hidden = false;
      lockPage();

      if (!frame) { frame = mountFrame(id); openId = id; }
      else { frame.style.display = ""; }

      panel.style.transform = "";
      var from = origin || lastCard;
      growFrom(from);
      // Only when it came out of the rail. Resuming comes from the dock,
      // and the rail is already sitting there intact behind it.
      if (from && from === lastCard) scatter(lastCard);

      document.addEventListener("keydown", trapFocus, true);
      window.setTimeout(function () {
        var btn = panel.querySelector(".px-stage__btn");
        if (btn) btn.focus({ preventScroll: true });
      }, motionOK ? 380 : 0);
    }

    function leave(target, after) {
      document.removeEventListener("keydown", trapFocus, true);
      shrinkTo(target, function () {
        overlay.hidden = true;
        overlay.dataset.anim = "";
        panel.style.transform = "";
        unlockPage();
        clearScatter();
        syncArrows();
        if (after) after();
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      });
    }

    function destroy() {
      window.clearTimeout(readyTimer);
      if (frame) { frame.remove(); frame = null; }
      openId = null;
      showState("loading");
    }

    function close() {
      if (overlay.hidden) { destroy(); return; }
      leave(lastCard, function () { destroy(); });
    }

    function retry() {
      if (!openId) return;
      var id = openId;
      destroy();
      frame = mountFrame(id);
      openId = id;
    }

    /* ---- wiring ---- */
    function act(name) {
      if (name === "close") close();
      else if (name === "retry") retry();
    }

    document.addEventListener("click", function (e) {
      var opener = e.target.closest("[data-px-open]");
      if (opener && pxRange.contains(opener)) {
        open(opener.dataset.pxOpen, opener.closest(".px-card"));
        return;
      }
      var button = e.target.closest("[data-px-act]");
      if (button) act(button.dataset.pxAct);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !overlay.hidden) { e.preventDefault(); close(); }
    });

    // The widget reports its own boot, and asks to be closed when a
    // visitor picks "try another edition". Everything arriving here is
    // untrusted: messages are accepted only from the frame we mounted,
    // only three intents are acted on, and nothing in the payload is
    // read back into the page.
    window.addEventListener("message", function (e) {
      if (!frame || e.source !== frame.contentWindow) return;
      var d = e.data;
      if (!d || d.source !== "petalyx") return;
      if (d.type === "ready") { window.clearTimeout(readyTimer); showState("ready"); }
      // Only while it is still starting. Once it is up, a stumble inside
      // the widget is not a reason to pull a session out from under
      // someone who is halfway through it.
      else if (d.type === "error" && overlay.dataset.ready !== "1") {
        window.clearTimeout(readyTimer);
        showState("error", "The demonstration reported a problem starting up.");
      }
      else if (d.type === "close") close();
    });

    pickDemoFile()
      .then(function () { return fetch(BASE + "editions.json", { cache: "no-cache" }); })
      .then(function (r) { if (!r.ok) throw new Error("editions.json " + r.status); return r.json(); })
      .then(function (data) { build(data.editions || []); })
      .catch(function () {
        pxRange.dataset.state = "error";
        note.textContent = "The Petalyx™ demonstration is unavailable just now.";
      });
  })();


})();


/* ---- anchor landing, after layout settles ----
   Arriving at petalyx.html#demo, the browser jumps to the section
   immediately, then the hero images and reveal animations above it
   resolve and push it back down, leaving the visitor at the top of the
   page wondering where the demo went. Re-running the jump once
   everything has loaded puts them where the link promised.

   Only ever on first load, and only for a hash that matches something
   real, so it can never fight a visitor who has started scrolling. */
(function () {
  if (!window.location.hash) return;
  var target;
  try { target = document.querySelector(window.location.hash); } catch (e) { return; }
  if (!target) return;

  var settle = function () {
    // A visitor who has already scrolled somewhere themselves is left
    // alone; this is only for the case where nothing has moved yet.
    if (window.scrollY > 4 && Math.abs(window.scrollY - lastJump) > 80) return;
    lastJump = target.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: lastJump, behavior: "instant" in document.documentElement.style ? "instant" : "auto" });
  };
  var lastJump = -999;

  window.addEventListener("load", function () {
    settle();
    // Late-loading imagery can shift it once more.
    window.setTimeout(settle, 260);
  });
})();
