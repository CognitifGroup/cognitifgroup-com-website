/* Apply an explicitly chosen theme before CSS paints. Light is the default. */
(function () {
  "use strict";

  var theme = "light";
  try {
    if (window.localStorage.getItem("cognitif-theme") === "dark") theme = "dark";
  } catch (e) {}

  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
})();
