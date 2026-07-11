/* ============================================================
   COGNITIF GROUP — shared behaviour
   nav · reveals · Petalyx graphic · scroll hero · ember trail
   ============================================================ */
(function () {
  "use strict";

  var doc = document.documentElement;
  var motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (motionOK) doc.classList.add("motion-ok");

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
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          ro.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });
    revealEls.forEach(function (el) { ro.observe(el); });
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
    var centre = opts.centre || "ANCHOR";
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
    el("circle", { class: "px-center-halo", r: 74 }, cg);
    el("circle", { class: "px-center-ring", r: 58 }, cg);
    var tag = el("text", { class: "px-center-tag", y: -18 }, cg);
    tag.textContent = "Prompt";
    var cw = el("text", { class: "px-center-word", y: 10, x: 4 }, cg);
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
     Ember cursor trail — inner pages, fine pointers only
  ---------------------------------------------------------- */
  var emberHost = document.querySelector(".ember");
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  if (emberHost && motionOK && finePointer) {
    doc.classList.add("ember-on");
    var dots = Array.prototype.slice.call(emberHost.querySelectorAll("span"));
    var speeds = [0.035, 0.06, 0.1];
    var mx = window.innerWidth / 2, my = window.innerHeight * 0.4;
    var pts = dots.map(function () { return { x: mx, y: my }; });
    var emberLive = false;

    window.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (!emberLive) { emberLive = true; requestAnimationFrame(emberFrame); }
    }, { passive: true });

    function emberFrame() {
      var still = 0;
      pts.forEach(function (pt, i) {
        pt.x = lerp(pt.x, mx, speeds[i]);
        pt.y = lerp(pt.y, my, speeds[i]);
        if (Math.abs(pt.x - mx) + Math.abs(pt.y - my) < 0.3) still++;
        dots[i].style.transform = "translate3d(" + pt.x + "px," + pt.y + "px,0)";
      });
      if (still === pts.length) { emberLive = false; return; }
      requestAnimationFrame(emberFrame);
    }
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
  /* palette ramp: basins slate → mid cream → peaks copper */
  function heightColor(h, alpha) {
    var r, g, b;
    if (h < 0) {
      var t = clamp(-h, 0, 1);
      r = lerp(242, 128, t); g = lerp(233, 148, t); b = lerp(210, 186, t);
    } else {
      var t2 = clamp(h, 0, 1);
      r = lerp(242, 224, t2); g = lerp(233, 154, t2); b = lerp(210, 108, t2);
    }
    return "rgba(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + "," + alpha + ")";
  }

  var VIZ_CONF = {
    surface: {
      nx: 42, nz: 30, rx: -0.44, ry0: 0.6, zoom: 1.02, lift: 0.52,
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
    terrainbox: {
      nx: 26, nz: 26, rx: -0.38, ry0: 0.75, zoom: 0.6, lift: 0.78,
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
      if (appearT !== null && motionOK) {
        var ap = clamp((now - appearT) / 1500, 0, 1);
        amp = smooth(ap);
      }
      var swing = (appearT !== null && motionOK) ? (1 - amp) * -0.55 : 0;
      window.__vizdbg = { amp: amp, visible: visible, appearT: appearT, hsMax: Math.max.apply(null, hs), W: W, H: H, S: Math.min(W, H * 1.5) * 0.36 * conf.zoom };
      var drift = motionOK ? Math.sin(te * 0.22) * 0.1 : 0;
      var ry = conf.ry0 + userRy + drift + swing;
      var rx = clamp(conf.rx + userRx, -0.95, -0.12);
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
        ctx.strokeStyle = "rgba(242,233,210,0.16)";
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
        ctx.strokeStyle = "rgba(224,154,108,0.75)";
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(ptop.x, ptop.y); ctx.lineTo(pbot.x, pbot.y);
        ctx.stroke();
        ctx.setLineDash([]);
        for (var ring = 0; ring < 4; ring++) {
          var rr = (0.09 + ring * 0.085) * (motionOK ? (0.9 + 0.1 * Math.sin(te * 1.6 - ring * 0.9)) : 1);
          var a2 = 0.55 - ring * 0.12 + (motionOK ? 0.12 * Math.sin(te * 1.6 - ring * 0.9) : 0);
          ctx.strokeStyle = "rgba(224,154,108," + clamp(a2, 0.06, 0.7) * amp + ")";
          ctx.beginPath();
          for (var th = 0; th <= 26; th++) {
            var ang = th / 26 * Math.PI * 2;
            var rp = project(pu + Math.cos(ang) * rr, 0.004, pv + Math.sin(ang) * rr, m);
            if (th === 0) ctx.moveTo(rp.x, rp.y); else ctx.lineTo(rp.x, rp.y);
          }
          ctx.stroke();
        }
        var dot = project(pu, 0.004, pv, m);
        ctx.fillStyle = "rgba(224,154,108," + 0.9 * amp + ")";
        ctx.beginPath(); ctx.arc(dot.x, dot.y, 2.6, 0, Math.PI * 2); ctx.fill();
      }

      /* floating labels (surface) */
      if (conf.labels.length && amp > 0.85) {
        ctx.font = "500 10px 'DM Sans', sans-serif";
        ctx.textAlign = "left";
        conf.labels.forEach(function (L) {
          var hh = conf.height(L.u, L.v) * conf.hmax * amp;
          var pl = project(L.u, hh, L.v, m);
          var ly = L.above ? pl.y - 34 : pl.y + 34;
          ctx.strokeStyle = "rgba(242,233,210,0.35)";
          ctx.beginPath();
          ctx.moveTo(pl.x, pl.y + (L.above ? -6 : 6));
          ctx.lineTo(pl.x + 14, ly);
          ctx.lineTo(pl.x + 22, ly);
          ctx.stroke();
          ctx.fillStyle = "rgba(242,233,210,0.62)";
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
      userRx += (e.clientY - ly2) * 0.004;
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
})();
