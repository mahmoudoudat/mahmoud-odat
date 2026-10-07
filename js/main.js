/* Shared behaviour for every page: theme, smooth scroll, cursor, page wipe, progress, drawing viewer. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var App = (window.App = { reduce: reduce, fine: fine, lenis: null, ready: false, _q: [], _leaving: false });

  App.onReady = function (fn) { App.ready ? fn() : App._q.push(fn); };
  App.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); };

  /* If the animation libraries are missing for any reason, show the page instead of leaving it covered. */
  if (!window.gsap || !window.ScrollTrigger) {
    clearTimeout(window.__wipeFallback);
    root.classList.add("force-show");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  var wipe = doc.querySelector(".wipe");
  var wipeText = wipe ? wipe.querySelector("span") : null;
  var nav = doc.getElementById("nav");

  /* ---------------------------------------------------------------- theme */
  var themeBtn = doc.getElementById("theme-btn");
  function paintThemeButton() {
    var dark = root.getAttribute("data-theme") === "dark";
    if (themeBtn) {
      themeBtn.textContent = dark ? "Light" : "Dark";
      themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    }
    var m = doc.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", dark ? "#12161B" : "#F7F6F3");
  }
  paintThemeButton();
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.classList.add("theme-anim");
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    paintThemeButton();
    setTimeout(function () { root.classList.remove("theme-anim"); }, 700);
  });

  /* ---------------------------------------------------------------- smooth scroll */
  if (!reduce && window.Lenis) {
    App.lenis = new Lenis({ duration: 1.1, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    App.lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { App.lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  App.scrollTo = function (target, immediate) {
    if (App.lenis) App.lenis.scrollTo(target, { duration: immediate ? 0 : 1.4, immediate: !!immediate });
    else if (typeof target === "number") window.scrollTo(0, target);
    else target.scrollIntoView({ behavior: reduce || immediate ? "auto" : "smooth" });
  };

  /* ---------------------------------------------------------------- scroll progress + nav behaviour */
  gsap.to(".progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } });
  if (nav) ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: function (self) {
      if (self.direction === 1 && self.scroll() > 260) nav.classList.add("is-hidden");
      else if (self.direction === -1) nav.classList.remove("is-hidden");
    }
  });

  /* ---------------------------------------------------------------- cursor */
  var cur = doc.querySelector(".cursor");
  if (cur && fine && !reduce) {
    var lab = cur.querySelector("span");
    var qx = gsap.quickTo(cur, "x", { duration: 0.35, ease: "power3" });
    var qy = gsap.quickTo(cur, "y", { duration: 0.35, ease: "power3" });
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      cur.classList.add("on"); qx(e.clientX); qy(e.clientY);
    }, { passive: true });
    doc.addEventListener("pointerover", function (e) {
      var t = e.target.closest ? e.target.closest("[data-cursor], a, button, summary") : null;
      var c = t && t.dataset ? t.dataset.cursor : "";
      cur.classList.toggle("hover", !!t);
      cur.classList.toggle("label", !!c);
      lab.textContent = c || "";
    });
    doc.addEventListener("pointerleave", function () { cur.classList.remove("on"); });
  }

  /* ---------------------------------------------------------------- page transitions (wipe) */
  App.titleFor = function (href) {
    try {
      var slug = new URL(href, location.href).searchParams.get("p");
      if (slug && window.PROJECTS) { var f = window.PROJECTS.filter(function (p) { return p.slug === slug; })[0]; if (f) return f.title; }
    } catch (e) {}
    return (window.SITE && window.SITE.name) || "";
  };
  App.go = function (href) {
    if (App._leaving) return;
    if (reduce || !wipe) { location.href = href; return; }
    App._leaving = true;
    if (App.lenis) App.lenis.stop();
    wipeText.textContent = App.titleFor(href);
    gsap.set(wipeText, { opacity: 0, y: 30 });
    gsap.fromTo(wipe, { yPercent: 100 }, { yPercent: 0, duration: 0.8, ease: "power4.inOut" });
    gsap.to(wipeText, { opacity: 1, y: 0, duration: 0.5, delay: 0.45, ease: "power3.out" });
    setTimeout(function () { location.href = href; }, 1050);
  };
  doc.addEventListener("click", function (e) {
    /* in-page anchors */
    var h = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (h && h.getAttribute("href").length > 1) {
      var el = doc.querySelector(h.getAttribute("href"));
      if (el) { e.preventDefault(); App.scrollTo(el); history.replaceState(null, "", h.getAttribute("href")); return; }
    }
    /* internal links that should wipe */
    var a = e.target.closest ? e.target.closest("a[data-transition]") : null;
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank") return;
    var u = new URL(a.href, location.href);
    if (u.pathname === location.pathname && u.search === location.search) {
      e.preventDefault();
      var tgt = u.hash ? doc.querySelector(u.hash) : null;
      App.scrollTo(tgt || 0);
      return;
    }
    e.preventDefault();
    App.go(a.href);
  });
  window.addEventListener("pageshow", function (ev) {
    if (ev.persisted && wipe) { gsap.set(wipe, { yPercent: 100 }); App._leaving = false; if (App.lenis) App.lenis.start(); }
  });

  /* ---------------------------------------------------------------- numbers */
  App.fmt = function (v, dec, group) {
    return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: !!group });
  };
  App.countUp = function (el) {
    var n = parseFloat(el.dataset.n), dec = +el.dataset.dec || 0, suf = el.dataset.suffix || "", grp = el.dataset.group === "1";
    if (reduce) { el.textContent = App.fmt(n, dec, grp) + suf; return; }
    var o = { v: 0 };
    el.textContent = App.fmt(0, dec, grp) + suf;
    gsap.to(o, { v: n, duration: 2.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%", once: true },
      onUpdate: function () { el.textContent = App.fmt(o.v, dec, grp) + suf; } });
  };

  /* ---------------------------------------------------------------- drawing viewer */
  App.lightbox = (function () {
    var el, stage, img, title, sub, items = [], idx = 0, s = 1, x = 0, y = 0, opener = null, built = false;
    var pts = new Map(), startDist = 0, startScale = 1;

    function build() {
      el = doc.createElement("div");
      el.className = "lb"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Drawing viewer");
      el.innerHTML =
        '<div class="lb-top"><div class="lb-title"><strong></strong><span></span></div><div class="lb-tools">' +
        '<button type="button" class="lb-nav" data-a="prev" aria-label="Previous drawing">Previous</button>' +
        '<button type="button" class="lb-nav" data-a="next" aria-label="Next drawing">Next</button>' +
        '<button type="button" data-a="out" aria-label="Zoom out">&minus;</button>' +
        '<button type="button" data-a="in" aria-label="Zoom in">+</button>' +
        '<button type="button" data-a="reset" aria-label="Fit to screen">Fit</button>' +
        '<button type="button" data-a="close" aria-label="Close viewer">Close</button></div></div>' +
        '<div class="lb-stage"><img alt="" draggable="false"></div>' +
        '<div class="lb-hint"><span>Scroll or pinch to zoom, drag to pan, double-click to zoom in</span><span>Arrow keys for previous and next, Esc to close</span></div>';
      doc.body.appendChild(el);
      stage = el.querySelector(".lb-stage"); img = stage.querySelector("img");
      title = el.querySelector(".lb-title strong"); sub = el.querySelector(".lb-title span");

      el.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-a]"); if (!b) return;
        var a = b.dataset.a;
        if (a === "close") close(); else if (a === "prev") show(idx - 1); else if (a === "next") show(idx + 1);
        else if (a === "in") zoomAt(1.5, cx(), cy()); else if (a === "out") zoomAt(1 / 1.5, cx(), cy()); else if (a === "reset") reset();
      });
      stage.addEventListener("wheel", function (e) { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)), e.clientX, e.clientY); }, { passive: false });
      stage.addEventListener("dblclick", function (e) { if (s > 1.05) reset(); else zoomAt(2.6, e.clientX, e.clientY); });
      stage.addEventListener("pointerdown", function (e) {
        stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); stage.classList.add("drag");
        if (pts.size === 2) { var a = Array.from(pts.values()); startDist = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1; startScale = s; }
      });
      stage.addEventListener("pointermove", function (e) {
        var p = pts.get(e.pointerId); if (!p) return;
        if (pts.size === 1) { x += e.clientX - p.x; y += e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; apply(); }
        else if (pts.size === 2) {
          p.x = e.clientX; p.y = e.clientY;
          var a = Array.from(pts.values()), d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
          zoomTo(startScale * d / startDist, (a[0].x + a[1].x) / 2, (a[0].y + a[1].y) / 2);
        }
      });
      function up(e) { pts.delete(e.pointerId); if (!pts.size) stage.classList.remove("drag"); }
      stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
      doc.addEventListener("keydown", function (e) {
        if (!el.classList.contains("open")) return;
        if (e.key === "Escape") close();
        else if (e.key === "ArrowLeft") show(idx - 1);
        else if (e.key === "ArrowRight") show(idx + 1);
        else if (e.key === "+" || e.key === "=") zoomAt(1.4, cx(), cy());
        else if (e.key === "-") zoomAt(1 / 1.4, cx(), cy());
        else if (e.key === "0") reset();
        else if (e.key === "Tab") {
          var f = Array.from(el.querySelectorAll("button")).filter(function (b) { return b.offsetParent !== null; });
          if (!f.length) return;
          if (e.shiftKey && doc.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
          else if (!e.shiftKey && doc.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        }
      });
      built = true;
    }
    function rect() { return stage.getBoundingClientRect(); }
    function cx() { var r = rect(); return r.left + r.width / 2; }
    function cy() { var r = rect(); return r.top + r.height / 2; }
    function apply() { img.style.transform = "translate3d(" + x + "px," + y + "px,0) scale(" + s + ")"; }
    function reset() { s = 1; x = 0; y = 0; apply(); }
    function zoomTo(ns, px, py) {
      ns = Math.max(1, Math.min(10, ns));
      var r = rect(), ox = px - (r.left + r.width / 2), oy = py - (r.top + r.height / 2), k = ns / s;
      x = ox - (ox - x) * k; y = oy - (oy - y) * k; s = ns;
      if (s <= 1.001) { s = 1; x = 0; y = 0; }
      apply();
    }
    function zoomAt(f, px, py) { zoomTo(s * f, px, py); }
    function show(i) {
      idx = (i + items.length) % items.length;
      var it = items[idx];
      img.src = it.src; img.alt = it.title;
      title.textContent = it.title;
      var bits = [];
      if (it.sheet) bits.push("Sheet " + it.sheet);
      if (it.scale) bits.push("Scale " + it.scale);
      if (it.note) bits.push(it.note);
      sub.textContent = bits.join("   |   ");
      reset();
      var n = items[(idx + 1) % items.length]; if (n) { var pre = new Image(); pre.src = n.src; }
    }
    function open(list, i, from) {
      if (!built) build();
      items = list; opener = from || null;
      el.classList.add("open");
      if (App.lenis) App.lenis.stop(); else doc.body.style.overflow = "hidden";
      el.querySelectorAll(".lb-nav").forEach(function (b) { b.style.display = items.length > 1 ? "" : "none"; });
      show(i || 0);
      el.querySelector('[data-a="close"]').focus();
    }
    function close() {
      el.classList.remove("open");
      if (App.lenis) App.lenis.start(); else doc.body.style.overflow = "";
      if (opener) opener.focus({ preventScroll: true });
    }
    return { open: open, close: close };
  })();

  /* ---------------------------------------------------------------- start: wipe away, then run page animations */
  function finish() {
    if (App.ready) return;
    App.ready = true;
    App._q.forEach(function (f) { try { f(); } catch (err) { console.error(err); } });
    if (location.hash && location.hash.length > 1) {
      var t = doc.querySelector(location.hash);
      if (t) setTimeout(function () { App.scrollTo(t, true); ScrollTrigger.refresh(); }, 60);
    }
  }
  /* Splash: a building is drawn level by level (the levels are from the villa drawings) while the name rises. */
  function runIntro() {
    var el = doc.getElementById("intro");
    if (wipe) gsap.set(wipe, { yPercent: 100 });
    if (!el) { root.classList.remove("intro-on"); finish(); return; }
    try { sessionStorage.setItem("introSeen", "1"); } catch (e) {}
    var q = function (sel) { return el.querySelectorAll(sel); };
    var strokes = q(".intro-bldg .ln"), lbls = q(".intro-bldg .lbl"), names = q(".intro-name .mask > span");
    var top = q(".intro-top")[0], role = q(".intro-role")[0], rule = q(".intro-rule")[0], lv = doc.getElementById("intro-lv");
    var ui = q(".intro-ui")[0], hTop = q(".intro-half.top")[0], hBot = q(".intro-half.bot")[0];
    gsap.set(strokes, { strokeDashoffset: 1 }); gsap.set(lbls, { opacity: 0 }); gsap.set(names, { yPercent: 118 });
    gsap.set([top, role], { opacity: 0 }); gsap.set(rule, { scaleX: 0 });
    var o = { v: 0 };
    var tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    tl.to(top, { opacity: 1, duration: 0.6 }, 0)
      .to(rule, { scaleX: 1, duration: 1.2, ease: "power3.inOut" }, 0)
      .to(names, { yPercent: 0, duration: 1.1, stagger: 0.12, ease: "power4.out" }, 0.15)
      .to(role, { opacity: 1, duration: 0.6 }, 0.8)
      .to(o, { v: 11.55, duration: 1.95, ease: "none", onUpdate: function () { lv.textContent = "+" + o.v.toFixed(2); } }, 0.35)
      .to(q(".b-plinth"), { strokeDashoffset: 0, duration: 0.35 }, 0.35)
      .to(q(".b-gf"), { strokeDashoffset: 0, duration: 0.5 }, 0.6)
      .to(q(".b-gfw"), { strokeDashoffset: 0, duration: 0.35, stagger: 0.08 }, 0.95)
      .to(q(".l1"), { opacity: 1, duration: 0.3 }, 0.85)
      .to(q(".b-ff"), { strokeDashoffset: 0, duration: 0.5 }, 1.1)
      .to(q(".b-ffw"), { strokeDashoffset: 0, duration: 0.35, stagger: 0.08 }, 1.45)
      .to(q(".l2"), { opacity: 1, duration: 0.3 }, 1.3)
      .to(q(".b-rf"), { strokeDashoffset: 0, duration: 0.5 }, 1.6)
      .to(q(".b-rfw"), { strokeDashoffset: 0, duration: 0.35 }, 1.95)
      .to(q(".b-par"), { strokeDashoffset: 0, duration: 0.3 }, 2.0)
      .to(q(".l3"), { opacity: 1, duration: 0.3 }, 1.75)
      .to(q(".l4"), { opacity: 1, duration: 0.3 }, 2.1)
      .to(ui, { opacity: 0, duration: 0.4, ease: "power2.in" }, 2.85)
      .to(hTop, { yPercent: -100, duration: 1, ease: "power4.inOut" }, 3.0)
      .to(hBot, { yPercent: 100, duration: 1, ease: "power4.inOut" }, 3.0)
      .add(finish, 3.45)
      .add(function () { el.style.display = "none"; root.classList.remove("intro-on"); ScrollTrigger.refresh(); }, 4.05);
    tl.timeScale(1.1);
    var skip = function () { tl.timeScale(5); };
    el.addEventListener("click", skip);
    doc.addEventListener("keydown", skip, { once: true });
  }

  function begin() {
    clearTimeout(window.__wipeFallback);
    if (root.classList.contains("intro-on")) { runIntro(); return; }
    if (!wipe || reduce) { if (wipe) gsap.set(wipe, { yPercent: 100 }); finish(); return; }
    wipeText.textContent = App.pageTitle || (window.SITE && window.SITE.name) || "";
    gsap.set(wipe, { yPercent: 0 });
    gsap.set(wipeText, { opacity: 0, y: 30 });
    var tl = gsap.timeline();
    tl.to(wipeText, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" })
      .to(wipeText, { opacity: 0, duration: 0.25, ease: "power2.in" }, "+=0.15")
      .to(wipe, { yPercent: -100, duration: 0.95, ease: "power4.inOut" }, "-=0.1")
      .add(finish, "-=0.55")
      .add(function () { gsap.set(wipe, { yPercent: 100 }); });
  }
  function waitFonts() {
    var f = doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve();
    Promise.race([f, new Promise(function (r) { setTimeout(r, 1800); })]).then(begin);
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", waitFonts); else waitFonts();
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
