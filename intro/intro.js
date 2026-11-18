/* Les Lanternes de Nour — introduction d'accueil.
   « Une lumière s'allume, une découverte commence. »
   Chargé en différé par la page d'accueil. Si quoi que ce soit échoue, l'introduction se ferme et le site reste utilisable. */
(function () {
  'use strict';
  var H = document.documentElement;
  var CLE = 'lanternes_intro', CLE_SON = 'lanternes_intro_son', CLE_SESSION = 'lanternes_intro_session';
  var PAROLE = 'Assalâmou alaykoum… Bienvenue dans Les Lanternes de Nour. Ici, chaque lumière ouvre une nouvelle découverte.';
  var VOIX = 'intro/bienvenue.mp3';

  /* ---------- mémoire du choix du visiteur (jamais bloquant) ---------- */
  function lire() { try { return JSON.parse(localStorage.getItem(CLE) || '{}') || {}; } catch (e) { return {}; } }
  function ecrire(o) { try { localStorage.setItem(CLE, JSON.stringify(o)); } catch (e) {} }
  function sonActif() { try { return localStorage.getItem(CLE_SON) !== 'non'; } catch (e) { return true; } }
  function memoSon(on) { try { localStorage.setItem(CLE_SON, on ? 'oui' : 'non'); } catch (e) {} }

  var calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cn = navigator.connection || {};
  var leger = calme || cn.saveData === true ||
    (navigator.deviceMemory && navigator.deviceMemory <= 3) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4 && matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 520);

  var racine = document.getElementById('intro');
  var $ = function (id) { return document.getElementById(id); };
  var etat = { mode: 'complete', voix: null, voixFinie: false, ouvert: false, minuteurs: [], ferme: false };

  /* ---------- décision d'afficher ou non (aussi utilisée par le <head> pour éviter tout flash) ---------- */
  function decider(force) {
    var m = lire(), maintenant = Date.now();
    if (force) return 'complete';
    if (m.off) return null;
    try { if (sessionStorage.getItem(CLE_SESSION)) return null; } catch (e) {}
    if (!m.vu) return 'complete';
    if (maintenant - m.vu > 14 * 864e5) return 'courte';   // un visiteur qui revient après deux semaines : version courte
    return null;                                            // sinon, on ne lui impose rien
  }
  window.lanternesIntroDecision = decider;

  function plus(fn, ms) { var t = setTimeout(fn, ms); etat.minuteurs.push(t); return t; }
  function viderMinuteurs() { etat.minuteurs.forEach(clearTimeout); etat.minuteurs = []; }

  /* ---------- particules dorées ---------- */
  function semer() {
    var cible = racine.querySelector('.intro-particules'); if (!cible || calme) return;
    var n = leger ? 0 : (innerWidth < 600 ? 14 : 26);
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span'), t = 2 + Math.random() * 3.6;
      s.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;width:' + t.toFixed(1) + 'px;height:' + t.toFixed(1) + 'px;' +
        'animation-duration:' + (11 + Math.random() * 12).toFixed(1) + 's;animation-delay:-' + (Math.random() * 20).toFixed(1) + 's;' +
        '--dx:' + ((Math.random() - .5) * 90).toFixed(0) + 'px';
      cible.appendChild(s);
    }
  }
  function gerbe() {   // quelques particules qui jaillissent de la lanterne
    if (calme) return;
    var lueur = racine.querySelector('.intro-lueur'), r = lueur.getBoundingClientRect(), n = leger ? 9 : 22;
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('span'), t = 3 + Math.random() * 5, a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 150;
      p.style.cssText = 'position:fixed;z-index:10001;pointer-events:none;border-radius:50%;left:' + (cx - t / 2) + 'px;top:' + (cy - t / 2) + 'px;width:' + t + 'px;height:' + t + 'px;' +
        'background:radial-gradient(circle,#fff6d0,#f5b942 60%,rgba(245,185,66,0) 72%)';
      document.body.appendChild(p);
      if (p.animate) {
        var an = p.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: 'translate(' + (Math.cos(a) * d).toFixed(0) + 'px,' + (Math.sin(a) * d - 40).toFixed(0) + 'px) scale(.2)', opacity: 0 }],
          { duration: 1000 + Math.random() * 900, easing: 'cubic-bezier(.12,.7,.3,1)', fill: 'forwards' });
        an.onfinish = (function (el) { return function () { el.remove(); }; })(p);
      } else p.remove();
    }
  }

  /* ---------- affichage des éléments du bas (indice, parole, bouton) sans décalage de la page ---------- */
  function montrer(id) {
    ['intro-indice', 'intro-parole', 'intro-entrer'].forEach(function (k) {
      var e = $(k); if (!e) return;
      if (k === id) { e.classList.add('visible'); e.removeAttribute('aria-hidden'); if (k === 'intro-entrer') e.disabled = false; }
      else { e.classList.remove('visible'); e.setAttribute('aria-hidden', 'true'); if (k === 'intro-entrer') e.disabled = true; }
    });
  }
  function proposerEntree() {
    if (etat.ferme || etat.ouvert) return;
    montrer('intro-entrer');
    try { $('intro-entrer').focus({ preventScroll: true }); } catch (e) {}
  }

  /* ---------- la voix de bienvenue : seulement après un clic, jamais automatiquement ---------- */
  function jouerVoix() {
    etat.voixFinie = false;
    var parole = $('intro-parole'); parole.textContent = '« ' + PAROLE + ' »'; montrer('intro-parole');
    var fin = function () { etat.voixFinie = true; plus(proposerEntree, 500); };
    if (!sonActif()) { plus(proposerEntree, 4200); return; }
    try {
      if (!etat.voix) {
        etat.voix = new Audio(VOIX); etat.voix.preload = 'auto'; etat.voix.volume = 0.8;
        etat.voix.addEventListener('ended', fin);
        etat.voix.addEventListener('error', function () { plus(proposerEntree, 3800); });
      }
      etat.voix.currentTime = 0;
      var p = etat.voix.play();
      if (p && p.catch) p.catch(function () { plus(proposerEntree, 3800); });
    } catch (e) { plus(proposerEntree, 3800); }
  }

  function toucherLogo() {
    if (etat.ouvert || etat.ferme) return;
    viderMinuteurs();
    racine.classList.remove('allume'); void racine.offsetWidth; racine.classList.add('allume');
    gerbe();
    jouerVoix();
  }

  /* ---------- la porte du monde de Nour ---------- */
  function entrer() {
    if (etat.ouvert || etat.ferme) return;
    etat.ouvert = true; viderMinuteurs();
    if (etat.voix) { try { etat.voix.pause(); } catch (e) {} }
    var img = racine.querySelector('.intro-paysage img');
    var ouvrir = function () {
      racine.classList.add('allume', 'ouvre');
      var duree = calme ? 700 : leger ? 2500 : 3100;
      plus(function () { fermer('entree'); }, duree);
    };
    if (img && !img.complete) { var go = function () { img.removeEventListener('load', go); img.removeEventListener('error', go); ouvrir(); }; img.addEventListener('load', go); img.addEventListener('error', go); plus(go, 1500); }
    else ouvrir();
  }

  /* ---------- fermeture : toujours propre, quel que soit le chemin ---------- */
  function fermer(raison) {
    if (etat.ferme) return; etat.ferme = true; viderMinuteurs();
    if (etat.voix) { try { etat.voix.pause(); } catch (e) {} }
    var m = lire(); m.vu = Date.now();
    if ($('intro-off') && $('intro-off').checked) m.off = true;
    ecrire(m);
    try { sessionStorage.setItem(CLE_SESSION, '1'); } catch (e) {}
    racine.classList.add('sortie'); if (raison === 'passer') racine.classList.add('sortie-vite');
    var fini = function () {
      H.classList.remove('intro-on');
      Array.prototype.forEach.call(document.body.children, function (e) { if (e !== racine) e.removeAttribute('inert'); });
      racine.style.display = 'none';
      majReglage();
    };
    plus(fini, calme ? 50 : raison === 'passer' ? 320 : 650);
    window.removeEventListener('keydown', clavier, true);
  }

  function clavier(e) {
    if (etat.ferme) return;
    if (e.key === 'Escape') { e.preventDefault(); fermer('passer'); return; }
    if (e.key === 'Tab') {   // le focus reste dans l'introduction
      var f = Array.prototype.filter.call(racine.querySelectorAll('button, input'), function (x) { return !x.disabled && x.offsetParent !== null && x.getAttribute('aria-hidden') !== 'true'; });
      if (!f.length) return;
      var a = f.indexOf(document.activeElement);
      if (e.shiftKey && a <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && a === f.length - 1) { e.preventDefault(); f[0].focus(); }
      else if (a === -1) { e.preventDefault(); f[0].focus(); }
    }
  }

  /* ---------- démarrage ---------- */
  function demarrer(mode) {
    etat.mode = mode; etat.ferme = false; etat.ouvert = false; etat.voixFinie = false;
    racine.className = 'intro attend' + (leger ? ' leger' : '') + (calme ? ' calme' : '');
    racine.style.display = '';
    H.classList.add('intro-on');
    Array.prototype.forEach.call(document.body.children, function (e) { if (e !== racine) e.setAttribute('inert', ''); });
    semer();
    $('intro-son').setAttribute('aria-pressed', sonActif() ? 'true' : 'false');
    $('intro-son').textContent = sonActif() ? '🔊' : '🔇';
    $('intro-son').setAttribute('aria-label', sonActif() ? 'Couper le son' : 'Réactiver le son');
    montrer(mode === 'courte' ? 'intro-entrer' : null);
    if (mode === 'complete') plus(function () { montrer('intro-indice'); }, calme ? 300 : 2600);
    // sécurité : même sans clic, on propose d'entrer
    plus(function () { if (!etat.ouvert && !$('intro-entrer').classList.contains('visible')) proposerEntree(); }, 11000);
    // visiteur de retour : la porte s'ouvre toute seule après un instant, s'il ne touche à rien
    if (mode === 'courte') plus(function () { entrer(); }, 3400);
    window.addEventListener('keydown', clavier, true);
    try { racine.focus({ preventScroll: true }); } catch (e) {}
    // préchargement discret de la voix, sans la jouer
    plus(function () { try { fetch(VOIX, { method: 'GET', cache: 'force-cache' }).catch(function () {}); } catch (e) {} }, 1200);
    window.__introPret = true;
  }

  function brancher() {
    $('intro-logo').addEventListener('click', function () { if (etat.mode === 'courte') viderMinuteurs(); toucherLogo(); });
    $('intro-entrer').addEventListener('click', entrer);
    $('intro-passer').addEventListener('click', function () { fermer('passer'); });
    $('intro-son').addEventListener('click', function () {
      var on = !sonActif(); memoSon(on);
      this.setAttribute('aria-pressed', on ? 'true' : 'false'); this.textContent = on ? '🔊' : '🔇';
      this.setAttribute('aria-label', on ? 'Couper le son' : 'Réactiver le son');
      if (etat.voix) { try { if (on) { if (!etat.voixFinie && etat.voix.currentTime > 0) etat.voix.play().catch(function () {}); } else etat.voix.pause(); } catch (e) {} }
    });
  }

  /* ---------- réglage dans le pied de page : désactiver, réactiver, revoir ---------- */
  function majReglage() {
    var b = $('intro-reglage'); if (!b) return;
    var off = !!lire().off;
    b.textContent = off ? 'Réactiver l’introduction d’accueil' : 'Désactiver l’introduction d’accueil';
    b.setAttribute('aria-pressed', off ? 'true' : 'false');
    var s = $('intro-reglage-etat'); if (s) s.textContent = off ? 'L’introduction est désactivée.' : 'L’introduction est activée.';
  }
  function brancherReglage() {
    var b = $('intro-reglage'), v = $('intro-revoir'); if (!b) return;
    b.addEventListener('click', function () { var m = lire(); m.off = !m.off; ecrire(m); majReglage(); });
    if (v && racine) v.addEventListener('click', function () { var check = $('intro-off'); if (check) check.checked = false; viderMinuteurs(); demarrer('complete'); });
    majReglage();
  }

  /* ---------- petite lanterne qui s'allume pendant les changements de page (ne retarde jamais la navigation) ---------- */
  function lanterneDeChargement() {
    var l = document.createElement('img'); l.className = 'charge-lanterne'; l.alt = ''; l.src = 'intro/lanterne-120.webp'; l.setAttribute('aria-hidden', 'true');
    document.body.appendChild(l); var t;
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      if (a.target && a.target !== '_self') return;
      var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.hash)) return;
      clearTimeout(t); t = setTimeout(function () { l.classList.add('visible'); }, 220);
    });
    addEventListener('pageshow', function () { clearTimeout(t); l.classList.remove('visible'); });
  }

  /* ---------- lancement ---------- */
  try { lanterneDeChargement(); } catch (e) {}
  try { brancherReglage(); } catch (e) {}
  if (!racine) return;
  try {
    brancher();
    var logo = racine.querySelector('.intro-logo img');
    var force = /[?&]intro=1\b/.test(location.search);
    var mode = H.classList.contains('intro-on') ? (window.__introMode || decider(force)) : null;
    if (mode) {
      var lancer = function () { try { demarrer(mode); } catch (e) { fermer('erreur'); H.classList.remove('intro-on'); } };
      if (logo && !logo.complete) { logo.addEventListener('load', lancer, { once: true }); logo.addEventListener('error', function () { fermer('erreur'); }, { once: true }); }
      else lancer();
    } else { H.classList.remove('intro-on'); racine.style.display = 'none'; }
  } catch (e) { H.classList.remove('intro-on'); if (racine) racine.style.display = 'none'; }
})();
