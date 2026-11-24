/* Les Lanternes de Nour — barre « compte » commune à toutes les pages publiques.
   Visiteur : « Se connecter » et « Créer un compte » toujours visibles (ils renvoient vers /compte/ avec ?retour= : après la connexion,
   l'utilisateur retrouve la page qu'il voulait ouvrir). Connecté : lien « Espace famille » (prénom de l'enfant qui joue) et « Se déconnecter ».
   Ne charge pas Firebase : un seul appel léger à /api/moi (le serveur décide, le navigateur affiche). Si les comptes ne sont pas ouverts
   (réponse 503, site sans serveur) ou si la page est un cadre du village : rien n'est affiché, rien ne change.
   Inclusion : <script src="../compte/barre.js?v=1" defer data-pos="haut-droite"></script> (data-pos : haut-droite, haut-gauche, bas-droite, bas-gauche). */
(function () {
  'use strict';
  if (window.__ldnBarre || window.top !== window) return;
  window.__ldnBarre = 1;
  var s = document.currentScript;
  var pos = (s && s.getAttribute('data-pos')) || 'haut-droite';
  var modeMenu = !!(s && s.getAttribute('data-menu'));      // page de jeu : « Espace famille » et « Se déconnecter » vivent dans le menu Paramètres
  var decalage = parseInt((s && s.getAttribute('data-decalage')) || '0', 10) || 0;    // pixels sous les boutons du haut de la page (ex. le village)
  var base = s ? new URL('./', s.src).href : new URL('/compte/', location.href).href;        // …/compte/
  var racine = new URL('../', base).href;                                                      // racine du site
  var retour = location.pathname + location.search + location.hash;
  var cible = base + '?retour=' + encodeURIComponent(retour);

  function profil() { try { return JSON.parse(localStorage.getItem('ldn_profil_actif') || 'null'); } catch (e) { return null; } }
  function el(tag, cls, txt, href) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; if (href) e.href = href; return e; }

  function css() {
    var st = document.createElement('style'); st.id = 'ldn-compte-css';
    st.textContent = '#ldn-compte{position:fixed;z-index:900;display:flex;flex-wrap:wrap;gap:8px;align-items:center;font:700 15px/1.1 Nunito,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;max-width:calc(100vw - 20px)}' +
      '#ldn-compte.haut-droite{right:max(10px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top));justify-content:flex-end}' +
      '#ldn-compte.haut-gauche{left:max(10px,env(safe-area-inset-left));top:max(10px,env(safe-area-inset-top))}' +
      '#ldn-compte.bas-droite{right:max(10px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom));justify-content:flex-end}' +
      '#ldn-compte.bas-gauche{left:max(10px,env(safe-area-inset-left));bottom:max(10px,env(safe-area-inset-bottom))}' +
      '#ldn-compte a,#ldn-compte button{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px;border-radius:999px;border:2px solid #ffd666;background:rgba(25,19,69,.9);color:#ffd666;text-decoration:none;cursor:pointer;font:inherit;box-shadow:0 2px 10px rgba(0,0,0,.35)}' +
      '#ldn-compte a.p{background:#ffd666;color:#191345}' +
      '#ldn-compte a:hover,#ldn-compte button:hover,#ldn-compte a:focus-visible,#ldn-compte button:focus-visible{outline:3px solid #fff;outline-offset:2px}' +
      '@media (max-width:480px){#ldn-compte{font-size:14px}#ldn-compte a,#ldn-compte button{padding:0 11px;min-height:40px}#ldn-compte a.plus{display:none}}' +
      '@media print{#ldn-compte{display:none}}';
    (document.head || document.documentElement).appendChild(st);
  }

  function afficher(moi) {
    if (document.getElementById('ldn-compte')) return;
    css();
    var aMenu = !!document.querySelector('[data-compte-reglages]');          // la page a un menu Paramètres : tout le compte y vit (visiteur comme parent)
    if (modeMenu && (moi.connecte || aMenu)) return;
    var b = el('div'); b.id = 'ldn-compte'; b.className = pos; b.setAttribute('role', 'navigation'); b.setAttribute('aria-label', 'Compte');
    if (moi.connecte && modeMenu) return;          // rien n'est affiché en permanence : les boutons sont dans les Paramètres
    if (!moi.connecte) {
      b.appendChild(el('a', 'p', '🔑 Se connecter', cible + '#connexion'));
      b.appendChild(el('a', 'plus', 'Créer un compte', cible + '#inscription'));    // sur petit écran : « Se connecter » seul (l'onglet « Créer un compte » est sur la page suivante)
    } else {
      var p = profil();
      b.appendChild(el('a', 'p', (p && p.surnom ? (p.avatar === 'fille' ? '👧 ' : '👦 ') + p.surnom : '👨‍👩‍👧 Espace famille'), base));
      if (p && p.surnom) b.appendChild(el('a', '', 'Espace famille', base));
      var q = el('button', '', 'Se déconnecter'); q.type = 'button';
      q.onclick = function () {
        q.disabled = true;
        import(base + 'client.js?v=2').then(function (C) { return C.deconnexion(); }).catch(function () {}).then(function () { location.reload(); });
      };
      b.appendChild(q);
    }
    if (decalage && /^haut/.test(pos)) b.style.top = 'calc(max(10px, env(safe-area-inset-top)) + ' + decalage + 'px)';
    document.body.appendChild(b);
  }

  // Section « Compte » (visiteur : Se connecter / Créer un compte ; connecté : profil, Espace famille, Se déconnecter), tout en bas d'un menu Paramètres : <div data-compte-reglages></div>
  function sectionMenu(moi) {
    var cont = document.querySelectorAll('[data-compte-reglages]');
    if (!cont.length) return;
    var st = document.getElementById('ldn-compte-css2');
    if (!st) { st = document.createElement('style'); st.id = 'ldn-compte-css2';
      st.textContent = '.ldn-cs-section{display:flex;flex-direction:column;gap:16px;margin-top:32px;padding-top:20px;border-top:2px solid rgba(29,111,122,.35)}' +
        '.ldn-cs-section .ldn-cs-t{margin:0;font:800 15px/1.2 Nunito,system-ui,sans-serif;color:#1d6f7a;text-transform:uppercase;letter-spacing:.04em}' +
        '.ldn-cs-section .ldn-cs-p{margin:0;font:700 14px/1.3 Nunito,system-ui,sans-serif;color:#5a4a30}' +
        '.ldn-cs-section a,.ldn-cs-section button{display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 16px;border-radius:14px;border:2px solid #1d8f9c;background:#fff;color:#1d3a5e;font:800 16px/1 Nunito,system-ui,sans-serif;text-decoration:none;cursor:pointer;width:100%;box-sizing:border-box}' +
        '.ldn-cs-section a.ldn-cs-p1{background:#ffd666;border-color:#e0a82e}' +
        '.ldn-cs-section button.ldn-cs-quitter{border-color:#c9776b;color:#8a2f22}' +
        '.ldn-cs-section a:focus-visible,.ldn-cs-section button:focus-visible{outline:3px solid #f5b942;outline-offset:2px}';
      (document.head || document.documentElement).appendChild(st); }
    cont.forEach(function (c) {
      if (c.querySelector('.ldn-cs-section')) return;
      var sec = el('div', 'ldn-cs-section'); var pr = profil();
      sec.appendChild(el('p', 'ldn-cs-t', 'Compte'));
      if (!moi.connecte) {          // visiteur : se connecter ou créer un compte (retour automatique vers cette page)
        var c1 = el('a', 'ldn-cs-p1', '🔑 Se connecter', cible + '#connexion');
        sec.appendChild(c1); sec.appendChild(el('a', '', 'Créer un compte', cible + '#inscription')); c.appendChild(sec); return;
      }
      if (pr && pr.surnom) sec.appendChild(el('p', 'ldn-cs-p', 'Profil actif : ' + (pr.avatar === 'fille' ? '👧 ' : '👦 ') + pr.surnom));
      sec.appendChild(el('a', '', '👨‍👩‍👧 Espace famille', base));
      var q = el('button', 'ldn-cs-quitter', 'Se déconnecter'); q.type = 'button';
      q.onclick = function () { q.disabled = true; import(base + 'client.js?v=2').then(function (C) { return C.deconnexion(); }).catch(function () {}).then(function () { location.reload(); }); };
      sec.appendChild(q); c.appendChild(sec);
    });
  }

  function lancer() {
    fetch(racine + 'api/moi', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && typeof j.connecte === 'boolean') { afficher(j); sectionMenu(j); } })
      .catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lancer); else lancer();
})();
