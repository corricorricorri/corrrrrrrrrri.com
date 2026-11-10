// Site search. No build step: it reads the blog page, Writing page and About
// page directly, so anything listed on those pages becomes searchable.
(function () {
  var form = document.getElementById("search-form");
  var input = document.getElementById("q");
  var status = document.getElementById("search-status");
  var results = document.getElementById("search-results");
  if (!form || !input || !results) return;

  var indexPromise = null;

  function clean(s) { return (s || "").replace(/\s+/g, " ").trim(); }
  function fold(s) {
    return (s || "").split("").map(function (c) { return c.normalize("NFD").charAt(0); }).join("");
  }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function getDoc(url) {
    return fetch(url)
      .then(function (r) { if (!r.ok) throw new Error(url); return r.text(); })
      .then(function (t) { return new DOMParser().parseFromString(t, "text/html"); });
  }

  function textOf(el, sel) {
    var n = el.querySelector(sel);
    return n ? clean(n.textContent) : "";
  }

  function buildIndex() {
    if (indexPromise) return indexPromise;
    indexPromise = Promise.all([
      getDoc("/").catch(function () { return null; }),
      getDoc("/writing.html").catch(function () { return null; }),
      getDoc("/about.html").catch(function () { return null; }),
      getDoc("/exhibitions.html").catch(function () { return null; })
    ]).then(function (docs) {
      var blog = docs[0], writing = docs[1], about = docs[2], exhibitions = docs[3];
      var items = [];
      var postFetches = [];

      if (blog) {
        blog.querySelectorAll("article.entry").forEach(function (art) {
          var a = art.querySelector(".entry-title a");
          if (!a) return;
          var url = a.getAttribute("href");
          var item = {
            title: clean(a.textContent),
            url: url,
            type: "Blog",
            date: textOf(art, "time"),
            text: textOf(art, ".entry-excerpt")
          };
          items.push(item);
          postFetches.push(
            getDoc(url).then(function (d) {
              var body = d.querySelector(".post-body");
              var sub = d.querySelector(".post-subtitle");
              item.text = clean((sub ? sub.textContent + " " : "") + (body ? body.textContent : item.text));
            }).catch(function () {})
          );
        });
      }

      if (writing) {
        writing.querySelectorAll("article.entry").forEach(function (art) {
          var a = art.querySelector(".entry-title a");
          if (!a) return;
          items.push({
            title: clean(a.textContent),
            url: a.getAttribute("href"),
            type: "Writing",
            date: textOf(art, ".outlet") || textOf(art, "time"),
            text: clean(textOf(art, ".outlet") + " " + textOf(art, ".entry-excerpt"))
          });
        });
      }

      if (exhibitions) {
        exhibitions.querySelectorAll("article.entry").forEach(function (art) {
          var heading = art.querySelector(".entry-title");
          if (!heading) return;
          var a = heading.querySelector("a");
          items.push({
            title: clean(heading.textContent),
            url: a ? a.getAttribute("href") : "/exhibitions.html",
            type: "Exhibition",
            date: textOf(art, ".outlet") || textOf(art, "time"),
            text: clean(textOf(art, ".outlet") + " " + textOf(art, ".entry-excerpt"))
          });
        });
      }

      if (about) {
        var main = about.querySelector("main");
        if (main) {
          items.push({
            title: "About",
            url: "/about.html",
            type: "Page",
            date: "",
            text: clean(main.textContent)
          });
        }
      }

      return Promise.all(postFetches).then(function () { return items; });
    });
    return indexPromise;
  }

  function termsOf(q) {
    return fold(clean(q).toLowerCase()).split(" ").filter(Boolean);
  }

  function score(item, terms) {
    var title = fold(item.title.toLowerCase());
    var text = fold(item.text.toLowerCase());
    var total = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      var inTitle = title.indexOf(t) !== -1;
      var idx = text.indexOf(t);
      if (!inTitle && idx === -1) return 0; // every word must match somewhere
      if (inTitle) total += 10;
      if (idx !== -1) {
        var count = text.split(t).length - 1;
        total += Math.min(count, 5);
      }
    }
    return total;
  }

  function snippet(text, terms) {
    var low = fold(text.toLowerCase());
    var pos = -1;
    terms.forEach(function (t) {
      var p = low.indexOf(t);
      if (p !== -1 && (pos === -1 || p < pos)) pos = p;
    });
    if (pos === -1) pos = 0;
    var start = Math.max(0, pos - 70);
    var end = Math.min(text.length, pos + 150);
    if (start > 0) { var sp = text.indexOf(" ", start); if (sp !== -1 && sp < pos) start = sp + 1; }
    var out = text.slice(start, end);
    return (start > 0 ? "…" : "") + out + (end < text.length ? "…" : "");
  }

  function appendHighlighted(el, text, terms) {
    if (!terms.length) { el.appendChild(document.createTextNode(text)); return; }
    var re = new RegExp(terms.map(escRe).join("|"), "gi");
    var folded = fold(text);
    var last = 0, m;
    while ((m = re.exec(folded)) !== null) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      if (m.index > last) el.appendChild(document.createTextNode(text.slice(last, m.index)));
      var mark = document.createElement("mark");
      mark.textContent = text.slice(m.index, m.index + m[0].length);
      el.appendChild(mark);
      last = m.index + m[0].length;
    }
    if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)));
  }

  function render(items, q) {
    results.textContent = "";
    var terms = termsOf(q);
    if (!terms.length) {
      status.textContent = "Search posts, writing, and notes.";
      return;
    }
    var hits = items
      .map(function (it) { return { it: it, s: score(it, terms) }; })
      .filter(function (h) { return h.s > 0; })
      .sort(function (a, b) { return b.s - a.s; });

    if (!hits.length) {
      status.textContent = "No results for “" + clean(q) + "”. Try a different word.";
      return;
    }
    status.textContent = hits.length + (hits.length === 1 ? " result" : " results") + " for “" + clean(q) + "”";

    hits.forEach(function (h) {
      var it = h.it;
      var art = document.createElement("article");
      art.className = "entry";

      var h2 = document.createElement("h2");
      h2.className = "entry-title";
      var a = document.createElement("a");
      a.href = it.url;
      appendHighlighted(a, it.title, terms);
      h2.appendChild(a);
      art.appendChild(h2);

      var meta = document.createElement("div");
      meta.className = "entry-meta";
      var type = document.createElement("span");
      type.className = "author";
      type.textContent = it.type;
      meta.appendChild(type);
      if (it.date) {
        var d = document.createElement(it.type === "Blog" ? "time" : "span");
        if (it.type !== "Blog") d.className = "outlet";
        d.textContent = it.date;
        meta.appendChild(d);
      }
      art.appendChild(meta);

      var p = document.createElement("p");
      p.className = "entry-excerpt";
      appendHighlighted(p, snippet(it.text, terms), terms);
      art.appendChild(p);

      results.appendChild(art);
    });
  }

  function run(q) {
    status.textContent = "Searching…";
    buildIndex().then(function (items) {
      // ignore stale responses if the input changed meanwhile
      if (clean(input.value) !== clean(q)) return;
      render(items, q);
    }).catch(function () {
      status.textContent = "Search isn’t available right now. Reload the page and try again.";
    });
  }

  function syncUrl(q) {
    try {
      var url = new URL(window.location.href);
      if (clean(q)) url.searchParams.set("q", clean(q)); else url.searchParams.delete("q");
      history.replaceState(null, "", url.toString());
    } catch (e) {}
  }

  var timer = null;
  input.addEventListener("input", function () {
    clearTimeout(timer);
    var q = input.value;
    timer = setTimeout(function () {
      syncUrl(q);
      if (!clean(q)) { results.textContent = ""; status.textContent = "Search posts, writing, and notes."; return; }
      run(q);
    }, 120);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    syncUrl(input.value);
    if (clean(input.value)) run(input.value);
  });

  var initial = new URLSearchParams(window.location.search).get("q");
  if (initial) { input.value = initial; run(initial); }
  else { status.textContent = "Search posts, writing, and notes."; }
  input.focus();
})();
