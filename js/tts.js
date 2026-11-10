// "Listen" reader for blog posts. Uses the browser's built-in speech
// (Web Speech API), so there is no server, account or cost involved.
// Controls are added automatically under each post's subtitle.
(function () {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;

  var article = document.querySelector("article");
  var body = document.querySelector(".post-body");
  if (!article || !body) return;

  var synth = window.speechSynthesis;
  var lang = document.documentElement.lang || "en";
  var chunks = [];
  var index = 0;        // chunk currently being read
  var state = "idle";   // idle | playing | paused
  var runId = 0;        // lets us ignore events from a cancelled run
  var keep = null;      // keep a reference so browsers don't drop the utterance
  var rate = 1;

  try {
    var saved = parseFloat(localStorage.getItem("ttsRate"));
    if (saved >= 0.5 && saved <= 2) rate = saved;
  } catch (e) {}

  /* ---------- what gets read ---------- */

  function clean(s) {
    return (s || "")
      .replace(/\s*(--|—|–)\s*/g, ", ")   // dashes become a natural pause
      .replace(/\s-\s/g, ", ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function collectParagraphs() {
    var out = [];
    var title = document.querySelector(".post-title");
    var sub = document.querySelector(".post-subtitle");
    if (title) out.push(clean(title.textContent));
    if (sub) out.push(clean(sub.textContent));
    body.querySelectorAll("p, h2, h3").forEach(function (el) {
      if (el.closest("figure")) return;            // skip image captions
      var t = clean(el.innerText || el.textContent);
      if (t) out.push(t);
    });
    return out.filter(Boolean);
  }

  // Break text into pieces short enough for every browser's voice engine.
  function toChunks(paragraphs) {
    var result = [];
    var sentenceRe = /[^.!?…]+(?:[.!?…]+["”’')\]]*|$)\s*/g;
    paragraphs.forEach(function (p) {
      var sentences = p.match(sentenceRe) || [p];
      var cur = "";
      sentences.forEach(function (s) {
        s = s.trim();
        if (!s) return;
        if (s.length > 300) {                       // very long sentence: split on commas
          if (cur) { result.push(cur); cur = ""; }
          var parts = s.split(/,\s+/), piece = "";
          parts.forEach(function (part) {
            if ((piece + " " + part).length > 220 && piece) { result.push(piece); piece = part; }
            else piece = piece ? piece + ", " + part : part;
          });
          if (piece) result.push(piece);
          return;
        }
        if (cur && (cur + " " + s).length > 220) { result.push(cur); cur = s; }
        else cur = cur ? cur + " " + s : s;
      });
      if (cur) result.push(cur);
    });
    return result;
  }

  /* ---------- playback ---------- */

  function next(id) {
    if (id !== runId) return;
    if (index >= chunks.length) { finish(); return; }
    var u = new SpeechSynthesisUtterance(chunks[index]);
    u.rate = rate;
    u.lang = lang;
    u.onend = function () { if (id !== runId) return; index++; next(id); };
    u.onerror = function (e) {
      if (id !== runId) return;
      if (e && (e.error === "canceled" || e.error === "interrupted")) return;
      index++; next(id);
    };
    keep = u;
    synth.speak(u);
  }

  function speakFrom(i) {
    runId++;
    var id = runId;
    synth.cancel();
    index = i;
    setTimeout(function () { next(id); }, 60);    // some browsers need a beat after cancel()
  }

  function finish() { state = "idle"; index = 0; render(); }

  function play() {
    if (state === "idle") { chunks = toChunks(collectParagraphs()); index = 0; }
    state = "playing";
    render();
    speakFrom(index);
  }

  // Pause = stop and remember where we were (works the same in every browser).
  function pause() { state = "paused"; runId++; synth.cancel(); render(); }

  function stop() { state = "idle"; runId++; synth.cancel(); index = 0; render(); }

  /* ---------- controls ---------- */

  var box = document.createElement("div");
  box.className = "tts";
  box.setAttribute("role", "group");
  box.setAttribute("aria-label", "Listen to this post");

  var main = document.createElement("button");
  main.type = "button";
  main.className = "tts-main";

  var stopBtn = document.createElement("button");
  stopBtn.type = "button";
  stopBtn.className = "tts-stop";
  stopBtn.textContent = "Stop";
  stopBtn.hidden = true;

  var label = document.createElement("label");
  label.className = "tts-speed";
  label.appendChild(document.createTextNode("Speed "));
  var select = document.createElement("select");
  select.setAttribute("aria-label", "Reading speed");
  [["0.8", "0.8x"], ["1", "1x"], ["1.25", "1.25x"], ["1.5", "1.5x"], ["1.75", "1.75x"]].forEach(function (o) {
    var opt = document.createElement("option");
    opt.value = o[0];
    opt.textContent = o[1];
    if (parseFloat(o[0]) === rate) opt.selected = true;
    select.appendChild(opt);
  });
  label.appendChild(select);

  box.appendChild(main);
  box.appendChild(stopBtn);
  box.appendChild(label);

  function render() {
    main.textContent = state === "playing" ? "Pause" : state === "paused" ? "Resume" : "Listen to this post";
    main.setAttribute("aria-label", state === "playing" ? "Pause reading" : state === "paused" ? "Resume reading" : "Listen to this post");
    stopBtn.hidden = state === "idle";
  }

  main.addEventListener("click", function () {
    if (state === "playing") pause(); else play();
  });
  stopBtn.addEventListener("click", stop);
  select.addEventListener("change", function () {
    rate = parseFloat(select.value) || 1;
    try { localStorage.setItem("ttsRate", String(rate)); } catch (e) {}
    if (state === "playing") speakFrom(index);     // apply the new speed right away
  });

  // stop talking if the reader leaves the page
  window.addEventListener("pagehide", function () { runId++; synth.cancel(); });

  // Only offer "Listen" when there is a real article to read (not a short summary page).
  var bodyText = (body.innerText || body.textContent || "").replace(/\s+/g, " ").trim();
  if (bodyText.length < 800) return;

  var anchor = article.querySelector(".post-subtitle") ||
               article.querySelector(".post-byline") ||
               article.querySelector(".post-title");
  if (!anchor || !anchor.parentNode) return;
  anchor.parentNode.insertBefore(box, anchor.nextSibling);
  render();
})();
