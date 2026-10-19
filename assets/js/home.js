/* Small, bounded movements around the brand mark; scrolling stays native. */
(function () {
  "use strict";
  var hero = document.querySelector(".home .hx--brand");
  if (!hero) return;
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var pointer = window.matchMedia("(pointer: fine)");
  var mark = hero.querySelector(".hx-logo-animation");
  var visible = false;
  function sync() {
    hero.classList.toggle("home-hero-visible", visible && !document.hidden && !motion.matches);
    if (motion.matches || document.hidden || !visible) reset();
  }
  function reset() {
    mark.style.removeProperty("--hero-rx");
    mark.style.removeProperty("--hero-ry");
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      sync();
    }).observe(hero);
  } else { visible = true; sync(); }
  hero.addEventListener("pointermove", function (event) {
    if (motion.matches || !pointer.matches || !visible) return;
    var rect = hero.getBoundingClientRect();
    var x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    var y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    mark.style.setProperty("--hero-rx", (-y * 3).toFixed(2) + "deg");
    mark.style.setProperty("--hero-ry", (x * 4).toFixed(2) + "deg");
  }, { passive: true });
  hero.addEventListener("pointerleave", reset);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
})();
