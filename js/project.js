/* Project page: renders ?p=<slug> from content.js. */
(function () {
  "use strict";
  var App = window.App, P = window.PROJECTS;
  if (!App || !P) return;
  var doc = document, esc = App.esc;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };

  var slug = new URLSearchParams(location.search).get("p");
  var idx = P.findIndex(function (p) { return p.slug === slug; });
  if (idx < 0) { location.replace("index.html"); return; }
  var p = P[idx], next = P[(idx + 1) % P.length];

  /* ---------- document meta ---------- */
  doc.title = p.title + " | Mahmoud Aloudat";
  App.pageTitle = p.title;
  var setMeta = function (sel, val) { var m = $(sel); if (m) m.setAttribute("content", val); };
  setMeta('meta[name="description"]', p.story[0]);
  setMeta('meta[property="og:title"]', p.title + " | Mahmoud Aloudat");
  setMeta('meta[property="og:image"]', p.hero.src);

  /* ---------- markup ---------- */
  var words = function (t) { return t.split(" ").map(function (w) { return '<span class="mask"><span>' + esc(w) + "</span></span>"; }).join(" "); };
  var isDrawHero = p.hero.type === "drawing";
  var html = "";

  html += '<section class="p-head"><a class="back ulink" href="index.html#work" data-transition>All work</a>' +
    '<h1 class="p-title" aria-label="' + esc(p.title) + '">' + words(p.title) + "</h1>" +
    '<div class="p-sub grid" id="p-sub"><div><h3>Project</h3><p>' + esc(p.kind) + "</p></div><div><h3>Location</h3><p>" + esc(p.place) + "</p></div><div><h3>Discipline</h3><p>" + esc(p.category) + "</p></div></div></section>";

  html += '<figure class="p-hero' + (isDrawHero ? " is-drawing" : "") + '" id="p-hero"><img src="' + esc(p.hero.src) + '" width="' + p.hero.w + '" height="' + p.hero.h + '" alt="' + esc(p.hero.alt || p.title) + '" fetchpriority="high">' +
    (p.hero.caption ? "<figcaption>" + esc(p.hero.caption) + "</figcaption>" : "") + "</figure>";

  html += '<section class="p-over wrap grid" id="overview" aria-label="Overview"><dl class="spec-list">' +
    p.specs.map(function (r) { return '<div class="spec"><dt>' + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") + "</dl>" +
    '<div class="p-story">' + p.story.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") + "</div></section>";

  if (p.facts && p.facts.length) {
    html += '<section class="facts wrap" aria-label="Key figures">' + p.facts.map(function (f) {
      return '<div class="fact"><span class="num" data-n="' + f.n + '"' + (f.dec ? ' data-dec="' + f.dec + '"' : "") + (f.suffix ? ' data-suffix="' + esc(f.suffix) + '"' : "") + (f.group ? ' data-group="1"' : "") + ">" + App.fmt(f.n, f.dec || 0, f.group) + (f.suffix || "") + '</span><span class="lab">' + esc(f.label) + "</span></div>";
    }).join("") + "</section>";
  }

  var g = p.gallery || [];
  if (g.length >= 3) {
    html += '<section class="hs" id="hs" aria-label="Gallery"><div class="hs-head"><span>Gallery</span><span>' + g.length + ' images</span></div><div class="hs-track" id="hs-track">' +
      g.map(function (im) { return '<figure class="hs-item"><img src="' + esc(im.src) + '" width="' + im.w + '" height="' + im.h + '" alt="' + esc(im.alt) + '" decoding="async">' + (im.caption ? "<figcaption>" + esc(im.caption) + "</figcaption>" : "") + "</figure>"; }).join("") +
      '</div><div class="hs-bar"><i></i></div></section>';
  } else if (g.length) {
    html += '<section class="p-sec wrap" aria-label="Gallery"><div class="p-sec-head"><span>Gallery</span><span>' + g.length + (g.length === 1 ? " image" : " images") + "</span></div>" +
      g.map(function (im) { return '<figure class="stack-fig reveal"><img src="' + esc(im.src) + '" width="' + im.w + '" height="' + im.h + '" alt="' + esc(im.alt) + '" loading="lazy">' + (im.caption ? "<figcaption>" + esc(im.caption) + "</figcaption>" : "") + "</figure>"; }).join("") + "</section>";
  }

  var d = p.drawings || [];
  if (d.length) {
    html += '<section class="p-sec wrap" id="drawings" aria-label="Drawings"><div class="p-sec-head"><span>Drawings</span><span>' + d.length + (d.length === 1 ? " sheet" : " sheets") + ', select one to zoom</span></div><div class="d-grid grid">' +
      d.map(function (s, i) {
        var r = s.w / s.h, span = r > 1.45 ? "w12" : r < 0.95 ? "w4" : "w6";
        var meta = (s.sheet ? "<span>Sheet " + esc(s.sheet) + "</span>" : "") + (s.scale ? "<span>Scale " + esc(s.scale) + "</span>" : "");
        return '<figure class="d-card ' + span + '"><button type="button" class="d-btn" data-i="' + i + '" data-cursor="Zoom" aria-label="Open ' + esc(s.title) + ' in the drawing viewer"><div class="d-sheet reveal"><img src="' + esc(s.thumb || s.src) + '" width="' + (s.tw || s.w) + '" height="' + (s.th || s.h) + '" alt="' + esc(s.title) + '" loading="lazy" decoding="async"></div></button>' +
          '<figcaption class="d-cap"><strong>' + esc(s.title) + "</strong>" + (meta ? '<span class="d-meta">' + meta + "</span>" : "") + "</figcaption>" + (s.note ? '<p class="d-note">' + esc(s.note) + "</p>" : "") + "</figure>";
      }).join("") + "</div></section>";
  }

  html += '<section class="next"><small>Next project</small><a href="project.html?p=' + esc(next.slug) + '" data-transition data-cursor="Open"><span class="n-title">' + esc(next.title) + '</span><span class="n-place">' + esc(next.place) + "</span></a></section>";

  $("#main").innerHTML = html;

  /* ---------- drawing viewer ---------- */
  $$(".d-btn").forEach(function (b) { b.addEventListener("click", function () { App.lightbox.open(d, +b.dataset.i, b); }); });

  /* ---------- numbers ---------- */
  $$(".fact .num").forEach(function (n) { App.countUp(n); });

  /* ---------- motion ---------- */
  var hs = $("#hs");
  if (App.reduce && hs) hs.classList.add("flat");

  App.onReady(function () {
    if (App.reduce) return;
    gsap.set(".p-title .mask > span", { yPercent: 118 });
    gsap.set(".back, #p-sub > div", { opacity: 0, y: 14 });
    var hero = $("#p-hero"), heroImg = $("#p-hero img");
    gsap.set(hero, { clipPath: "inset(100% 0% 0% 0%)" });
    gsap.set(heroImg, { scale: 1.2 });

    gsap.timeline()
      .to(".p-title .mask > span", { yPercent: 0, duration: 1.1, stagger: 0.09, ease: "power4.out" }, 0)
      .to(".back, #p-sub > div", { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" }, 0.45)
      .to(hero, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.35, ease: "power3.inOut" }, 0.6)
      .to(heroImg, { scale: 1, duration: 1.9, ease: "power2.out" }, 0.6);

    if (!isDrawHero) {
      gsap.fromTo(heroImg, { yPercent: -4 }, { yPercent: 4, ease: "none", immediateRender: false, scrollTrigger: { trigger: hero, start: "top bottom", end: "bottom top", scrub: true } });
    }

    /* drawings and stacked images are "printed" in once as they arrive */
    $$(".reveal").forEach(function (el) {
      gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1.1, ease: "power3.inOut", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });

    /* gallery: pinned horizontal scroll on large screens */
    if (hs) {
      var track = $("#hs-track"), bar = $(".hs-bar i");
      gsap.matchMedia().add("(min-width: 900px)", function () {
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 40); };
        gsap.to(track, { x: function () { return -dist(); }, ease: "none",
          scrollTrigger: { trigger: hs, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
            onUpdate: function (self) { gsap.set(bar, { scaleX: self.progress }); } } });
      });
    }
    ScrollTrigger.refresh();
  });
})();
