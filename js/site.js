// Theme: apply saved choice (or system preference) before first paint.
(function () {
  var theme = null;
  try { theme = localStorage.getItem("theme"); } catch (e) {}
  if (!theme) {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-theme", theme);
})();

document.addEventListener("DOMContentLoaded", function () {
  // Theme toggle
  var btn = document.querySelector(".theme-toggle");
  function syncLabel() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    if (btn) {
      btn.textContent = dark ? "Light" : "Dark";
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    }
  }
  if (btn) {
    btn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      syncLabel();
    });
  }
  syncLabel();

  // Live clock: MM/DD/YYYY HH:MM:SS:mmm (seconds only if reduced motion is on)
  var clock = document.querySelector(".clock");
  if (clock) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var pad = function (n, l) { n = String(n); while (n.length < (l || 2)) n = "0" + n; return n; };
    var tick = function () {
      var d = new Date();
      var s = pad(d.getMonth() + 1) + "/" + pad(d.getDate()) + "/" + d.getFullYear() + " " +
              pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
      if (!reduce) s += ":" + pad(d.getMilliseconds(), 3);
      clock.textContent = s;
    };
    tick();
    setInterval(tick, reduce ? 1000 : 41);
  }
});
