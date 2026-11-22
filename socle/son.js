/* Les Lanternes de Nour — SYSTÈME AUDIO CENTRAL (window.LDNSon).
   UN SEUL endroit pour toutes les voix du site : accueil, village, Grand Voyage, ablutions, prière, calendrier, découvrir, jeux et futures activités.
   Les pages n'ont plus leur propre « new Audio() » ni leur propre « speechSynthesis » (un test du dépôt le vérifie : outils/tests/audio-central.test.mjs).

   Ce que le système garantit
   - UNE SEULE voix à la fois : toute nouvelle voix coupe la précédente (même venue d'un autre moteur, ou d'un jeu affiché dans un cadre du village).
   - Les narrations démarrent seules. Si le navigateur refuse le son (aucun geste encore fait sur cette page), la dernière narration demandée est mise
     en attente et part au PREMIER toucher n'importe où (un seul pictogramme « 🔊 » invite à toucher ; l'enfant n'a pas besoin de savoir lire).
   - Première visite : bouton « Activer les sons ». Le choix est mémorisé (localStorage « ldn_son »).
   - Réglage parents, partout : bouton son en bas de l'écran → son coupé / volume / arrêter la voix. Le réglage vaut pour tout le site.
   - Changement de page, retour à l'accueil, fermeture d'une activité, application en arrière-plan : la voix s'arrête proprement.
   - Aucune voix n'est fabriquée ici : seules les voix déjà enregistrées et validées sont lues. La voix du navigateur (français uniquement, jamais pour
     l'arabe ni le religieux) ne sert que de dernier recours quand une activité l'a toujours fait (option « texte »).

   Interface (toutes les durées en secondes, comme dans les voix.json « [fichier, début, fin] »)
     LDNSon.dire({ fichier, debut, fin, rate, texte, tts, cle, fini })   joue UNE voix ; renvoie true si elle part (ou est mise en attente)
     LDNSon.sequence([{ fichier|url, debut, fin, rate, texte } | { attente: ms }], fini)
     LDNSon.url(adresse, { rate, fini })                                  un fichier entier (récitation, etc.)
     LDNSon.bibliotheque('voix/')                                         table voix.json d'un dossier : { prete, existe(id), dire(id, opts), sequence(ids, fini) }
     LDNSon.arreter()                                                     coupe tout proprement (à appeler en quittant une activité)
     LDNSon.prendre(nom, fonctionArret)                                   pour un autre moteur (WebAudio du village) : coupe les autres, s'enregistre
     LDNSon.suivre(elementAudio)                                          un <audio> existant obéit au volume / au muet et se tait quand une autre voix parle
     LDNSon.enAttente(fn)                                                 mémorise « à relancer au premier toucher » (dernier appel gagne)
     LDNSon.etat() / reglerVolume(v) / couper(bool) / activer() / volumeEffectif() / surEtat(cb) / surDeverrouillage(cb) / config({...})
     LDNSon.unefois(cle) → true la première fois de la session (évite de répéter une même introduction) */
