// Ouverture magique du Monde des Lanternes.
// Se joue à la première visite (ou avec ?ouverture=1, par exemple après la connexion).
// L'enfant touche la porte : lumière dorée, lanternes qui s'allument, porte qui s'ouvre,
// « Ahlan wa sahlan » à voix haute, puis la carte apparaît. Environ 7 secondes, bouton « Passer ».
// Aucun instrument : seulement la voix. Le volume suit le réglage « voix » du village.
(function () {
  var CLE = 'ldn_ouverture_vue';
  var demande = /[?&]ouverture=1\b/.test(location.search);
  var dejaVue = false;
  try { dejaVue = localStorage.getItem(CLE) === '1'; } catch (e) {}
  if (!demande && dejaVue) return;

  var calme = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  function demarrer() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var o = document.createElement('div');
    o.id = 'ouverture';
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-label', 'Ouverture du Monde des Lanternes');
    var positions = [4, 18, 32, 50, 68, 82, 96]; // en % de la largeur
    var hauts = [34, 16, 6, 0, 6, 16, 34];
    var l = '';
    for (var i = 0; i < positions.length; i++) {
      l += '<div class="ouv-l" style="left:calc(' + positions[i] + '% - 17px);top:' + hauts[i] + 'px;animation-delay:-' + (i * .4) + 's">' + lanterneSVG() + '</div>';
    }
    o.innerHTML =
      '<div id="ouv-lueur" aria-hidden="true"></div>' +
      '<button id="ouv-passer" type="button">Passer ⏭</button>' +
      '<div id="ouv-lanternes" aria-hidden="true">' + l + '</div>' +
      '<button id="ouv-porte" type="button" aria-label="Ouvrir la porte du Monde des Lanternes">' +
      '<span class="ouv-cadre"></span><span class="ouv-fond"></span>' +
      '<span class="ouv-battant g">' + battant('g') + '</span><span class="ouv-battant d">' + battant('d') + '</span></button>' +
      '<p id="ouv-invite">✨ Touche la porte pour entrer ✨</p>' +
      '<p id="ouv-salut" aria-live="polite"><span class="ar" lang="ar" dir="rtl">أَهْلًا وَسَهْلًا</span>' +
      '<span class="fr">Ahlan wa sahlan, bienvenue !</span></p>';
    document.body.appendChild(o);

    var minuteurs = [];
    var fini = false;
    function plus_tard(ms, f) { minuteurs.push(setTimeout(f, calme ? Math.min(ms, 400) : ms)); }

    function terminer() {
      if (fini) return; fini = true;
      minuteurs.forEach(clearTimeout);
      try { localStorage.setItem(CLE, '1'); } catch (e) {}
      try { speechSynthesis.cancel(); } catch (e) {}
      if (voixAudio) { try { voixAudio.pause(); } catch (e) {} }
      o.classList.add('fin');
      setTimeout(function () { o.remove(); st.remove(); }, 1500);
      if (demande && history.replaceState) {
        history.replaceState(history.state, '', location.pathname + location.search.replace(/[?&]ouverture=1\b/, '').replace(/^&/, '?') + location.hash);
      }
    }

    function volumeVoix() {
      try {
        var s = JSON.parse(localStorage.getItem('monde') || '{}');
        if (s.sons && typeof s.sons.voix === 'number') return Math.max(0, Math.min(1, s.sons.voix));
      } catch (e) {}
      return 1;
    }

    var voixAudio = null;
    function parler() {
      var v = volumeVoix();
      if (v === 0) return;
      // Voix enregistrée si elle existe (voix/ahlan.mp3), sinon la voix arabe de l'appareil.
      voixAudio = new Audio('voix/ahlan.mp3');
      voixAudio.volume = v;
      voixAudio.onerror = function () { voixAudio = null; synthese(v); };
      voixAudio.play().catch(function () { voixAudio = null; synthese(v); });
    }
    function synthese(v) {
      if (!('speechSynthesis' in window)) return;
      var voix = speechSynthesis.getVoices().filter(function (x) { return /^ar/i.test(x.lang); });
      if (!voix.length) return; // pas de voix arabe sur l'appareil : on reste silencieux
      var u = new SpeechSynthesisUtterance('أَهْلًا وَسَهْلًا');
      u.lang = voix[0].lang; u.voice = voix[0]; u.rate = .85; u.volume = v;
      speechSynthesis.speak(u);
    }

    function ouvrir() {
      if (o.classList.contains('joue')) return;
      o.classList.add('joue');
      try { speechSynthesis.getVoices(); } catch (e) {}
      var lanternes = o.querySelectorAll('.ouv-l');
      var ordre = [3, 2, 4, 1, 5, 0, 6]; // du centre vers les côtés
      ordre.forEach(function (n, k) { plus_tard(300 + k * 260, function () { lanternes[n].classList.add('allumee'); }); });
      plus_tard(2200, function () { o.classList.add('ouverte'); });
      plus_tard(2700, function () { o.classList.add('salue'); parler(); });
      plus_tard(6200, terminer);
    }

    o.querySelector('#ouv-porte').addEventListener('click', ouvrir);
    o.querySelector('#ouv-passer').addEventListener('click', terminer);
    addEventListener('keydown', function (e) { if (e.key === 'Escape') terminer(); });
    o.querySelector('#ouv-porte').focus({ preventScroll: true });
  }

  if (document.body) demarrer(); else addEventListener('DOMContentLoaded', demarrer);
})();
