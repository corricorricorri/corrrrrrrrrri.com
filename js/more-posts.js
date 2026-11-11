// Fills the "Previous post" section at the end of an article.
// It reads the blog page (newest first) and shows the post listed right
// after the current one, so new posts need no extra setup. The oldest post
// has nothing after it, so the section stays hidden there.
(function () {
  var box = document.getElementById("more-posts");
  if (!box) return;
  var body = box.querySelector(".post-more-body");
  if (!body) return;

  function norm(p) {
    return (p.replace(/[?#].*$/, "")
             .replace(/\/index\.html$/, "/")
             .replace(/\.html$/, "")
             .replace(/\/+$/, "")) || "/";
  }

  var here = norm(window.location.pathname);

  fetch("/")
    .then(function (r) { if (!r.ok) throw new Error("blog page"); return r.text(); })
    .then(function (text) {
      var doc = new DOMParser().parseFromString(text, "text/html");
      var entries = Array.prototype.slice.call(doc.querySelectorAll("article.entry"));

      var current = -1;
      entries.forEach(function (entry, i) {
        var a = entry.querySelector(".entry-title a");
        if (!a) return;
        var path = new URL(a.getAttribute("href"), window.location.origin).pathname;
        if (norm(path) === here) current = i;
      });

      // not listed on the blog page, or the oldest post: nothing to show
      if (current === -1 || current + 1 >= entries.length) return;

      var next = document.importNode(entries[current + 1], true);

      var image = next.querySelector(".entry-image");
      if (image) image.parentNode.removeChild(image);

      // the section heading is an h2, so the post title becomes an h3
      var heading = next.querySelector(".entry-title");
      if (heading) {
        var h3 = document.createElement("h3");
        h3.className = "entry-title";
        while (heading.firstChild) h3.appendChild(heading.firstChild);
        heading.parentNode.replaceChild(h3, heading);
      }

      body.appendChild(next);
      box.hidden = false;
    })
    .catch(function () { /* leave the section hidden */ });
})();