(function () {
  'use strict';
  if (window.LDNSon) return;
  var CLE = 'ldn_son', CLE_VUS = 'ldn_son_dit';
  // Jamais de voix de synthèse pour l'arabe, le Coran, les noms et mots religieux (règle du projet)
  var RELIGIEUX = /[؀-ۿ]|[âîûÂÎÛ‘ʿʾ]|\b(allah|bismi|ramadan|coran|a[iï]d\b|zak|sourate|f[aâ]tiha|nouh|adam|ibrahim|youss?ouf|younous|mouss?a|ftour|kaaba|qibla|sal[aâ]t|rak|soujou|roukou|takb|tachah|tasl|wudu|mach|inch|assal|as-sal|soubh|rabb|alhamd|al-hamd|akbar|astagh|jibr|hajj|chah[aâ]da|fajr|dhohr|asr\b|maghrib|icha|sahour|adh[aâ]n|prophète)/i;
  var SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  var cfg = { invitation: true, position: 'bas-gauche', bouton: true };

  // ---------- réglages (partagés par tout le site) ----------
  var S = { choix: null, muet: false, volume: 1 };      // choix : 'oui' | 'non' | null (pas encore choisi)
  function borne(v) { v = Number(v); return isNaN(v) ? 1 : Math.max(0, Math.min(1, v)); }
  function lireReglages() {
    var o = null;
    try { o = JSON.parse(localStorage.getItem(CLE) || 'null'); } catch (e) {}
    if (o && typeof o === 'object') { S.choix = (o.choix === 'oui' || o.choix === 'non') ? o.choix : null; S.muet = !!o.muet; S.volume = borne(o.volume == null ? 1 : o.volume); return; }
    // anciens réglages (ablutions / prière / accueil) : un son coupé par les parents le reste
    try { if (localStorage.getItem('ablutions_son') === '0' || localStorage.getItem('lanternes_intro_son') === 'non') { S.choix = 'oui'; S.muet = true; } } catch (e) {}
  }
  function ecrireReglages() {
    try { localStorage.setItem(CLE, JSON.stringify(S)); localStorage.setItem('ablutions_son', S.muet ? '0' : '1'); } catch (e) {}
  }
  lireReglages();

  var journal = [];     // trace courte (sert aux tests)
  function trace(type, d) { journal.push({ t: Math.round(performance.now()), type: type, d: d || null }); if (journal.length > 300) journal.shift(); }

  // ---------- état de lecture ----------
  var AU = new Audio(); AU.preload = 'auto';
  var n = 0;                // génération : toute lecture plus ancienne est abandonnée
  var seq = 0;              // génération des séquences
  var minuteur = 0;
  var attente = null;       // narration refusée par le navigateur, à relancer au premier toucher
  var deverrouille = false;
  var autres = {};          // nom → fonction d'arrêt (autres moteurs)
  var suivis = [];          // <audio> suivis
  var ecouteurs = [], ecouteursDeverrou = [];
  var dernier = { cle: '', t: 0 };
  var parle = false;

  function volumeEffectif() { return S.muet ? 0 : S.volume; }
  function appliquer() {
    try { AU.volume = S.volume; AU.muted = S.muet; } catch (e) {}
    suivis.forEach(function (a) { try { a.volume = S.volume; a.muted = S.muet; } catch (e) {} });
    if (S.muet) couper();
    ecouteurs.slice().forEach(function (f) { try { f(etat()); } catch (e) {} });
    majInterface();
  }
  function etat() { return { choix: S.choix, muet: S.muet, volume: S.volume, actif: S.choix !== 'non' && !S.muet, deverrouille: deverrouille, parle: parle, enAttente: !!attente }; }

  // coupe ce qui joue (sans toucher aux séquences ni à l'attente)
  function couper(sauf, elSauf) {
    n++; clearTimeout(minuteur); parle = false;
    try { AU.onended = null; AU.onerror = null; AU.pause(); AU.playbackRate = 1; } catch (e) {}
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
    suivis.forEach(function (a) { if (a !== elSauf) try { a.pause(); } catch (e) {} });
    Object.keys(autres).forEach(function (k) { if (k !== sauf) try { autres[k](); } catch (e) {} });
  }
  // arrêt complet : voix, séquences, attente, et celles des autres fenêtres du site (jeu affiché dans le village)
  function arreter() { seq++; attente = null; couper(); trace('arreter'); majInterface(); }
  // toutes les fenêtres du même site (page + cadres) : une seule voix dans l'ensemble
  function autresFenetres(fn) {
    var vues = [];
    (function marche(w, d) {
      if (!w || d > 4 || vues.indexOf(w) >= 0) return; vues.push(w);
      try { if (w !== window && w.LDNSon) fn(w.LDNSon); } catch (e) {}
      try { if (w.parent && w.parent !== w) marche(w.parent, d + 1); } catch (e) {}
      try { for (var i = 0; i < w.frames.length; i++) marche(w.frames[i], d + 1); } catch (e) {}
    })(window, 0);
  }
  function jeCoupeLesAutres() { autresFenetres(function (L) { try { L._couperIci(); } catch (e) {} }); }

  // un autre moteur (WebAudio du village) prend la parole : tout le reste se tait
  function prendre(nom, arret) {
    seq++; attente = null; couper(nom); jeCoupeLesAutres();
    if (typeof arret === 'function') autres[nom] = arret;
    trace('prendre', nom);
    return !S.muet;
  }
  function suivre(a) {
    if (!a || suivis.indexOf(a) >= 0) return a;
    suivis.push(a); try { a.volume = S.volume; a.muted = S.muet; } catch (e) {}
    a.addEventListener('play', function () { /* lecture lancée par un autre moteur : elle prend la parole */ seq++; attente = null; couper(null, a); jeCoupeLesAutres(); try { a.volume = S.volume; } catch (e) {} });
    return a;
  }
  function enAttente(fn) { attente = typeof fn === 'function' ? fn : null; if (attente) { trace('attente'); majInterface(); } }

  // ---------- déverrouillage (réglage des navigateurs : pas de son avant un geste) ----------
  function surGeste() {
    if (!deverrouille) {
      deverrouille = true; trace('deverrouille');
      if (S.choix == null) { S.choix = 'oui'; ecrireReglages(); }       // un premier toucher vaut activation : le parent peut couper à tout moment
      ecouteursDeverrou.slice().forEach(function (f) { try { f(); } catch (e) {} });
    }
    var a = attente; attente = null;
    if (a) { trace('relance'); try { a(); } catch (e) {} }
    else if (!parle && !AU.dataset.debloque) {           // « bénit » le lecteur pour les navigateurs stricts (iOS) sans rien faire entendre
      AU.dataset.debloque = '1';
      try { var v = AU.volume; AU.src = SILENCE; AU.dataset.f = ''; var p = AU.play(); if (p && p.catch) p.catch(function () {}); AU.volume = v; } catch (e) {}
    }
    majInterface();
  }
  ['pointerup', 'touchend', 'mouseup', 'click', 'keydown'].forEach(function (nom) { addEventListener(nom, surGeste, { passive: true, capture: true }); });
  function bloque(o) { attente = function () { jouer(o); }; trace('bloque', o && (o.cle || o.fichier || o.texte)); majInterface(); }

  // ---------- jouer ----------
  function fin(o, ok) { parle = false; majInterface(); if (o && o.fini) { var f = o.fini; o.fini = null; try { f(ok !== false); } catch (e) {} } }
  function adresse(f) { try { return new URL(f, document.baseURI).href; } catch (e) { return f; } }

  function synthese(o, jeton) {
    var t = String(o.texte || '').replace(/<[^>]+>/g, ' ').replace(/[؀-ۿ]+/g, '').replace(/\s+/g, ' ').trim();
    if (!t || RELIGIEUX.test(String(o.texte)) || !window.speechSynthesis || !window.SpeechSynthesisUtterance) { fin(o, false); return false; }
    try {
      var u = new SpeechSynthesisUtterance(t), v = null;
      u.lang = 'fr-FR'; u.rate = o.rate || 0.92; u.pitch = o.pitch || 1.1; u.volume = S.volume;
      try { v = speechSynthesis.getVoices().find(function (x) { return x.lang && x.lang.indexOf('fr') === 0; }); } catch (e) {}
      if (v) u.voice = v;
      u.onend = function () { if (jeton === n) fin(o, true); };
      u.onerror = function (e) { if (jeton !== n) return; if (e && e.error === 'not-allowed') bloque(o); else fin(o, false); };
      parle = true; speechSynthesis.speak(u); return true;
    } catch (e) { fin(o, false); return false; }
  }

  // joue maintenant (coupe ce qui jouait) : utilisé par dire() et par les séquences
  function jouer(o) {
    couper(); var jeton = n;
    if (S.muet || S.choix === 'non') { setTimeout(function () { fin(o, false); }, 0); return false; }
    if (!o.fichier) { return o.texte && o.tts !== false ? synthese(o, jeton) : (fin(o, false), false); }
    var src = adresse(o.fichier), debut = o.debut || 0, rate = o.rate || 1;
    var aller = function () {
      if (jeton !== n) return;
      try { AU.volume = S.volume; AU.muted = false; AU.playbackRate = rate; AU.preservesPitch = true; } catch (e) {}
      try { AU.currentTime = debut; } catch (e) {}
      var p; try { p = AU.play(); } catch (e) { p = null; }
      parle = true;
      var demarre = function () {
        if (jeton !== n) return;
        if (o.fin > debut) minuteur = setTimeout(function () { if (jeton !== n) return; try { AU.pause(); } catch (e) {} fin(o, true); }, (o.fin - debut) * 1000 / rate + 120);
        else AU.onended = function () { AU.onended = null; if (jeton === n) fin(o, true); };
        trace('joue', o.cle || o.fichier); majInterface();
      };
      if (p && p.then) p.then(demarre).catch(function (e) {
        if (jeton !== n) return; parle = false;
        if (e && e.name === 'NotAllowedError') bloque(o);
        else if (e && e.name === 'AbortError') { /* remplacée par une autre voix */ }
        else if (o.texte && o.tts !== false && !o.fichierSeul) synthese(o, jeton); else fin(o, false);
      }); else demarre();
    };
    AU.onerror = function () { if (jeton !== n) return; parle = false; if (o.texte && o.tts !== false && !o.fichierSeul) synthese(o, jeton); else fin(o, false); };
    if (AU.dataset.f !== src) { AU.dataset.f = src; AU.addEventListener('loadedmetadata', function k() { AU.removeEventListener('loadedmetadata', k); aller(); }, { once: true }); AU.src = src; AU.load(); }
    else aller();
    return true;
  }

  function dire(o) {
    o = o || {};
    if (o.unefois && !unefois(o.unefois)) { setTimeout(function () { fin(o, false); }, 0); return false; }
    // la même phrase demandée deux fois de suite en quelques instants (double clic, redessin d'écran) ne se répète pas
    var maintenant = Date.now();
    if (o.cle && o.auto !== false && dernier.cle === o.cle && maintenant - dernier.t < 1500) { return false; }
    dernier = { cle: o.cle || '', t: maintenant };
    seq++; attente = null; jeCoupeLesAutres();
    return jouer(o);
  }

  function url(u, o) { o = Object.assign({}, o || {}); o.fichier = u; o.debut = 0; o.fin = 0; o.fichierSeul = true; return dire(o); }

  function sequence(items, finale) {
    seq++; attente = null; var moi = seq; jeCoupeLesAutres();
    var file = (items || []).slice();
    var suivant = function () {
      if (moi !== seq) return;
      var it = file.shift();
      if (!it) { if (finale) finale(); return; }
      if (it.attente) { minuteur = setTimeout(suivant, it.attente); return; }
      var o = Object.assign({}, it); o.fini = function () { setTimeout(suivant, it.pause == null ? 350 : it.pause); };
      if (it.url) { o.fichier = it.url; o.debut = 0; o.fin = 0; o.fichierSeul = true; }
      if (!o.fichier && !(o.texte && o.tts !== false)) { suivant(); return; }
      // une étape bloquée par le navigateur est reprise (avec la suite) au premier toucher
      jouer(o);
    };
    suivant();
    return true;
  }

  // ---------- bibliothèque de voix (voix.json d'un dossier) ----------
  var biblios = {};
  function bibliotheque(dossier) {
    dossier = dossier || 'voix/'; var cle = adresse(dossier);
    if (biblios[cle]) return biblios[cle];
    var B = { table: null, dossier: cle };
    B.prete = fetch(cle + 'voix.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { B.table = j; return !!j; }).catch(function () { return false; });
    B.existe = function (id) { return !!(B.table && B.table[id]); };
    B.entree = function (id, o) { var c = B.table && B.table[id]; return c ? Object.assign({ fichier: cle + c[0], debut: c[1], fin: c[2], cle: id }, o || {}) : null; };
    // dire(id, { texte, fini, rate }) : la voix enregistrée, sinon (si « texte » est donné) la voix du navigateur, comme avant
    B.dire = function (id, o) {
      o = o || {}; var jeton = ++seq; attente = null;
      // on réserve la parole tout de suite : un changement d'écran pendant le chargement annule cette lecture
      var res = B.prete.then(function () {
        if (jeton !== seq) return false;
        var e = id && B.entree(id, o);
        if (e) { seq++; jeCoupeLesAutres(); return jouer(e); }
        if (o.texte && o.tts !== false) { seq++; jeCoupeLesAutres(); return jouer({ texte: o.texte, fini: o.fini, rate: o.rate }); }
        fin(o, false); return false;
      });
      return res;
    };
    B.sequence = function (ids, finale) {
      return B.prete.then(function () {
        var items = [].concat(ids).filter(function (id) { return B.existe(id); }).map(function (id) { return B.entree(id); });
        return sequence(items, finale);
      });
    };
    biblios[cle] = B; return B;
  }

  // ---------- « une seule fois » (évite de redire la même introduction à chaque retour) ----------
  function unefois(cle) {
    try {
      var vus = JSON.parse(sessionStorage.getItem(CLE_VUS) || '{}');
      if (vus[cle]) return false; vus[cle] = 1; sessionStorage.setItem(CLE_VUS, JSON.stringify(vus)); return true;
    } catch (e) { return true; }
  }

  // ---------- réglages publics ----------
  function reglerVolume(v) { S.volume = borne(v); if (S.volume > 0 && S.muet) S.muet = false; ecrireReglages(); appliquer(); }
  function coupe(b) { S.muet = !!b; if (S.choix == null) S.choix = 'oui'; ecrireReglages(); appliquer(); trace(S.muet ? 'muet' : 'son'); }
  function activer() { S.choix = 'oui'; S.muet = false; ecrireReglages(); appliquer(); surGeste(); }

  // ---------- l'interface : « Activer les sons » + réglage parents ----------
  var racine = null, bouton = null, panneau = null, invite = null;
  var ICONE_ON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICONE_OFF = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function css() {
    var s = document.createElement('style'); s.id = 'ldn-son-css';
    s.textContent = '#ldn-son{position:fixed;z-index:2147483000;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#fff;-webkit-tap-highlight-color:transparent}' +
      '#ldn-son.bas-gauche{left:max(10px,env(safe-area-inset-left));bottom:max(10px,env(safe-area-inset-bottom))}' +
      '#ldn-son.bas-droite{right:max(10px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom))}' +
      '#ldn-son.haut-droite{right:max(10px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top))}' +
      '#ldn-son.haut-gauche{left:max(10px,env(safe-area-inset-left));top:max(10px,env(safe-area-inset-top))}' +
      '#ldn-son .lb{width:44px;height:44px;border-radius:50%;border:2px solid rgba(255,214,102,.9);background:rgba(25,19,69,.82);color:#ffd666;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;box-shadow:0 2px 10px rgba(0,0,0,.35);opacity:.78}' +
      '#ldn-son .lb:hover,#ldn-son .lb:focus-visible,#ldn-son.ouvert .lb{opacity:1;outline:none}' +
      '#ldn-son.coupe .lb{color:#ff9fb2;border-color:#ff9fb2}' +
      '#ldn-son .lp{position:absolute;min-width:230px;padding:12px;border-radius:16px;background:rgba(25,19,69,.96);border:2px solid rgba(255,214,102,.9);box-shadow:0 6px 24px rgba(0,0,0,.45);display:none;flex-direction:column;gap:10px;font-size:15px;line-height:1.3}' +
      '#ldn-son.bas-gauche .lp,#ldn-son.bas-droite .lp{bottom:54px}#ldn-son.haut-gauche .lp,#ldn-son.haut-droite .lp{top:54px}' +
      '#ldn-son.bas-gauche .lp,#ldn-son.haut-gauche .lp{left:0}#ldn-son.bas-droite .lp,#ldn-son.haut-droite .lp{right:0}' +
      '#ldn-son.ouvert .lp{display:flex}' +
      '#ldn-son .lp button{font:inherit;border:0;border-radius:12px;padding:10px 12px;background:#ffd666;color:#191345;font-weight:700;cursor:pointer;min-height:44px}' +
      '#ldn-son .lp .l2{background:transparent;color:#fff;border:2px solid rgba(255,255,255,.5)}' +
      '#ldn-son .lp label{display:flex;flex-direction:column;gap:4px;font-weight:600}' +
      '#ldn-son .lp input[type=range]{width:100%;height:32px;accent-color:#ffd666}' +
      '#ldn-son .li{position:fixed;left:50%;transform:translateX(-50%);bottom:max(18px,env(safe-area-inset-bottom));z-index:2147483001;display:none;align-items:center;gap:10px;padding:14px 22px;border-radius:999px;border:3px solid #ffd666;background:#191345;color:#ffd666;font:700 18px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;cursor:pointer;box-shadow:0 6px 28px rgba(0,0,0,.5);animation:ldn-son-p 1.6s ease-in-out infinite;max-width:calc(100vw - 24px)}' +
      '#ldn-son .li svg{width:34px;height:34px;flex:none}' +
      '#ldn-son.invite .li{display:flex}' +
      '@keyframes ldn-son-p{0%,100%{box-shadow:0 6px 28px rgba(0,0,0,.5),0 0 0 0 rgba(255,214,102,.6)}50%{box-shadow:0 6px 28px rgba(0,0,0,.5),0 0 0 14px rgba(255,214,102,0)}}' +
      '@media (prefers-reduced-motion:reduce){#ldn-son .li{animation:none}}';
    (document.head || document.documentElement).appendChild(s);
  }
  function construire() {
    if (racine || !document.body) return;
    css();
    racine = document.createElement('div'); racine.id = 'ldn-son'; racine.className = cfg.position;
    racine.innerHTML =
      '<button type="button" class="li" aria-label="Activer les sons">' + ICONE_ON + '<span>Activer les sons</span></button>' +
      '<button type="button" class="lb" aria-label="Réglage du son (parents)" aria-expanded="false"></button>' +
      '<div class="lp" role="group" aria-label="Réglage du son">' +
      '<button type="button" class="lm"></button>' +
      '<label>Volume<input type="range" class="lv" min="0" max="100" step="5" aria-label="Volume"></label>' +
      '<button type="button" class="l2 ls">Arrêter la voix</button></div>';
    document.body.appendChild(racine);
    invite = racine.querySelector('.li'); bouton = racine.querySelector('.lb'); panneau = racine.querySelector('.lp');
    invite.addEventListener('click', function (e) { e.stopPropagation(); activer(); });
    bouton.addEventListener('click', function (e) { e.stopPropagation(); var o = racine.classList.toggle('ouvert'); bouton.setAttribute('aria-expanded', o); });
    racine.querySelector('.lm').addEventListener('click', function () { coupe(!S.muet); });
    racine.querySelector('.lv').addEventListener('input', function (e) { reglerVolume(e.target.value / 100); });
    racine.querySelector('.ls').addEventListener('click', function () { arreter(); });
    document.addEventListener('click', function (e) { if (racine && !racine.contains(e.target)) { racine.classList.remove('ouvert'); bouton.setAttribute('aria-expanded', 'false'); } });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && racine) racine.classList.remove('ouvert'); });
    if (!cfg.bouton) bouton.style.display = 'none';
    majInterface();
  }
  function majInterface() {
    if (!racine) return;
    racine.classList.toggle('coupe', S.muet);
    var demande = cfg.invitation && !S.muet && S.choix !== 'non' && (S.choix == null || !!attente);
    racine.classList.toggle('invite', demande);
    if (invite) invite.querySelector('span').textContent = S.choix == null ? 'Activer les sons' : 'Touche pour entendre';
    if (bouton) { bouton.innerHTML = S.muet ? ICONE_OFF : ICONE_ON; }
    var m = racine.querySelector('.lm'); if (m) m.textContent = S.muet ? '🔇 Son coupé — toucher pour remettre' : '🔊 Son activé — toucher pour couper';
    var v = racine.querySelector('.lv'); if (v && document.activeElement !== v) v.value = Math.round(S.volume * 100);
  }
  function config(o) {
    Object.assign(cfg, o || {});
    if (racine) { racine.className = cfg.position + (racine.classList.contains('coupe') ? ' coupe' : ''); if (bouton) bouton.style.display = cfg.bouton ? '' : 'none'; majInterface(); }
  }

  // ---------- cycle de vie : changer de page ou quitter l'application coupe la voix ----------
  addEventListener('pagehide', function () { arreter(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) arreter(); });
  addEventListener('storage', function (e) { if (e.key === CLE) { lireReglages(); appliquer(); } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', construire); else construire();

  window.LDNSon = {
    dire: dire, sequence: sequence, url: url, bibliotheque: bibliotheque, arreter: arreter, prendre: prendre, suivre: suivre, enAttente: enAttente,
    etat: etat, reglerVolume: reglerVolume, couper: coupe, activer: activer, volumeEffectif: volumeEffectif, unefois: unefois, config: config,
    muet: function () { return S.muet || S.choix === 'non'; }, deverrouille: function () { return deverrouille; },
    surEtat: function (f) { if (typeof f === 'function') { ecouteurs.push(f); try { f(etat()); } catch (e) {} } },
    surDeverrouillage: function (f) { if (typeof f !== 'function') return; if (deverrouille) f(); else ecouteursDeverrou.push(f); },
    journal: function () { return journal.slice(); }, RELIGIEUX: RELIGIEUX,
    _couperIci: function () { seq++; attente = null; couper(); majInterface(); }       // appelé par une autre fenêtre du site qui prend la parole
  };
})();
