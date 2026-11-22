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
    var b = el('div'); b.id = 'ldn-compte'; b.className = pos; b.setAttribute('role', 'navigation'); b.setAttribute('aria-label', 'Compte');
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
        import(base + 'client.js?v=1').then(function (C) { return C.deconnexion(); }).catch(function () {}).then(function () { location.reload(); });
      };
      b.appendChild(q);
    }
    if (decalage && /^haut/.test(pos)) b.style.top = 'calc(max(10px, env(safe-area-inset-top)) + ' + decalage + 'px)';
    document.body.appendChild(b);
  }

  function lancer() {
    fetch(racine + 'api/moi', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && typeof j.connecte === 'boolean') afficher(j); })
      .catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lancer); else lancer();
})();
