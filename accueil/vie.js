/* Donner vie aux Lanternes de Nour : étoiles, lanternes, lucioles, cascade, parallaxe légère, apparitions douces.
   Tout est facultatif : sans ce fichier la page reste complète. Rien ne tourne si les animations sont réduites. */
(function () {
  'use strict';
  var D = document, H = D.documentElement;
  var reduit = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduit) return;
  var nav = navigator, cx = nav.connection || {};
  var leger = !!(cx.saveData || (nav.deviceMemory && nav.deviceMemory <= 2) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2));
  var finePointeur = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  function graine(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function el(cls, st, parent) { var e = D.createElement('i'); e.className = cls; if (st) e.style.cssText = st; if (parent) parent.appendChild(e); return e; }

  /* ---------- plans de la bannière (pourcentages de l'image) ---------- */
  var ORDI = {
    etoiles: { n: 26, zones: [[36, 76, 2, 54], [27, 40, 0, 26], [4, 34, 0, 9]] },
    lune: [77.8, 12.4, 17],
    lanternes: [[4.6, 67.5, 11], [2.1, 30, 4.5], [64.1, 67, 4.5], [60.5, 73.5, 3.2], [80, 72.5, 3.2], [92.1, 65.6, 5.5], [94.8, 69, 3.5]],
    fenetres: [[84.3, 26, 2.2], [88.5, 31, 2.4], [91, 36, 2.4], [86, 38, 2.2], [94, 33, 2.2], [97, 38, 2.2], [89, 40, 2], [83, 33, 2]],
    chutes: [[73.5, 62, 2.7, 11.5], [82.9, 59.3, 3.9, 14]],
    eau: [63.5, 73.8, 24, 12],
    lucioles: { n: 11, zone: [30, 95, 44, 86] },
    feuilles: { g: [14, 2.2, 36, 9.5], d: [92, 2.4, 22, 9.5] }
  };
  var MOBILE = {
    etoiles: { n: 14, zones: [[6, 94, 1, 30], [38, 72, 30, 46]] },
    lune: [86, 11, 30],
    lanternes: [[7.1, 71.3, 17], [2, 56, 6], [56.3, 64.2, 9], [67.3, 71.3, 7], [94.3, 67.4, 11], [90, 68.5, 6]],
    fenetres: [[79, 51, 3.4], [83, 52, 3.4], [87, 52, 3.4], [91, 51.5, 3.4], [95, 51, 3.4], [76, 55, 3]],
    chutes: [[71, 58.5, 8.4, 8]],
    eau: [70.4, 66.7, 19, 3.6],
    lucioles: { n: 7, zone: [8, 94, 46, 84] },
    feuilles: { g: [20, 4, 46, 14], d: [88, 4, 30, 12] }
  };

  var scene = D.querySelector('.haut-scene'), monde = scene && scene.querySelector('.haut-monde');
  var couche = null, actuel = '';

  function construire() {
    var mobile = window.matchMedia('(max-width: 560px)').matches, cle = mobile ? 'm' : 'd';
    if (cle === actuel || !monde) return; actuel = cle;
    if (couche) couche.remove(); if (monde.querySelectorAll('.feuille').length) Array.prototype.forEach.call(monde.querySelectorAll('.feuille'), function (f) { f.remove(); });
    var P = mobile ? MOBILE : ORDI, rnd = graine(mobile ? 7 : 11);
    couche = el('vie', '', monde);
    var nb = function (n) { return leger ? Math.ceil(n * 0.5) : n; };

    // lune : halo qui respire
    el('lune-halo', 'left:' + P.lune[0] + '%;top:' + P.lune[1] + '%;--s:' + P.lune[2], couche);
    // étoiles scintillantes
    for (var i = 0; i < nb(P.etoiles.n); i++) {
      var z = P.etoiles.zones[Math.floor(rnd() * P.etoiles.zones.length)];
      var t = 2 + rnd() * 2.4;
      el('etoile', 'left:' + (z[0] + rnd() * (z[1] - z[0])).toFixed(2) + '%;top:' + (z[2] + rnd() * (z[3] - z[2])).toFixed(2) + '%;--t:' + t.toFixed(1) + 'px;--d:' + (2.2 + rnd() * 3.6).toFixed(2) + 's;animation-delay:-' + (rnd() * 5).toFixed(2) + 's', couche);
    }
    // lanternes à la lumière vacillante
    P.lanternes.forEach(function (l, k) { el('lueur', 'left:' + l[0] + '%;top:' + l[1] + '%;--s:' + l[2] + ';--d:' + (3.2 + rnd() * 2.6).toFixed(2) + 's;animation-delay:-' + (rnd() * 4).toFixed(2) + 's', couche); });
    // fenêtres du palais qui scintillent
    P.fenetres.forEach(function (f) { el('fenetre', 'left:' + f[0] + '%;top:' + f[1] + '%;--s:' + f[2] + ';--d:' + (1.8 + rnd() * 2.8).toFixed(2) + 's;animation-delay:-' + (rnd() * 3).toFixed(2) + 's', couche); });
    // cascades et eau
    P.chutes.forEach(function (c) { var d = el('cascade', 'left:' + c[0] + '%;top:' + c[1] + '%;width:' + c[2] + '%;height:' + c[3] + '%', couche); el('brume', '', d); });
    if (!leger) el('eau', 'left:' + P.eau[0] + '%;top:' + P.eau[1] + '%;width:' + P.eau[2] + '%;height:' + P.eau[3] + '%', couche);
    // lucioles
    var Z = P.lucioles.zone;
    for (var j = 0; j < nb(P.lucioles.n); j++) {
      el('luciole', 'left:' + (Z[0] + rnd() * (Z[1] - Z[0])).toFixed(2) + '%;top:' + (Z[2] + rnd() * (Z[3] - Z[2])).toFixed(2) + '%;--dx:' + ((rnd() - .5) * (mobile ? 40 : 90)).toFixed(0) + 'px;--dy:' + (-10 - rnd() * (mobile ? 30 : 60)).toFixed(0) + 'px;--v:' + (9 + rnd() * 9).toFixed(1) + 's;--c:' + (2.4 + rnd() * 3).toFixed(1) + 's;animation-delay:-' + (rnd() * 8).toFixed(1) + 's,-' + (rnd() * 4).toFixed(1) + 's', couche);
    }
    // feuillage qui balance (copies de l'image, fondues dans l'original)
    if (!leger) {
      var pic = monde.querySelector('picture');
      [['g', P.feuilles.g], ['d', P.feuilles.d]].forEach(function (a) {
        var f = pic.cloneNode(true); f.className = 'feuille feuille-' + a[0]; f.setAttribute('aria-hidden', 'true');
        var im = f.querySelector('img'); if (im) { im.removeAttribute('fetchpriority'); im.alt = ''; im.className = ''; }
        f.style.setProperty('--cx', a[1][0] + '%'); f.style.setProperty('--cy', a[1][1] + '%'); f.style.setProperty('--rx', a[1][2] + '%'); f.style.setProperty('--ry', a[1][3] + '%');
        monde.insertBefore(f, couche);
      });
    }
  }

  /* ---------- parallaxe légère : souris sur ordinateur, défilement partout ---------- */
  var mx = 0, my = 0, sy = 0, enCours = false, visible = true, logo = null;
  function maj() {
    enCours = false; if (!visible) return;
    var mobile = actuel === 'm';
    monde.style.transform = 'translate3d(' + (-mx * 9).toFixed(1) + 'px,' + (sy * (mobile ? 0.1 : 0.14) - my * 5).toFixed(1) + 'px,0) scale(1.045)';
    if (logo) { logo.style.setProperty('--lx', (mx * 7).toFixed(1) + 'px'); logo.style.setProperty('--ly', (sy * 0.04 + my * 4).toFixed(1) + 'px'); }
  }
  function planifier() { if (!enCours) { enCours = true; requestAnimationFrame(maj); } }
  function parallaxe() {
    logo = scene.querySelector('.marque-entete');
    window.addEventListener('scroll', function () { sy = Math.min(window.scrollY || 0, 700); planifier(); }, { passive: true });
    if (finePointeur) scene.addEventListener('pointermove', function (e) { var r = scene.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5; planifier(); }, { passive: true });
    if (finePointeur) scene.addEventListener('pointerleave', function () { mx = 0; my = 0; planifier(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting; scene.toggleAttribute('data-pause', !visible); if (visible) planifier();
    }, { rootMargin: '80px' }).observe(scene);
  }

  /* ---------- le village : lumières, lucioles (positions recalculées sur l'image réelle) ---------- */
  function village() {
    var zone = D.querySelector('.carte-image'), img = zone && zone.querySelector('img'); if (!img) return;
    var vie = el('carte-vie', '', zone), W = 888, Hh = 664, rnd = graine(5);
    var lum = [[610, 392, 70], [850, 418, 46], [176, 372, 40], [244, 378, 36], [690, 382, 36], [744, 378, 36], [544, 200, 30], [410, 226, 26], [120, 300, 30]];
    var elems = [];
    lum.forEach(function (l) { elems.push([el('lueur-v', '--d:' + (2.6 + rnd() * 2.6).toFixed(2) + 's;animation-delay:-' + (rnd() * 4).toFixed(1) + 's', vie), l[0], l[1], l[2]]); });
    for (var i = 0; i < (leger ? 4 : 8); i++) elems.push([el('luciole', '--dx:' + ((rnd() - .5) * 60).toFixed(0) + 'px;--dy:' + (-10 - rnd() * 40).toFixed(0) + 'px;--v:' + (8 + rnd() * 8).toFixed(1) + 's;--c:' + (2.4 + rnd() * 3).toFixed(1) + 's;animation-delay:-' + (rnd() * 8).toFixed(1) + 's,-' + (rnd() * 4).toFixed(1) + 's', vie), 80 + rnd() * 760, 360 + rnd() * 260, 0]);
    function placer() {
      var bw = zone.clientWidth, bh = zone.clientHeight; if (!bw || !bh) return;
      var s = Math.max(bw / W, bh / Hh), ox = (bw - W * s) * 0.3, oy = (bh - Hh * s) * 0.6;
      elems.forEach(function (a) { var e = a[0]; e.style.left = (a[1] * s + ox).toFixed(1) + 'px'; e.style.top = (a[2] * s + oy).toFixed(1) + 'px'; if (a[3]) { var d = (a[3] * s).toFixed(1) + 'px'; e.style.width = d; e.style.height = d; e.style.marginLeft = e.style.marginTop = (-a[3] * s / 2).toFixed(1) + 'px'; } });
    }
    placer(); if ('ResizeObserver' in window) new ResizeObserver(placer).observe(zone); else window.addEventListener('resize', placer);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { zone.toggleAttribute('data-pause', !en[0].isIntersecting); }, { rootMargin: '60px' }).observe(zone);
  }

  /* ---------- apparitions douces au défilement ---------- */
  function apparitions() {
    if (!('IntersectionObserver' in window)) return;
    var cibles = D.querySelectorAll('.carte-monde-boite, .histoires .titre-section, .episode, .engagements .titre-section, .engagements .point, .bientot, .partage .partage-boite, .partage > *');
    var haut = window.innerHeight, io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('vu'); io.unobserve(x.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    Array.prototype.forEach.call(cibles, function (c, k) {
      if (c.getBoundingClientRect().top < haut * 0.9) return;     // déjà visible : on ne cache rien
      c.classList.add('rev'); c.style.setProperty('--i', k % 3); io.observe(c);
    });
    setTimeout(function () { Array.prototype.forEach.call(D.querySelectorAll('.rev:not(.vu)'), function (c) { if (c.getBoundingClientRect().top < window.innerHeight + 200) c.classList.add('vu'); }); }, 4000);
  }

  /* ---------- relief des cartes et du bouton (souris seulement) ---------- */
  function relief() {
    if (!finePointeur) return;
    D.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.carte, .b3d-or, .carte-monde-boite'); if (!c) return;
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5, k = c.classList.contains('b3d-or') ? 6 : 4;
      c.style.transform = 'perspective(800px) rotateX(' + (-y * k).toFixed(2) + 'deg) rotateY(' + (x * k).toFixed(2) + 'deg) translateY(-3px)';
    }, { passive: true });
    D.addEventListener('pointerout', function (e) { var c = e.target.closest && e.target.closest('.carte, .b3d-or, .carte-monde-boite'); if (c && !c.contains(e.relatedTarget)) c.style.transform = ''; });
  }

  function demarrer() {
    if (scene && monde) { construire(); parallaxe(); window.matchMedia('(max-width: 560px)').addEventListener && window.matchMedia('(max-width: 560px)').addEventListener('change', construire); maj(); }
    apparitions(); relief();   // village() (lueurs et lucioles calées sur l'ancienne image) n'est plus appelé : la capture 3D reste nette
    H.classList.add('vivant');
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
