/* Les Lanternes de Nour — introduction d'accueil.
   « Une lumière s'allume, une découverte commence. »
   Tout démarre seul à l'ouverture du site (le visuel), la voix se lance dès que le navigateur l'autorise ou via « Activer le son ».
   Chargé en différé par la page d'accueil. Si quoi que ce soit échoue, l'introduction se ferme et le site reste utilisable. */
(function () {
  'use strict';
  var H = document.documentElement;
  var CLE = 'lanternes_intro', CLE_SON = 'lanternes_intro_son', CLE_SESSION = 'lanternes_intro_session';
  var VOIX_AR = 'intro/bienvenue-ar.mp3', VOIX_FR = 'intro/bienvenue-fr.mp3';

  function lire() { try { return JSON.parse(localStorage.getItem(CLE) || '{}') || {}; } catch (e) { return {}; } }
  function ecrire(o) { try { localStorage.setItem(CLE, JSON.stringify(o)); } catch (e) {} }
  function prefSon() { try { return localStorage.getItem(CLE_SON) !== 'non'; } catch (e) { return true; } }
  function memoSon(on) { try { localStorage.setItem(CLE_SON, on ? 'oui' : 'non'); } catch (e) {} }

  var calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cn = navigator.connection || {};
  var leger = calme || cn.saveData === true ||
    (navigator.deviceMemory && navigator.deviceMemory <= 3) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4 && matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 520);

  var racine = document.getElementById('intro');
  var $ = function (id) { return document.getElementById(id); };
  // son : 'invite' (pas encore lancé), 'joue', 'fini', 'coupe'
  var etat = { mode: 'complete', ar: null, fr: null, son: 'invite', ouvert: false, ferme: false, minuteurs: [] };

  function plus(fn, ms) { var t = setTimeout(fn, ms); etat.minuteurs.push(t); return t; }
  function viderMinuteurs() { etat.minuteurs.forEach(clearTimeout); etat.minuteurs = []; }

  /* ---------- particules dorées : légères, discrètes ---------- */
  function semer() {
    var cible = racine.querySelector('.intro-particules'); if (!cible || calme) return;
    cible.textContent = '';
    var n = leger ? 0 : (innerWidth < 600 ? 14 : 28);
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span'), t = 2 + Math.random() * 3.6;
      s.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;width:' + t.toFixed(1) + 'px;height:' + t.toFixed(1) + 'px;' +
        'animation-duration:' + (10 + Math.random() * 11).toFixed(1) + 's;animation-delay:-' + (Math.random() * 14).toFixed(1) + 's;' +
        '--dx:' + ((Math.random() - .5) * 90).toFixed(0) + 'px';
      cible.appendChild(s);
    }
  }

  /* ---------- la voix : arabe puis français ---------- */
  function legende(qui) {
    $('intro-ar').classList.toggle('visible', qui === 'ar');
    $('intro-fr').classList.toggle('visible', qui === 'fr');
  }
  function majBoutonSon() {
    var b = $('intro-son'), t = { invite: '🔊 Activer le son', joue: '🔇 Couper le son', fini: '🔊 Réécouter', coupe: '🔊 Activer le son' }[etat.son];
    b.textContent = t; b.setAttribute('aria-label', t.replace(/^\S+\s/, ''));
    b.classList.toggle('invite', etat.son === 'invite' || etat.son === 'coupe');
    var aide = $('intro-aide');
    if (aide) { aide.textContent = (window.matchMedia && matchMedia('(pointer: coarse)').matches) ? '🔊 Touche l’écran pour écouter' : '🔊 Clique n’importe où pour écouter'; aide.classList.toggle('visible', etat.son === 'invite'); }
  }
  function arreterVoix(fondu) {
    var a = etat.voix; if (!a) return;
    try {
      if (fondu && !a.paused) { var v = a.volume, pas = setInterval(function () { v -= 0.1; if (v <= 0.02) { clearInterval(pas); try { a.pause(); a.volume = 0.85; } catch (e) {} } else a.volume = v; }, 40); }
      else a.pause();
    } catch (e) {}
  }
  // UN SEUL élément audio pour l'arabe puis le français : sur iPhone/iPad, seul l'élément « débloqué »
  // par le toucher de l'utilisateur peut continuer à parler ensuite (un 2e élément resterait muet).
  function preparerVoix() {
    if (etat.voix) return;
    var a = etat.voix = new Audio(VOIX_AR); etat.partie = 'ar';
    a.preload = 'auto'; a.volume = 0.85;
    a.addEventListener('ended', function () {
      if (etat.ferme || etat.son !== 'joue') return;
      if (etat.partie !== 'ar') { finVoix(); return; }
      etat.partie = 'fr'; legende(null);
      plus(function () {
        if (etat.ferme || etat.son !== 'joue') return;
        legende('fr');
        try { a.src = VOIX_FR; var p = a.play(); if (p && p.catch) p.catch(finVoix); } catch (e) { finVoix(); }
      }, 250);
    });
    a.addEventListener('error', function () {
      if (etat.partie === 'ar') { etat.son = 'invite'; majBoutonSon(); legende(null); } else finVoix();
    });
  }
  function finVoix() { if (etat.son === 'joue') { etat.son = 'fini'; majBoutonSon(); } plus(function () { legende(null); }, 1800); }
  function lancerVoix(depuisGeste) {
    if (etat.ferme || etat.ouvert) return;
    preparerVoix();
    var a = etat.voix;
    try { a.pause(); if (etat.partie !== 'ar') { a.src = VOIX_AR; etat.partie = 'ar'; } a.currentTime = 0; } catch (e) {}
    if (depuisGeste) memoSon(true);
    var p;
    try { p = a.play(); } catch (e) { p = null; }
    etat.essai = true;
    var ok = function () { etat.essai = false; etat.son = 'joue'; majBoutonSon(); legende('ar'); };
    var bloque = function () { etat.essai = false; etat.son = 'invite'; majBoutonSon(); legende(depuisGeste ? null : 'fr'); };
    if (p && p.then) p.then(ok, bloque); else bloque();
  }
  function basculerSon() {
    if (etat.son === 'joue') { etat.son = 'coupe'; memoSon(false); arreterVoix(false); legende(null); majBoutonSon(); }
    else lancerVoix(true);
  }

  /* ---------- l'entrée dans le site : douce et rapide ---------- */
  function montrerEntrer() {
    if (etat.ferme || etat.ouvert) return;
    var e = $('intro-entrer'); e.disabled = false; e.classList.add('visible');
  }
  function entrer() {
    if (etat.ouvert || etat.ferme) return;
    etat.ouvert = true; viderMinuteurs(); arreterVoix(true); legende(null);
    racine.classList.add('ouvre');
    plus(function () { fermer('entree'); }, calme ? 120 : 750);
  }

  /* ---------- fermeture : toujours propre, quel que soit le chemin ---------- */
  function fermer(raison) {
    if (etat.ferme) return; etat.ferme = true; viderMinuteurs(); arreterVoix(raison !== 'passer');
    var m = lire(); m.vu = Date.now();
    if ($('intro-off') && $('intro-off').checked) m.off = true;
    ecrire(m);
    try { sessionStorage.setItem(CLE_SESSION, '1'); } catch (e) {}
    racine.classList.add('sortie'); if (raison === 'passer') racine.classList.add('sortie-vite');
    window.removeEventListener('keydown', clavier, true);
    racine.removeEventListener('click', geste, true); racine.removeEventListener('touchend', geste, true); window.removeEventListener('keydown', geste, true);
    plus(function () {
      H.classList.remove('intro-on');
      Array.prototype.forEach.call(document.body.children, function (e) { if (e !== racine) e.removeAttribute('inert'); });
      racine.style.display = 'none';
      majReglage();
    }, calme ? 50 : raison === 'passer' ? 320 : 500);
  }

  function clavier(e) {
    if (etat.ferme) return;
    if (e.key === 'Escape') { e.preventDefault(); fermer('passer'); return; }
    if (e.key === 'Tab') {   // le focus reste dans l'introduction
      var f = Array.prototype.filter.call(racine.querySelectorAll('button, input'), function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!f.length) return;
      var a = f.indexOf(document.activeElement);
      if (e.shiftKey && a <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && a === f.length - 1) { e.preventDefault(); f[0].focus(); }
      else if (a === -1) { e.preventDefault(); f[0].focus(); }
    }
  }
  // premier toucher n'importe où (hors boutons ; « click » et non « pointerdown » : seul le relâcher du doigt débloque le son sur téléphone) : la voix démarre tout de suite, si le navigateur l'avait bloquée
  function geste(e) {
    if (etat.son !== 'invite' || etat.ouvert || etat.ferme) return;
    if (e.target && e.target.closest && e.target.closest('button, label, input, a')) return;
    if (e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Escape' || e.key === 'Shift')) return;
    if (etat.essai) return;   // un essai est déjà en cours (touchend puis click)
    lancerVoix(true);
  }

  /* ---------- démarrage : le visuel commence tout de suite, tout seul ---------- */
  function demarrer(mode) {
    etat.mode = mode; etat.ferme = false; etat.ouvert = false; etat.son = prefSon() ? 'invite' : 'coupe';
    racine.className = 'intro' + (leger ? ' leger' : '') + (calme ? ' calme' : '');
    racine.style.display = '';
    H.classList.add('intro-on');
    Array.prototype.forEach.call(document.body.children, function (e) { if (e !== racine) e.setAttribute('inert', ''); });
    legende(null); $('intro-entrer').classList.remove('visible'); $('intro-entrer').disabled = true;
    semer(); majBoutonSon(); preparerVoix();
    // la voix : essai automatique (accepté si le navigateur l'autorise), sinon le bouton « Activer le son » prend le relais
    if (prefSon()) plus(function () { lancerVoix(false); }, calme ? 600 : 1500);
    // le bouton d'entrée apparaît vite, sans attendre la fin de la voix
    plus(montrerEntrer, mode === 'courte' ? 1800 : (calme ? 600 : 2800));
    window.addEventListener('keydown', clavier, true);
    racine.addEventListener('click', geste, true); racine.addEventListener('touchend', geste, true); window.addEventListener('keydown', geste, true);
    try { racine.focus({ preventScroll: true }); } catch (e) {}
    window.__introPret = true;
  }

  function brancher() {
    $('intro-entrer').addEventListener('click', entrer);
    $('intro-passer').addEventListener('click', function () { fermer('passer'); });
    $('intro-son').addEventListener('click', basculerSon);
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
    if (v && racine) v.addEventListener('click', function () { var c = $('intro-off'); if (c) c.checked = false; viderMinuteurs(); demarrer('complete'); });
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
    var mode = H.classList.contains('intro-on') ? (window.__introMode || 'complete') : null;
    if (mode) {
      var lancer = function () { try { demarrer(mode); } catch (e) { fermer('erreur'); H.classList.remove('intro-on'); } };
      if (logo && !logo.complete) { logo.addEventListener('load', lancer, { once: true }); logo.addEventListener('error', function () { fermer('erreur'); H.classList.remove('intro-on'); }, { once: true }); }
      else lancer();
    } else { H.classList.remove('intro-on'); racine.style.display = 'none'; }
  } catch (e) { H.classList.remove('intro-on'); if (racine) racine.style.display = 'none'; }
})();
