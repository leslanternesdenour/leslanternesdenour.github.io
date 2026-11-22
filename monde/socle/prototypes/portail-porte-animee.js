// PROTOTYPE CONSERVÉ (non référencé) : portail à porte en bois de palmier, rayons et particules, créé le 22/11/2026 puis écarté par le client
// au profit de l'ancienne « ouverture magique » aux lanternes (monde/socle/ouverture.js), restaurée dans monde/socle/portail.js.
// Portail d'entrée du Monde de Nour.
// À chaque NOUVELLE session de jeu (nouvelle ouverture, nouvelle connexion, nouvel enfant choisi) — jamais à chaque page ni au
// retour d'un mini-jeu : le portail apparaît, s'illumine, la maîtresse-narratrice accueille l'enfant (« مَرْحَبًا ! Bienvenue dans le
// Monde de Nour ! »), les portes s'ouvrent au rythme de sa voix, puis le bouton « Entrer dans le Monde de Nour » apparaît.
// Aucun instrument de musique : seulement la voix (volume = réglage « voix » du village). Jamais de synthèse vocale pour l'arabe.
// Les règles (quand l'afficher, synchronisation voix/portes, profil enfant) sont dans portail-logique.js, testées sous Node.
// Ancienne « ouverture magique » (ouverture.js) : conservée dans le dépôt, remplacée par ce portail.
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
  var mobile = matchMedia('(max-width: 700px), (pointer: coarse)').matches;
  var cues = { coupe: 1.12, finVoix: 3.26, duree: 3.63 };

  var css = `
#portail{position:fixed;inset:0;z-index:9999;overflow:hidden;color:#fff;font-family:Nunito,system-ui,sans-serif;
  --portes:0;--lum:.35;--w:min(350px,60vw,37vh);
  background:linear-gradient(180deg,#0b0828 0%,#191345 38%,#3a2a6d 68%,#8a4d4a 88%,#d98a52 100%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2.2vh;
  opacity:0;transition:opacity 1.2s ease}
#portail.arrive{opacity:1}
#portail.sortie{opacity:0;pointer-events:none;transition:opacity 1.3s ease .15s}
#portail *{box-sizing:border-box}
#p-ciel{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.p-lune{position:absolute;top:9%;left:12%;width:clamp(34px,7vw,64px);aspect-ratio:1;border-radius:50%;
  box-shadow:inset -14px 6px 0 0 #fff3c9;filter:drop-shadow(0 0 14px rgba(255,236,170,.65));transform:rotate(-18deg);opacity:.92}
.p-dunes{position:absolute;left:0;right:0;bottom:0;height:34%;pointer-events:none}
.p-dunes svg{width:100%;height:100%;display:block}
.p-scene{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;transform-origin:50% 55%;
  transform:scale(.9);opacity:0;transition:transform 1.8s cubic-bezier(.2,.7,.2,1),opacity 1.6s ease}
#portail.arrive .p-scene{transform:scale(1);opacity:1}
#portail.sortie .p-scene{transform:scale(3.4);opacity:1;transition:transform 1.4s cubic-bezier(.65,0,.3,1)}
.p-rayons{position:absolute;left:50%;top:44%;width:calc(var(--w)*4.2);aspect-ratio:1;transform:translate(-50%,-50%);pointer-events:none;border-radius:50%;
  background:repeating-conic-gradient(from 0deg,rgba(255,226,150,.5) 0deg 5deg,rgba(255,226,150,0) 5deg 15deg);
  -webkit-mask-image:radial-gradient(circle,#000 0%,rgba(0,0,0,.55) 22%,transparent 62%);mask-image:radial-gradient(circle,#000 0%,rgba(0,0,0,.55) 22%,transparent 62%);
  opacity:calc((var(--lum) - .3) * 1.2);animation:p-tourne 90s linear infinite}
@keyframes p-tourne{to{transform:translate(-50%,-50%) rotate(360deg)}}
.p-halo{position:absolute;left:50%;top:44%;width:calc(var(--w)*2.3);aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,rgba(255,214,120,.85) 0%,rgba(255,190,80,.38) 30%,rgba(255,170,60,0) 64%);opacity:var(--lum);animation:p-respire 3.2s ease-in-out infinite}
@keyframes p-respire{0%,100%{transform:translate(-50%,-50%) scale(.96)}50%{transform:translate(-50%,-50%) scale(1.06)}}
.p-portail{position:relative;width:var(--w);height:calc(var(--w)*1.4)}
.p-cadre{position:absolute;inset:0;border-radius:var(--w) var(--w) 8px 8px / calc(var(--w)*.5) calc(var(--w)*.5) 8px 8px;
  background:linear-gradient(90deg,rgba(0,0,0,.18),rgba(255,255,255,.07) 20%,rgba(0,0,0,.05) 80%,rgba(0,0,0,.22)),
    repeating-linear-gradient(0deg,rgba(90,55,25,.34) 0 2px,transparent 2px calc(var(--w)*.085)),
    repeating-linear-gradient(90deg,rgba(90,55,25,.18) 0 2px,transparent 2px calc(var(--w)*.17)),
    linear-gradient(#d7b27a,#b98a55);
  box-shadow:0 0 calc(18px + 60px*var(--lum)) rgba(255,190,80,calc(.18 + .5*var(--lum))),inset 0 0 22px rgba(60,35,12,.55)}
.p-cadre::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;padding:3px;
  background:conic-gradient(from var(--ang,0deg),rgba(255,236,170,0),rgba(255,236,170,.95) 12%,rgba(255,236,170,0) 28%,rgba(255,236,170,0));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);
  opacity:calc(var(--lum) * 1.1);animation:p-fait 5s linear infinite}
@property --ang{syntax:'<angle>';initial-value:0deg;inherits:false}
@keyframes p-fait{to{--ang:360deg}}
.p-baie{position:absolute;left:7%;right:7%;top:5.5%;bottom:0;border-radius:var(--w) var(--w) 0 0 / calc(var(--w)*.44) calc(var(--w)*.44) 0 0;overflow:hidden;perspective:calc(var(--w)*3);background:#1c1236}
.p-fond{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 70%,#fff8e0 0%,#ffe29a 30%,#f7b955 62%,#c9772e 100%);opacity:calc(.25 + .75*var(--lum))}
.p-fond svg{position:absolute;left:0;right:0;bottom:0;width:100%;height:56%;opacity:.85}
.p-battant{position:absolute;top:0;bottom:0;width:50%;will-change:transform;backface-visibility:hidden}
.p-battant svg{display:block;width:100%;height:100%}
.p-battant.g{left:0;transform-origin:0 50%;transform:rotateY(calc(var(--portes) * 102deg))}
.p-battant.d{right:0;transform-origin:100% 50%;transform:rotateY(calc(var(--portes) * -102deg))}
.p-battant.d svg{transform:scaleX(-1)}
.p-battant::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.55),rgba(0,0,0,0) 60%);opacity:calc(var(--portes) * .9);pointer-events:none}
.p-battant.d::after{background:linear-gradient(270deg,rgba(0,0,0,.55),rgba(0,0,0,0) 60%)}
.p-lampe{position:absolute;top:34%;width:calc(var(--w)*.17);transform-origin:50% 0;animation:p-balance 4s ease-in-out infinite}
.p-lampe.g{left:calc(var(--w)*-.27)}.p-lampe.d{right:calc(var(--w)*-.27);animation-delay:-1.6s}
.p-lampe svg{display:block;width:100%;height:auto;filter:drop-shadow(0 0 8px rgba(255,200,90,.95)) drop-shadow(0 0 22px rgba(255,170,60,.65));animation:p-flamme 1.7s ease-in-out infinite}
@keyframes p-balance{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
@keyframes p-flamme{0%,100%{opacity:.88}30%{opacity:1}60%{opacity:.8}}
.p-legendes{position:relative;z-index:2;text-align:center;min-height:calc(var(--w)*.62);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:0 14px}
.p-ar{margin:0;font:700 clamp(40px,10.5vw,70px)/1.25 "Amiri","Scheherazade New","Noto Naskh Arabic",serif;color:#fff3c9;text-shadow:0 2px 20px rgba(245,185,66,.85),0 0 2px #7a4e00;
  opacity:0;transform:translateY(10px);transition:opacity .7s ease,transform .7s ease}
.p-fr{margin:0;text-wrap:balance;max-width:94vw;font:800 clamp(16px,4.3vw,26px) Poppins,Nunito,system-ui,sans-serif;color:#191345;background:rgba(255,246,216,.94);padding:7px 20px;border-radius:999px;
  opacity:0;transform:translateY(10px);transition:opacity .8s ease,transform .8s ease}
#portail.ar .p-ar,#portail.fr .p-fr{opacity:1;transform:none}
.p-entrer{position:relative;z-index:3;border:0;cursor:pointer;font:800 clamp(14px,3.8vw,22px) Poppins,Nunito,system-ui,sans-serif;color:#2b1a00;padding:15px 24px;border-radius:999px;
  background:linear-gradient(#ffe08a,#f5b942);box-shadow:0 6px 0 #b9780e,0 0 28px rgba(255,200,90,.8);text-transform:uppercase;letter-spacing:0;text-wrap:balance;
  opacity:0;transform:translateY(14px) scale(.96);pointer-events:none;transition:opacity .8s ease,transform .8s ease;max-width:92vw}
#portail.fini .p-entrer{opacity:1;transform:none;pointer-events:auto;animation:p-bouton 2.2s ease-in-out .9s infinite}
@keyframes p-bouton{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
.p-entrer:focus-visible,.p-barre button:focus-visible{outline:4px solid #fff;outline-offset:4px}
.p-barre{position:absolute;z-index:4;top:max(12px,env(safe-area-inset-top));left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;gap:8px}
.p-barre button{border:2px solid rgba(255,227,163,.6);background:rgba(25,19,69,.62);color:#ffe3a3;font:700 16px Nunito,system-ui,sans-serif;padding:10px 16px;border-radius:999px;cursor:pointer;min-height:44px}
#p-reecouter.attire{animation:p-bouton 1.6s ease-in-out infinite;border-color:#ffe3a3}
.p-enfant{position:absolute;z-index:4;left:50%;transform:translateX(-50%);bottom:max(14px,env(safe-area-inset-bottom));background:rgba(25,19,69,.62);color:#fff6d8;font:700 15px Nunito,system-ui,sans-serif;padding:7px 16px;border-radius:999px}
.p-aide{position:absolute;z-index:4;left:0;right:0;bottom:calc(max(14px,env(safe-area-inset-bottom)) + 44px);text-align:center;margin:0;font:700 clamp(15px,4vw,19px) Nunito,system-ui,sans-serif;color:#ffe3a3;opacity:0;transition:opacity .6s ease;pointer-events:none}
#portail.bloque .p-aide{opacity:1;animation:p-bouton 1.8s ease-in-out infinite}
.p-eclat{position:absolute;inset:0;z-index:5;background:radial-gradient(circle at 50% 46%,#fff8dc 0%,#ffe29a 38%,rgba(255,226,154,0) 78%);opacity:0;pointer-events:none}
#portail.sortie .p-eclat{opacity:1;transition:opacity .7s ease .35s}
@media (prefers-reduced-motion:reduce){
  #portail,#portail.sortie{transition-duration:.35s}
  .p-scene,#portail.arrive .p-scene,#portail.sortie .p-scene{transform:none;transition:none}
  .p-rayons,.p-halo,.p-lampe,.p-lampe svg,.p-cadre::before,#portail.fini .p-entrer{animation:none}
}
@media (max-height:520px){#portail{--w:min(220px,40vw,38vh)}.p-legendes{min-height:0}}
`;

  function lampeSVG() {
    return '<svg viewBox="0 0 26 44" aria-hidden="true"><path d="M13 0v6" stroke="#6b4a1a" stroke-width="1.6"/>' +
      '<path d="M6.5 7.5h13l-2.2 4.5H8.7z" fill="#a8741f"/><path d="M8 12h10c3.4 4.4 3.4 16 0 20.5H8c-3.4-4.5-3.4-16.100 0-20.500z" fill="#ffd35f" stroke="#a8741f" stroke-width="1.4"/>' +
      '<path d="M13 13v18M9.800 13c-1.700 5.500-1.700 12.500 0 18M16.200 13c1.700 5.500 1.700 12.500 0 18" stroke="#a8741f" stroke-width=".9" fill="none"/>' +
      '<ellipse cx="13" cy="22.500" rx="3.200" ry="5" fill="#fff8dc"/><path d="M7.500 32.500h11l-1.700 4h-7.600z" fill="#a8741f"/><circle cx="13" cy="39" r="2" fill="#a8741f"/></svg>';
  }
  // Un battant : planches de bois de palmier, sangles de bronze cloutées, médaillon à huit branches, anneau.
  function battantSVG() {
    var planches = '', clous = '';
    var tons = ['#7b4f29', '#6c4322', '#835630', '#70472a'];
    for (var i = 0; i < 4; i++) planches += '<rect x="' + (i * 30) + '" y="0" width="30" height="320" fill="' + tons[i] + '"/><path d="M' + (i * 30 + 15) + ' 0V320" stroke="#4a2c14" stroke-width=".7" opacity=".6"/>';
    for (var y of [92, 232]) {
      for (var x = 8; x < 120; x += 16) clous += '<circle cx="' + x + '" cy="' + y + '" r="2.6" fill="#e2bb62" stroke="#7c5410" stroke-width=".7"/>';
    }
    return '<svg viewBox="0 0 120 320" preserveAspectRatio="none" aria-hidden="true">' + planches +
      '<rect y="84" width="120" height="16" fill="#8f6a2d"/><rect y="84" width="120" height="3" fill="#c79b49" opacity=".75"/>' +
      '<rect y="224" width="120" height="16" fill="#8f6a2d"/><rect y="224" width="120" height="3" fill="#c79b49" opacity=".75"/>' + clous +
      '<g transform="translate(78 162)"><path d="M0-27L7.500-8 27 0 7.500 8 0 27-7.500 8-27 0-7.500-8z" fill="#e8b84a" stroke="#7c5410" stroke-width="1.500"/>' +
      '<path d="M0-27L7.500-8 27 0 7.500 8 0 27-7.500 8-27 0-7.500-8z" transform="rotate(45)" fill="#d9a53a" stroke="#7c5410" stroke-width="1.200" opacity=".9"/><circle r="7" fill="#fff0b8" stroke="#7c5410" stroke-width="1"/></g>' +
      '<g transform="translate(106 192)"><circle r="9" fill="none" stroke="#e2bb62" stroke-width="3.200"/><circle r="9" fill="none" stroke="#7c5410" stroke-width=".8"/><circle cy="-9" r="3" fill="#e2bb62" stroke="#7c5410" stroke-width=".8"/></g>' +
      '<rect width="120" height="320" fill="none" stroke="#3b2210" stroke-width="3"/></svg>';
  }
  // Ce qu'on devine derrière les portes : le village de Nour (maisons en brique crue, palmiers, lanternes).
  function villageSVG() {
    return '<svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g fill="#7a4a2a">' +
      '<path d="M0 110V82h22V70h30v14h14V76h26V62h34v22h20V72h38v38z"/>' +
      '<path d="M18 82V64a8 8 0 0116 0v18zM98 84V66a9 9 0 0118 0v18z" fill="#5a3320"/></g>' +
      '<g stroke="#5a3a1c" stroke-width="3" fill="none"><path d="M168 110V70M168 70c-10-4-18-1-24 6M168 70c10-4 18-1 24 6M168 70c-4-9-2-17 4-22M168 70c4-9 2-17-4-22"/></g>' +
      '<g fill="#ffd35f"><circle cx="40" cy="92" r="2.200"/><circle cx="106" cy="90" r="2.200"/><circle cx="140" cy="94" r="2.200"/></g></svg>';
  }
  function dunesSVG() {
    var palmier = function (x, h, s) {
      var haut = 120 - h;   // sommet du tronc
      return '<g transform="translate(' + x + ' 0) scale(' + s + ')" stroke="#150d33" fill="none" stroke-linecap="round">' +
        '<path d="M0 120C4 100 2 ' + (haut + 24) + ' -2 ' + haut + '" stroke-width="5"/>' +
        '<g transform="translate(-2 ' + haut + ')" stroke-width="3.2"><path d="M0 0C-16-10-32-6-42 6M0 0C16-10 32-6 42 6M0 0C-10-18-26-22-36-14M0 0C10-18 26-22 36-14M0 0C0-16 0-24 0-30"/></g></g>';
    };
    return '<svg viewBox="0 0 400 130" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0 130V70C50 50 110 62 170 76S300 84 400 60V130z" fill="#3a2060" opacity=".95"/>' +
      '<path d="M0 130V92C70 76 140 96 220 90S340 74 400 88V130z" fill="#241446"/>' +
      palmier(52, 70, 1) + palmier(348, 64, .9) + '</svg>';
  }

  function demarrer() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var o = document.createElement('div');
    o.id = 'portail'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', 'Portail du Monde de Nour');
    var chip = '';
    if (ENFANT && ENFANT.surnom) chip = '<div class="p-enfant" id="p-enfant"></div>';
    o.innerHTML =
      '<canvas id="p-ciel" aria-hidden="true"></canvas><div class="p-lune" aria-hidden="true"></div><div class="p-dunes" aria-hidden="true">' + dunesSVG() + '</div>' +
      '<div class="p-scene"><div class="p-rayons" aria-hidden="true"></div><div class="p-halo" aria-hidden="true"></div>' +
      '<div class="p-portail"><div class="p-cadre"></div>' +
      '<div class="p-baie"><div class="p-fond">' + villageSVG() + '</div><div class="p-battant g">' + battantSVG() + '</div><div class="p-battant d">' + battantSVG() + '</div></div>' +
      '<div class="p-lampe g" aria-hidden="true">' + lampeSVG() + '</div><div class="p-lampe d" aria-hidden="true">' + lampeSVG() + '</div></div></div>' +
      '<div class="p-legendes" aria-live="polite"><p class="p-ar" lang="ar" dir="rtl">مَرْحَبًا !</p><p class="p-fr" lang="fr">Bienvenue dans le Monde de Nour !</p></div>' +
      '<button type="button" class="p-entrer" id="p-entrer" tabindex="-1">Entrer dans le Monde de Nour</button>' +
      '<div class="p-barre"><button type="button" id="p-reecouter" aria-label="Réécouter l\'accueil">🔊 Réécouter l’accueil</button><button type="button" id="p-passer">Passer ⏭</button></div>' +
      '<p class="p-aide" id="p-aide">🔊 Touche l’écran pour écouter</p>' + chip + '<div class="p-eclat" aria-hidden="true"></div>';
    document.body.appendChild(o);
    if (ENFANT && ENFANT.surnom) { var c = o.querySelector('#p-enfant'); c.textContent = (ENFANT.avatar === 'fille' ? '👧 ' : '👦 ') + ENFANT.surnom; }
    requestAnimationFrame(function () { requestAnimationFrame(function () { o.classList.add('arrive'); }); });

    // ---------- synchronisation de l'animation sur la voix ----------
    var audio = null, mode = 'attente', t0 = 0, termine = false, sorti = false, fini = false, bloque = false, geste = false, portesMax = 0, tAudio = -1;
    try { fetch('voix/accueil-portail.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && j.finVoix) cues = { coupe: j.coupe, finVoix: j.finVoix, duree: j.duree }; }).catch(function () {}); } catch (e) {}
    function volume() {
      try { var s = JSON.parse(localStorage.getItem('monde') || '{}'); if (s.sons && typeof s.sons.voix === 'number') return Math.max(0, Math.min(1, s.sons.voix)); } catch (e) {}
      return 1;
    }
    function maj(nom, v) { o.classList.toggle(nom, !!v); }
    function appliquer(e) {
      portesMax = Math.max(portesMax, e.portes);                      // les portes ne se referment jamais (même en réécoutant)
      o.style.setProperty('--portes', portesMax.toFixed(4));
      o.style.setProperty('--lum', Math.max(e.lumiere, 0.35 + 0.65 * portesMax).toFixed(4));
      maj('ar', e.ar); maj('fr', e.fr);
      if (e.fini && !fini) { fini = true; o.classList.add('fini'); var b = o.querySelector('#p-entrer'); b.tabIndex = 0; if (!mobile) { try { b.focus({ preventScroll: true }); } catch (x) {} } window.__portail.etat = 'pret'; window.dispatchEvent(new CustomEvent('ldn:portail-pret')); }
    }
    function temps() {
      if (mode === 'voix' && audio) return audio.ended ? cues.finVoix + 0.01 : audio.currentTime;
      if (mode === 'minuteur') return (performance.now() - t0) / 1000;
      return -1;
    }
    var raf = 0;
    function boucle() {
      if (sorti) return;
      var t = temps(); appliquer(L.etatSynchro(t, cues));
      raf = requestAnimationFrame(boucle);
    }
    function minuteur(dureeS) {               // sans voix (volume coupé, fichier absent, lecture refusée) : mêmes portes, au même rythme
      if (mode === 'voix' || mode === 'minuteur') return;
      mode = 'minuteur'; t0 = performance.now();
      cues = { coupe: cues.coupe, finVoix: dureeS || cues.finVoix, duree: cues.duree };
    }
    function lancerVoix(origine) {
      if (sorti) return;
      if (origine !== 'reecoute' && (mode === 'voix' || mode === 'minuteur')) return;       // une seule lecture automatique
      var v = volume();
      if (v === 0) { minuteur(3.26); return; }
      if (!audio) {
        audio = new Audio('voix/accueil-portail.mp3'); audio.preload = 'auto';
        audio.addEventListener('error', function () { audio = null; window.__portail.voix = 'absente'; o.querySelector('#p-reecouter').hidden = true; minuteur(3.26); });
        audio.addEventListener('ended', function () { window.__portail.voix = 'finie'; });
      }
      audio.volume = v; try { audio.currentTime = 0; } catch (e) {}
      var p = audio.play();
      var ok = function () { mode = 'voix'; bloque = false; maj('bloque', false); window.__portail.voix = 'joue'; o.querySelector('#p-reecouter').classList.remove('attire'); };
      if (p && p.then) p.then(ok).catch(function () {
        if (origine === 'auto') {                                      // lecture automatique refusée par le navigateur : on attend le premier toucher
          bloque = true; maj('bloque', true); window.__portail.voix = 'bloquee';
          setTimeout(function () { if (mode === 'attente' && !sorti) { maj('bloque', false); o.querySelector('#p-reecouter').classList.add('attire'); minuteur(3.26); } }, 4500);
        }
      }); else ok();
    }
    // Premier toucher / première touche : débloque le son si le navigateur l'avait refusé (jamais deux lectures)
    function surGeste(ev) {
      if (geste || sorti) return;
      if (ev.target && ev.target.closest && ev.target.closest('.p-barre')) return;
      if (mode === 'attente') { geste = true; lancerVoix('geste'); }
    }
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (n) { addEventListener(n, surGeste, { passive: true, capture: true }); });

    // ---------- sortie : transition vers le Monde de Nour ----------
    function sortir(origine) {
      if (sorti) return; sorti = true; cancelAnimationFrame(raf);
      if (audio) { try { audio.pause(); } catch (e) {} }
      window.__portail.actif = false; window.__portail.etat = 'sorti';
      o.classList.add('sortie');
      // Le village apparaît DÈS le toucher (le toucher débloque aussi le son du village) pendant que la lumière emporte le portail.
      window.dispatchEvent(new CustomEvent('ldn:portail-fin', { detail: { origine: origine } }));
      setTimeout(function () { o.remove(); st.remove(); }, calme ? 450 : 1700);
    }
    o.querySelector('#p-entrer').addEventListener('click', function () { sortir('entrer'); });
    o.querySelector('#p-passer').addEventListener('click', function () { sortir('passer'); });
    o.querySelector('#p-reecouter').addEventListener('click', function () { geste = true; lancerVoix('reecoute'); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') sortir('passer'); });
    addEventListener('pagehide', function () { if (audio) try { audio.pause(); } catch (e) {} });
    document.addEventListener('visibilitychange', function () { if (audio && document.hidden) try { audio.pause(); } catch (e) {} });

    // ---------- ciel étoilé et particules de lumière (canvas léger) ----------
    var cv = o.querySelector('#p-ciel'), cx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 1.5), etoiles = [], motes = [];
    var sprite = document.createElement('canvas'); sprite.width = sprite.height = 32;
    var sc = sprite.getContext('2d'), g = sc.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,244,200,1)'); g.addColorStop(.4, 'rgba(255,214,120,.55)'); g.addColorStop(1, 'rgba(255,190,80,0)'); sc.fillStyle = g; sc.fillRect(0, 0, 32, 32);
    function mesurer() {
      W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      etoiles = []; var n = mobile ? 70 : 130; for (var i = 0; i < n; i++) etoiles.push({ x: Math.random() * W, y: Math.random() * H * .62, r: Math.random() * 1.3 + .3, p: Math.random() * 6.28, v: .6 + Math.random() * 1.6 });
    }
    function nouvelleMote(r, bas) {
      var b = o.querySelector('.p-baie').getBoundingClientRect(), x = b.left + b.width * (.5 + (Math.random() - .5) * 1.5), y = b.top + b.height * (bas ? 1 : Math.random());
      return { x: x, y: y, vx: (Math.random() - .5) * 10, vy: -(10 + Math.random() * 26), r: 4 + Math.random() * 9, p: Math.random() * 6.28, vie: 0, dure: 3.5 + Math.random() * 4 };
    }
    var dernier = performance.now();
    function dessiner(now) {
      if (sorti) return; requestAnimationFrame(dessiner);
      var dt = Math.min(0.05, (now - dernier) / 1000); dernier = now; if (document.hidden) return;
      var lum = parseFloat(o.style.getPropertyValue('--lum')) || .35;
      cx.clearRect(0, 0, W, H);
      for (var i = 0; i < etoiles.length; i++) { var s = etoiles[i]; s.p += s.v * dt; cx.globalAlpha = (.35 + .65 * Math.abs(Math.sin(s.p))) * .9; cx.fillStyle = '#fff6d8'; cx.fillRect(s.x, s.y, s.r, s.r); }
      cx.globalCompositeOperation = 'lighter';
      var voulues = Math.round((mobile ? 22 : 44) * (calme ? .3 : (.35 + .65 * lum)));
      while (motes.length < voulues) motes.push(nouvelleMote(0, false));
      for (var k = motes.length - 1; k >= 0; k--) {
        var m = motes[k]; m.vie += dt; m.p += dt * 2; if (!calme) { m.x += (m.vx + Math.sin(m.p) * 8) * dt; m.y += m.vy * dt; }
        var a = Math.sin(Math.min(1, m.vie / m.dure) * Math.PI); if (m.vie > m.dure || m.y < -20) { if (motes.length > voulues) motes.splice(k, 1); else motes[k] = nouvelleMote(0, true); continue; }
        cx.globalAlpha = a * (.25 + .75 * lum); cx.drawImage(sprite, m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
      }
      cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
    }
    mesurer(); addEventListener('resize', mesurer);
    requestAnimationFrame(dessiner); boucle();

    // ---------- séquence : apparition → illumination → voix → portes → bouton ----------
    setTimeout(function () { lancerVoix('auto'); }, calme ? 700 : 1700);
  }
  if (document.body) demarrer(); else addEventListener('DOMContentLoaded', demarrer);
})();
