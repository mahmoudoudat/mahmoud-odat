/* Home page: renders content from content.js and runs the hero sequence. */
(function () {
  "use strict";
  var App = window.App, S = window.SITE, P = window.PROJECTS;
  if (!S || !P) return;
  var doc = document, esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); };
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };

  /* ---------- fill content ---------- */
  $("#hero-lead").textContent = S.lead;
  $("#bio1").textContent = S.about.bio[0];
  $("#bio2").textContent = S.about.bio[1];
  $("#soft").innerHTML = S.about.software.map(function (g) {
    return "<div><h3>" + esc(g.group) + "</h3><ul>" + g.items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul></div>";
  }).join("");
  $("#timeline").insertAdjacentHTML("beforeend", S.about.timeline.map(function (t) {
    return '<div class="tl-item"><div class="tl-when">' + esc(t.when) + '</div><div class="tl-title">' + esc(t.title) + '</div><div class="tl-place">' + esc(t.place) + "</div>" +
      (t.note ? '<p class="tl-note">' + esc(t.note) + "</p>" : "") + "</div>";
  }).join(""));
  $("#year-line").textContent = S.name + ". " + S.tagline.replace(/\u2022/g, "|") + ". " + new Date().getFullYear();

  /* ---------- work index ---------- */
  var list = $("#work-list");
  list.innerHTML = P.map(function (p) {
    var isDraw = p.hero && p.hero.type === "drawing";
    return '<a class="work-row" href="#work-' + esc(p.slug) + '" data-cursor="Read" aria-label="' + esc(p.title + ", " + p.place + ", read the summary") + '">' +
      '<span class="w-title">' + esc(p.title) + '</span><span class="w-place">' + esc(p.place) + '</span><span class="w-cat">' + esc(p.category) + "</span>" +
      '<img class="w-thumb' + (isDraw ? " is-drawing" : "") + '" src="' + esc(p.preview) + '" alt="" loading="lazy"></a>';
  }).join("");

  var pv = $("#work-preview"), rows = $$(".work-row", list), imgs = [];
  if (App.fine && !App.reduce) {
    imgs = P.map(function (p) {
      var im = new Image(); im.src = p.preview; im.alt = ""; if (p.hero && p.hero.type === "drawing") im.className = "is-drawing";
      im.style.opacity = 0; pv.appendChild(im); return im;
    });
    var qx = gsap.quickTo(pv, "x", { duration: 0.55, ease: "power3" }), qy = gsap.quickTo(pv, "y", { duration: 0.55, ease: "power3" });
    var seeded = false, shown = false;
    var place = function (e) { return { x: e.clientX + 32, y: e.clientY - pv.offsetHeight / 2 }; };
    list.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var t = place(e);
      if (!seeded) { gsap.set(pv, { x: t.x, y: t.y }); seeded = true; } else { qx(t.x); qy(t.y); }
    });
    rows.forEach(function (row, i) {
      row.addEventListener("pointerenter", function (e) {
        if (e.pointerType !== "mouse") return;
        imgs.forEach(function (im, k) { im.style.opacity = k === i ? 1 : 0; });
        var t = place(e); if (!seeded) { gsap.set(pv, { x: t.x, y: t.y }); seeded = true; }
        if (!shown) { shown = true; gsap.fromTo(pv, { opacity: 1, clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.55, ease: "power3.out", overwrite: "auto" }); }
      });
    });
    list.addEventListener("pointerleave", function () {
      shown = false; gsap.to(pv, { clipPath: "inset(100% 0 0 0)", duration: 0.4, ease: "power3.in", overwrite: "auto" });
    });
  }


  /* ---------- project chapters ---------- */
  function chapter(p, pi) {
    var slug = esc(p.slug), link = "project.html?p=" + slug;
    var glance = p.glance.map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("");
    var scope = p.scope.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    var media = p.home.map(function (h) {
      var cls = h.span === 12 ? "hc" : "hc s" + h.span;
      var cap = "<figcaption>" + esc(h.caption) + "</figcaption>";
      var img = '<img src="' + esc(h.thumb || h.src) + '" width="' + (h.tw || h.w) + '" height="' + (h.th || h.h) + '" alt="' + esc(h.alt) + '" loading="lazy" decoding="async">';
      if (h.kind === "drawing") {
        var di = p.drawings.map(function (d) { return d.src; }).indexOf(h.src);
        return '<figure class="' + cls + '"><button type="button" class="hc-draw" data-p="' + pi + '" data-i="' + di + '" data-cursor="Zoom" aria-label="Open ' + esc(h.caption) + ' in the drawing viewer"><div class="d-sheet reveal">' + img + "</div></button>" + cap + "</figure>";
      }
      return '<figure class="' + cls + '"><a href="' + link + '" data-transition data-cursor="Open"><div class="reveal">' + img + "</div></a>" + cap + "</figure>";
    }).join("");
    return '<article class="chap" id="work-' + slug + '" aria-labelledby="ct-' + slug + '">' +
      '<div class="chap-head"><span>' + esc(p.category) + "</span><span>" + esc(p.place) + "</span></div>" +
      '<h3 class="chap-title" id="ct-' + slug + '"><a href="' + link + '" data-transition data-cursor="Open">' + esc(p.title) + "</a></h3>" +
      '<div class="chap-body grid"><div class="chap-info"><p class="chap-sum">' + esc(p.story[0]) + "</p>" +
      '<dl class="glance">' + glance + '</dl><h4 class="scope-h">What it covers</h4><ul class="scope">' + scope + "</ul>" +
      '<a class="btn" href="' + link + '" data-transition>Open the full project</a></div>' +
      '<div class="chap-media">' + media + "</div></div></article>";
  }
  $("#chaps").innerHTML = P.map(chapter).join("");
  $$(".hc-draw").forEach(function (b) {
    b.addEventListener("click", function () { App.lightbox.open(P[+b.dataset.p].drawings, +b.dataset.i, b); });
  });

  /* ---------- contact ---------- */
  $("#mail").textContent = S.email; $("#mail").href = "mailto:" + S.email;
  $("#tel").textContent = S.phone; $("#tel").href = "tel:" + S.phoneTel;
  $("#li").href = S.linkedin;
  var note = $("#copy-note");
  $("#copy-mail").addEventListener("click", function () {
    var done = function (ok) { note.textContent = ok ? "Email copied" : "Copy failed, select the address above"; note.classList.add("show"); setTimeout(function () { note.classList.remove("show"); }, 2200); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(S.email).then(function () { done(true); }, function () { done(false); });
    else { try { var ta = doc.createElement("textarea"); ta.value = S.email; doc.body.appendChild(ta); ta.select(); var ok = doc.execCommand("copy"); doc.body.removeChild(ta); done(ok); } catch (e) { done(false); } }
  });

  /* ---------- hero: the one orchestrated moment ---------- */
  App.onReady(function () {
    var lines = $$("#sheet .ln"), bubs = $$("#sheet .bub"), texts = $$("#sheet .lt");
    if (App.reduce) { return; }
    gsap.set(lines, { strokeDashoffset: 1 });
    gsap.set(bubs, { opacity: 0 });
    gsap.set(texts, { opacity: 0 });
    gsap.set("#sheet-img", { clipPath: "inset(100% 0% 0% 0%)" });
    gsap.set("#sheet-img img", { scale: 1.25 });
    gsap.set(".hero-name .mask > span", { yPercent: 118 });
    gsap.set("#hero-lead, #hero-meta", { opacity: 0, y: 18 });

    var tl = gsap.timeline();
    tl.to(lines, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut", stagger: 0.07 }, 0)
      .to(bubs, { opacity: 1, duration: 0.5, stagger: 0.08 }, 0.5)
      .to(texts, { opacity: 1, duration: 0.6, stagger: 0.05 }, 0.7)
      .to(".hero-name .mask > span", { yPercent: 0, duration: 1.15, stagger: 0.12, ease: "power4.out" }, 0.15)
      .to("#hero-lead, #hero-meta", { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: "power3.out" }, 0.85)
      .to("#sheet-img", { clipPath: "inset(0% 0% 0% 0%)", duration: 1.35, ease: "power3.inOut" }, 1.0)
      .to("#sheet-img img", { scale: 1, duration: 1.9, ease: "power2.out" }, 1.0)
      .to("#sheet .ln.lv", { opacity: 0.38, duration: 1.1 }, 1.9);

    /* the render drifts slightly as you scroll away from the hero */
    gsap.to("#sheet-img img", { yPercent: 7, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to("#sheet", { yPercent: -5, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    /* project images are "printed" in once as they arrive */
    $$("#chaps .reveal").forEach(function (el) {
      gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1.15, ease: "power3.inOut", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });

    /* about: the portrait develops once, the timeline rail fills with scroll */
    gsap.fromTo("#about-frame", { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1.2, ease: "power3.inOut", scrollTrigger: { trigger: "#about-frame", start: "top 85%", once: true } });
    gsap.fromTo("#about-img", { scale: 1.2 }, { scale: 1, duration: 1.6, ease: "power2.out", scrollTrigger: { trigger: "#about-frame", start: "top 85%", once: true } });
    gsap.to(".timeline .rail i", { scaleY: 1, ease: "none", scrollTrigger: { trigger: "#timeline", start: "top 70%", end: "bottom 65%", scrub: true } });
  });
})();
