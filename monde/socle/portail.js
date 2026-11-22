// Portail d'entrée du Monde de Nour — RESTAURATION de l'ancienne « ouverture magique » (porte turquoise, sept lanternes qui s'allument
// UNE À UNE du centre vers les côtés, lueur dorée, battants qui s'ouvrent), à la demande du client (22/11/2026).
// Le style (CSS), le dessin de la porte et des lanternes, l'ordre et le rythme des lanternes (300 ms + 260 ms par lanterne, du centre vers
// les côtés), l'ouverture de la porte (2,2 s) et la sortie (fondu + zoom) sont ceux de monde/socle/ouverture.js, repris tels quels.
// Ajouts : une fois par NOUVELLE session de jeu (règles dans portail-logique.js), accueil vocal « مَرْحَبًا ! Bienvenue dans le Monde de Nour ! »
// (lecture automatique si le navigateur l'autorise, sinon l'enfant touche la porte comme avant), bouton « Entrer dans le Monde de Nour »,
// « Réécouter l'accueil », prénom de l'enfant, événements ldn:portail-pret / ldn:portail-fin pour le village. Aucune musique, jamais de synthèse vocale.
// Anciens fichiers conservés : ouverture.js (original, non référencé) et prototypes/portail-porte-animee.js (porte en bois, écartée).
(function () {
  var L = window.PortailLogique;
  if (!L) return;
  var ENFANT = null, SESSION = null;
  try { ENFANT = JSON.parse(localStorage.getItem('ldn_profil_actif') || 'null'); } catch (e) {}
  try { SESSION = sessionStorage.getItem(L.CLE_SESSION); } catch (e) {}
  var forcer = /[?&](ouverture|portail)=1\b/.test(location.search);
  var afficher = L.doitAfficher({ forcer: forcer, session: SESSION, profil: ENFANT });
  window.__portail = { actif: !!afficher, etat: afficher ? 'attente' : 'absent', voix: null };
  if (!afficher) return;
  // Marqué dès l'affichage : un rechargement en plein portail ne rejoue jamais la voix une seconde fois.
  try { sessionStorage.setItem(L.CLE_SESSION, L.cleProfil(ENFANT)); } catch (e) {}

  var calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cues = { coupe: 1.12, finVoix: 3.26, fichier: null };       // repères de la voix (monde/voix/accueil-portail.json) ; aucun fichier = aucune voix

  var css = [
    '#ouverture{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;',
    'background:radial-gradient(120% 90% at 50% 40%,#2a1f6b 0%,#191345 60%,#0e0a2b 100%);color:#fff;overflow:hidden;',
    'font-family:Nunito,system-ui,sans-serif;transition:opacity 1.4s ease, transform 1.4s ease}',
    '#ouverture.fin{opacity:0;transform:scale(1.25);pointer-events:none}',
    '#ouv-lueur{position:absolute;left:50%;top:52%;width:160vmax;height:160vmax;transform:translate(-50%,-50%) scale(.05);',
    'border-radius:50%;background:radial-gradient(circle,rgba(255,236,170,1) 0%,rgba(255,200,90,.75) 16%,rgba(245,185,66,.25) 32%,rgba(245,185,66,0) 50%);',
    'opacity:0;transition:transform 3.2s cubic-bezier(.2,.7,.2,1),opacity 1.6s ease}',
    '#ouverture.joue #ouv-lueur{opacity:1;transform:translate(-50%,-50%) scale(1)}',
    '#ouv-lanternes{position:relative;width:min(560px,92vw);height:90px;margin-bottom:6px}',
    '.ouv-l{position:absolute;top:0;width:34px;transform-origin:50% 0;animation:ouv-bal 3s ease-in-out infinite}',
    '.ouv-l svg{display:block;width:34px;height:auto;filter:grayscale(.85) brightness(.55);transition:filter .7s ease}',
    '.ouv-l.allumee svg{filter:grayscale(0) brightness(1.15) drop-shadow(0 0 10px rgba(255,200,90,1)) drop-shadow(0 0 22px rgba(255,170,60,.7))}',
    '@keyframes ouv-bal{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}',
    '#ouv-porte{position:relative;width:min(240px,58vw);aspect-ratio:240/320;perspective:900px;cursor:pointer;border:0;background:none;padding:0}',
    '#ouv-porte:focus-visible{outline:4px solid #ffe3a3;outline-offset:8px;border-radius:120px 120px 12px 12px}',
    '.ouv-cadre{position:absolute;inset:-14px;border-radius:134px 134px 14px 14px;background:linear-gradient(#f5b942,#c98a1c);',
    'box-shadow:0 0 40px rgba(245,185,66,.45)}',
    '.ouv-fond{position:absolute;inset:0;border-radius:120px 120px 8px 8px;overflow:hidden;',
    'background:radial-gradient(circle at 50% 60%,#fff6d8 0%,#ffd57a 45%,#f5b942 100%)}',
    '.ouv-battant{position:absolute;top:0;bottom:0;width:50%;transition:transform 2s cubic-bezier(.5,.05,.25,1)}',
    '.ouv-battant svg{width:100%;height:100%;display:block}',
    '.ouv-battant.g{left:0;transform-origin:0 50%}.ouv-battant.d{right:0;transform-origin:100% 50%}',
    '#ouverture.ouverte .ouv-battant.g{transform:rotateY(-105deg)}#ouverture.ouverte .ouv-battant.d{transform:rotateY(105deg)}',
    '#ouv-invite{margin-top:26px;font:700 clamp(18px,4.6vw,24px) Nunito,system-ui,sans-serif;color:#ffe3a3;',
    'animation:ouv-pulse 1.8s ease-in-out infinite;text-align:center;padding:0 16px}',
    '@keyframes ouv-pulse{0%,100%{opacity:.65}50%{opacity:1}}',
    '#ouverture.joue #ouv-invite{display:none}',
    '#ouv-salut{position:absolute;left:0;right:0;bottom:9vh;text-align:center;opacity:0;transform:translateY(14px);',
    'transition:opacity 1s ease,transform 1s ease;pointer-events:none;padding:0 16px}',
    '#ouverture.salue #ouv-salut{opacity:1;transform:none}',
    '#ouv-salut .ar{display:block;font:700 clamp(38px,10vw,64px)/1.3 "Amiri","Scheherazade New","Noto Naskh Arabic",serif;',
    'color:#fff3c9;text-shadow:0 2px 18px rgba(245,185,66,.8),0 0 2px #7a4e00}',
    '#ouv-salut .fr{display:block;margin-top:4px;font:800 clamp(18px,4.8vw,26px) Poppins,Nunito,system-ui,sans-serif;color:#191345;',
    'background:rgba(255,246,216,.9);display:inline-block;padding:6px 18px;border-radius:999px}',
    '#ouv-passer{position:absolute;top:max(14px,env(safe-area-inset-top));right:14px;z-index:2;border:2px solid rgba(255,227,163,.6);',
    'background:rgba(25,19,69,.55);color:#ffe3a3;font:700 16px Nunito,system-ui,sans-serif;padding:10px 16px;border-radius:999px;cursor:pointer}',
    '#ouv-passer:focus-visible{outline:3px solid #fff;outline-offset:3px}'
  ].join('');
  // Compléments (nouveaux éléments uniquement ; l'apparence de l'ancienne ouverture n'est pas modifiée)
  css += [
    '#ouverture.auto #ouv-invite,#ouverture.sonde #ouv-invite{display:none}',
    '#ouv-salut{bottom:max(9vh,calc(max(24px,env(safe-area-inset-bottom)) + 66px))}',      // position d\'origine (9vh), relevée seulement pour laisser la place au bouton « Entrer »
    '#ouv-salut .fr{font-size:clamp(14px,4vw,24px);white-space:nowrap}',
    '#ouv-salut .ar{opacity:0;transition:opacity .6s ease}#ouv-salut .fr{opacity:0;transition:opacity .7s ease}',
    '#ouverture.ar #ouv-salut .ar,#ouverture.fr #ouv-salut .fr{opacity:1}',
    '#p-entrer{position:absolute;left:50%;bottom:max(24px,env(safe-area-inset-bottom));width:max-content;transform:translate(-50%,14px) scale(.96);z-index:3;border:0;cursor:pointer;',
    'font:800 clamp(14px,3.8vw,22px) Poppins,Nunito,system-ui,sans-serif;color:#2b1a00;padding:15px 24px;border-radius:999px;max-width:92vw;text-transform:uppercase;white-space:nowrap;',
    'background:linear-gradient(#ffe08a,#f5b942);box-shadow:0 6px 0 #b9780e,0 0 28px rgba(255,200,90,.8);opacity:0;pointer-events:none;transition:opacity .8s ease,transform .8s ease}',
    '#ouverture.fini #p-entrer{opacity:1;transform:translate(-50%,0);pointer-events:auto;animation:ouv-pulse 2.2s ease-in-out .9s infinite}',
    '#p-entrer:focus-visible,#p-reecouter:focus-visible{outline:3px solid #fff;outline-offset:3px}',
    '#p-reecouter{position:absolute;top:max(14px,env(safe-area-inset-top));left:14px;z-index:2;border:2px solid rgba(255,227,163,.6);background:rgba(25,19,69,.55);color:#ffe3a3;',
    'font:700 16px Nunito,system-ui,sans-serif;padding:10px 16px;border-radius:999px;cursor:pointer;display:none}',
    '#ouverture.salue #p-reecouter:not([hidden]){display:block}#p-reecouter.attire{animation:ouv-pulse 1.6s ease-in-out infinite;border-color:#ffe3a3}',
    '#p-enfant{position:absolute;left:50%;transform:translateX(-50%);bottom:max(86px,calc(env(safe-area-inset-bottom) + 70px));background:rgba(25,19,69,.62);color:#fff6d8;font:700 15px Nunito,system-ui,sans-serif;padding:7px 16px;border-radius:999px;opacity:0;transition:opacity .8s ease}',
    '#ouverture.salue #p-enfant{opacity:1}',
    '#p-aide{position:absolute;left:0;right:0;bottom:calc(max(24px,env(safe-area-inset-bottom)) + 70px);text-align:center;margin:0;font:700 clamp(15px,4vw,19px) Nunito,system-ui,sans-serif;color:#ffe3a3;opacity:0;transition:opacity .5s ease;pointer-events:none}',
    '#ouverture.bloque #p-aide{opacity:1;animation:ouv-pulse 1.8s ease-in-out infinite}',
    '@media (prefers-reduced-motion:reduce){#ouverture.fini #p-entrer{animation:none}}'
  ].join('');

  function lanterneSVG() {
    return '<svg viewBox="0 0 26 40" aria-hidden="true"><path d="M13 0v5" stroke="#f5b942" stroke-width="1.6"/>' +
      '<path d="M7 7h12l-2 4H9z" fill="#c98a1c"/><path d="M8 11h10c3 4 3 15 0 19H8c-3-4-3-15 0-19z" fill="#ffcf5c" stroke="#c98a1c" stroke-width="1.4"/>' +
      '<path d="M13 12v17M10 12c-1.5 5-1.5 12 0 17M16 12c1.5 5 1.5 12 0 17" stroke="#c98a1c" stroke-width=".9" fill="none"/>' +
      '<ellipse cx="13" cy="21" rx="3" ry="4.5" fill="#fff6d8" opacity=".9"/><path d="M8 30h10l-1.5 4h-7z" fill="#c98a1c"/></svg>';
  }

  // Un battant : bois turquoise, étoile à huit branches dorée, bordure
  function battant(cote) {
    var miroir = cote === 'd' ? ' transform="translate(120 0) scale(-1 1)"' : '';
    return '<svg viewBox="0 0 120 320" preserveAspectRatio="none" aria-hidden="true"><g' + miroir + '>' +
      '<path d="M0 0H120V320H0z" fill="none"/>' +
      '<path d="M0 320V120C0 54 54 2 120 0V320z" fill="#1d8f9c" stroke="#f5b942" stroke-width="5"/>' +
      '<path d="M14 306V124C14 66 60 20 108 15V306z" fill="none" stroke="#ffe3a3" stroke-width="2" opacity=".75"/>' +
      '<g transform="translate(66 160)" fill="#f5b942"><path d="M0-26L7-7 26 0 7 7 0 26-7 7-26 0-7-7z"/>' +
      '<path d="M0-26L7-7 26 0 7 7 0 26-7 7-26 0-7-7z" transform="rotate(45)" opacity=".8"/>' +
      '<circle r="7" fill="#fff3c9"/></g>' +
      '<g fill="none" stroke="#ffe3a3" stroke-width="2" opacity=".6"><path d="M30 236h72M30 256h72M30 276h72"/></g>' +
      '<circle cx="110" cy="200" r="5" fill="#ffe3a3" stroke="#c98a1c" stroke-width="2"/>' +
      '</g></svg>';
  }

  var SILENCE = 'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';   // 50 ms de silence : sert seulement à savoir si le navigateur autorise le son
  function volumeVoix() {
    try { var s = JSON.parse(localStorage.getItem('monde') || '{}'); if (s.sons && typeof s.sons.voix === 'number') return Math.max(0, Math.min(1, s.sons.voix)); } catch (e) {}
    return 1;
  }

  function demarrer() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var o = document.createElement('div');
    o.id = 'ouverture';
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-label', 'Portail du Monde de Nour');
    o.className = 'sonde';          // l'invitation « Touche la porte » reste cachée le temps de savoir si le navigateur autorise le son
    var positions = [4, 18, 32, 50, 68, 82, 96]; // en % de la largeur
    var hauts = [34, 16, 6, 0, 6, 16, 34];
    var l = '';
    for (var i = 0; i < positions.length; i++) {
      l += '<div class="ouv-l" style="left:calc(' + positions[i] + '% - 17px);top:' + hauts[i] + 'px;animation-delay:-' + (i * .4) + 's">' + lanterneSVG() + '</div>';
    }
    o.innerHTML =
      '<div id="ouv-lueur" aria-hidden="true"></div>' +
      '<button id="ouv-passer" type="button">Passer ⏭</button>' +
      '<button id="p-reecouter" type="button" aria-label="Réécouter l\'accueil">🔊 Réécouter l’accueil</button>' +
      '<div id="ouv-lanternes" aria-hidden="true">' + l + '</div>' +
      '<button id="ouv-porte" type="button" aria-label="Ouvrir la porte du Monde de Nour">' +
      '<span class="ouv-cadre"></span><span class="ouv-fond"></span>' +
      '<span class="ouv-battant g">' + battant('g') + '</span><span class="ouv-battant d">' + battant('d') + '</span></button>' +
      '<p id="ouv-invite">✨ Touche la porte pour entrer ✨</p>' +
      '<p id="ouv-salut" aria-live="polite"><span class="ar" lang="ar" dir="rtl">مَرْحَبًا !</span>' +
      '<span class="fr">Bienvenue dans le Monde de Nour !</span></p>' +
      '<p id="p-aide">🔊 Touche l’écran pour écouter</p><div id="p-enfant"></div>' +
      '<button id="p-entrer" type="button" tabindex="-1">Entrer dans le Monde de Nour</button>';
    document.body.appendChild(o);
    if (ENFANT && ENFANT.surnom) o.querySelector('#p-enfant').textContent = (ENFANT.avatar === 'fille' ? '👧 ' : '👦 ') + ENFANT.surnom; else o.querySelector('#p-enfant').remove();

    var minuteurs = [], fini = false, lance = false, termine = false, audio = null, voixEnCours = false, rafId = 0, t0Silence = 0, geste = false;
    function plus_tard(ms, f) { minuteurs.push(setTimeout(f, calme ? Math.min(ms, 400) : ms)); }
    function maj(nom, v) { o.classList.toggle(nom, !!v); }

    // ----- fin de la séquence : le bouton « Entrer » apparaît -----
    function pret() {
      if (fini || termine) return; fini = true; o.classList.add('fini');
      var b = o.querySelector('#p-entrer'); b.tabIndex = 0;
      if (!/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) { try { b.focus({ preventScroll: true }); } catch (x) {} }
      window.__portail.etat = 'pret'; window.dispatchEvent(new CustomEvent('ldn:portail-pret'));
    }
    // ----- légendes synchronisées sur la voix (ou sur le temps, sans voix) -----
    function boucle() {
      if (termine) return;
      var t = -1;
      if (voixEnCours && audio) t = audio.ended ? cues.finVoix + 0.01 : audio.currentTime;
      else if (t0Silence) t = (performance.now() - t0Silence) / 1000;
      if (t >= 0) { var e = L.etatSynchro(t, cues); maj('ar', e.ar); maj('fr', e.fr); if (e.fini) pret(); }
      rafId = requestAnimationFrame(boucle);
    }
    // ----- la voix d'accueil (aucun clip validé = aucune voix : l'animation et les légendes se déroulent en silence) -----
    function silencieux() { voixEnCours = false; t0Silence = t0Silence || performance.now(); window.__portail.voix = window.__portail.voix || 'absente'; }
    function lancerVoix(origine) {
      if (termine) return;
      if (!cues.fichier) o.querySelector('#p-reecouter').hidden = true;      // aucune voix en service : rien à réécouter
      if (!cues.fichier || volumeVoix() === 0) { silencieux(); return; }
      if (!audio) {
        audio = new Audio('voix/' + cues.fichier); audio.preload = 'auto';
        audio.addEventListener('error', function () { audio = null; voixEnCours = false; window.__portail.voix = 'absente'; o.querySelector('#p-reecouter').hidden = true; silencieux(); });
        audio.addEventListener('ended', function () { window.__portail.voix = 'finie'; });
      }
      audio.volume = volumeVoix(); try { audio.currentTime = 0; } catch (e) {}
      var p = audio.play();
      var ok = function () { voixEnCours = true; t0Silence = 0; maj('bloque', false); window.__portail.voix = 'joue'; o.querySelector('#p-reecouter').classList.remove('attire'); };
      if (p && p.then) p.then(ok).catch(function () {
        if (origine === 'reecoute') return;
        maj('bloque', true); window.__portail.voix = 'bloquee';       // refus du navigateur : un premier toucher lancera la voix
        plus_tard(4500, function () { if (!voixEnCours && !termine) { maj('bloque', false); o.querySelector('#p-reecouter').classList.add('attire'); silencieux(); } });
      }); else ok();
    }

    // ----- sortie (identique à l'ancienne : fondu + zoom), et le village apparaît dessous -----
    function terminer(origine) {
      if (termine) return; termine = true;
      minuteurs.forEach(clearTimeout); cancelAnimationFrame(rafId);
      try { speechSynthesis.cancel(); } catch (e) {}
      if (audio) { try { audio.pause(); } catch (e) {} }
      window.__portail.actif = false; window.__portail.etat = 'sorti';
      o.classList.add('fin');
      window.dispatchEvent(new CustomEvent('ldn:portail-fin', { detail: { origine: origine } }));
      setTimeout(function () { o.remove(); st.remove(); }, 1500);
      if (forcer && history.replaceState) {
        history.replaceState(history.state, '', location.pathname + location.search.replace(/[?&](ouverture|portail)=1\b/, '').replace(/^&/, '?') + location.hash);
      }
    }

    // ----- la séquence de l'ancienne ouverture : lanternes une à une, porte, salut + voix -----
    function ouvrir() {
      if (lance || termine) return; lance = true;
      o.classList.add('joue');
      var lanternes = o.querySelectorAll('.ouv-l');
      var ordre = [3, 2, 4, 1, 5, 0, 6]; // du centre vers les côtés
      ordre.forEach(function (n, k) { plus_tard(300 + k * 260, function () { lanternes[n].classList.add('allumee'); }); });
      plus_tard(2200, function () { o.classList.add('ouverte'); });
      plus_tard(2700, function () { o.classList.add('salue'); lancerVoix('auto'); });
      window.__portail.etat = 'sequence';
    }

    o.querySelector('#ouv-porte').addEventListener('click', function () { geste = true; ouvrir(); });
    o.querySelector('#ouv-passer').addEventListener('click', function () { terminer('passer'); });
    o.querySelector('#p-entrer').addEventListener('click', function () { terminer('entrer'); });
    o.querySelector('#p-reecouter').addEventListener('click', function () { geste = true; lancerVoix('reecoute'); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') terminer('passer'); });
    addEventListener('pagehide', function () { if (audio) try { audio.pause(); } catch (x) {} });
    document.addEventListener('visibilitychange', function () { if (audio && document.hidden) try { audio.pause(); } catch (x) {} });
    // Premier toucher n'importe où : débloque la voix si le navigateur l'avait refusée (jamais deux lectures automatiques)
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (n) {
      addEventListener(n, function (ev) {
        if (termine || !window.__portail || window.__portail.voix !== 'bloquee' || geste) return;
        if (ev.target && ev.target.closest && ev.target.closest('#ouv-passer,#p-reecouter')) return;
        geste = true; lancerVoix('geste');
      }, { passive: true, capture: true });
    });
    o.querySelector('#ouv-porte').focus({ preventScroll: true });
    requestAnimationFrame(boucle);

    // ----- départ : automatique si le navigateur autorise le son, sinon l'enfant touche la porte (comme dans l'ancienne version) -----
    try { fetch('voix/accueil-portail.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && j.fichier && j.finVoix) cues = { coupe: j.coupe, finVoix: j.finVoix, fichier: j.fichier }; }).catch(function () {}); } catch (e) {}
    function autoriseLeSon() {
      return new Promise(function (res) {
        if (volumeVoix() === 0 || calme) return res(true);
        try { var a = new Audio(SILENCE); a.volume = 0; var p = a.play(); if (p && p.then) p.then(function () { res(true); }).catch(function () { res(false); }); else res(true); } catch (e) { res(true); }
      });
    }
    autoriseLeSon().then(function (permis) {
      if (termine) return;
      o.classList.remove('sonde');
      if (permis) { o.classList.add('auto'); plus_tard(900, ouvrir); }          // lecture automatique possible : la séquence démarre toute seule
      else { window.__portail.voix = 'toucher'; }                               // sinon l'invitation « Touche la porte pour entrer » reste affichée
    });
  }
  if (document.body) demarrer(); else addEventListener('DOMContentLoaded', demarrer);
})();
