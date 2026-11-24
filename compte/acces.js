/* Les Lanternes de Nour — garde d'accès au jeu (organisation du 24/11/2026).
   Pour jouer : un compte parent connecté et un profil enfant choisi. Un visiteur voit un écran clair (Se connecter / Créer un compte /
   voir la présentation du village) ; un parent connecté sans profil choisit l'enfant qui joue. L'enfant n'a jamais de compte à créer.
   Le serveur reste seul juge des droits : ce script n'affiche qu'un écran. Si les comptes ne sont pas ouverts (pas de serveur, réponse
   inattendue), rien n'est bloqué. Chargé après compte/acces-logique.js. Inactif dans un cadre du village. */
(function () {
  'use strict';
  if (window.__ldnAcces || window.top !== window || !window.AccesLogique) return;
  window.__ldnAcces = 1;
  var s = document.currentScript;
  var base = s ? new URL('./', s.src).href : new URL('/compte/', location.href).href;
  var racine = new URL('../', base).href;
  var retour = location.pathname + location.search + location.hash;
  var versCompte = base + '?retour=' + encodeURIComponent(retour);

  function profil() { try { return JSON.parse(localStorage.getItem('ldn_profil_actif') || 'null'); } catch (e) { return null; } }
  function el(tag, cls, txt, href) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; if (href) e.href = href; return e; }

  function css() {
    var st = document.createElement('style');
    st.textContent = '#ldn-acces{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(18,12,52,.94);font-family:Nunito,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow:auto}' +
      '#ldn-acces .boite{width:min(100%,460px);box-sizing:border-box;background:#2a2166;border:2px solid rgba(245,185,66,.8);border-radius:24px;padding:26px 22px;color:#f4efff;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.5)}' +
      '#ldn-acces h2{margin:6px 0 10px;font:800 clamp(22px,6vw,28px)/1.2 Poppins,Nunito,system-ui,sans-serif;color:#ffd24a}' +
      '#ldn-acces p{margin:0 0 16px;line-height:1.55;color:#e4dcff;font-size:17px}' +
      '#ldn-acces .lanterne{font-size:40px;line-height:1}' +
      '#ldn-acces .actions{display:grid;gap:12px}' +
      '#ldn-acces a,#ldn-acces button{display:flex;align-items:center;justify-content:center;gap:8px;min-height:56px;padding:0 18px;border-radius:16px;border:2px solid #ffd666;background:transparent;color:#ffd666;font:800 18px Nunito,system-ui,sans-serif;text-decoration:none;cursor:pointer;box-sizing:border-box}' +
      '#ldn-acces a.p,#ldn-acces button.p{background:#ffd666;color:#2a1d00;box-shadow:0 4px 0 #b9831a}' +
      '#ldn-acces a.l{border:0;min-height:44px;font-size:16px;text-decoration:underline;color:#c9bfe8}' +
      '#ldn-acces a:focus-visible,#ldn-acces button:focus-visible{outline:4px solid #fff;outline-offset:3px}' +
      '#ldn-acces .enfant{justify-content:flex-start;text-align:left;background:#191345}' +
      '#ldn-acces .enfant small{display:block;font-weight:600;color:#c9bfe8;font-size:14px}' +
      '#ldn-acces .etat{min-height:1.3em;margin-top:10px;font-weight:700;color:#ff9fb2;font-size:15px}' +
      'html.ldn-acces-ouvert{overflow:hidden}';
    document.head.appendChild(st);
  }
  function ouvrirBoite(t) {
    css(); document.documentElement.classList.add('ldn-acces-ouvert');
    var fond = el('div'); fond.id = 'ldn-acces';
    var b = el('div', 'boite'); b.setAttribute('role', 'dialog'); b.setAttribute('aria-modal', 'true'); b.setAttribute('aria-labelledby', 'ldn-acces-t');
    b.appendChild(el('div', 'lanterne', '🏮')); var h = el('h2', '', t.titre); h.id = 'ldn-acces-t'; b.appendChild(h); b.appendChild(el('p', '', t.texte));
    fond.appendChild(b); document.body.appendChild(fond); return b;
  }

  function ecranConnexion() {
    var b = ouvrirBoite(AccesLogique.textes.connexion), a = el('div', 'actions');
    a.appendChild(el('a', 'p', '🔑 Se connecter', versCompte + '#connexion'));
    a.appendChild(el('a', '', 'Créer un compte', versCompte + '#inscription'));
    a.appendChild(el('a', 'l', 'Voir la présentation du village', racine + 'decouvrir/'));
    b.appendChild(a); var p = b.querySelector('a'); if (p) p.focus();
  }

  function ecranVerification() {
    var b = ouvrirBoite(AccesLogique.textes.verification), a = el('div', 'actions');
    a.appendChild(el('a', 'p', '📧 Ouvrir l\'Espace famille', base + '?retour=' + encodeURIComponent(retour) + '&verification=1#verification'));
    a.appendChild(el('a', 'l', 'Voir la présentation du village', racine + 'decouvrir/'));
    b.appendChild(a); var p = b.querySelector('a'); if (p) p.focus();
  }

  function ecranIndisponible() {
    var b = ouvrirBoite(AccesLogique.textes.indisponible), a = el('div', 'actions');
    var r = el('button', 'p', '↻ Réessayer'); r.type = 'button'; r.onclick = function () { location.reload(); };
    a.appendChild(r); a.appendChild(el('a', 'l', 'Voir la présentation du village', racine + 'decouvrir/')); a.appendChild(el('a', 'l', "Retour à l'accueil", racine));
    b.appendChild(a); r.focus();
  }

  function ecranProfil() {
    var b = ouvrirBoite(AccesLogique.textes.profil), liste = el('div', 'actions'), etat = el('div', 'etat'); etat.setAttribute('role', 'status');
    b.appendChild(liste); b.appendChild(etat);
    function pied() { var a = el('div', 'actions'); a.style.marginTop = '14px'; a.appendChild(el('a', 'l', '👨‍👩‍👧 Espace famille (créer ou modifier les profils)', versCompte)); b.appendChild(a); }
    import(base + 'client.js?v=2').then(function (C) {
      return Promise.all([C.api('/api/enfants'), C.moi()]).then(function (r) {
        var enfants = r[0].enfants || [];
        if (!enfants.length) { b.querySelector('p').textContent = "Aucun profil enfant n'existe encore. Le parent peut en créer un dans l'Espace famille."; liste.appendChild(el('a', 'p', '➕ Créer un profil enfant', versCompte)); pied(); return; }
        enfants.forEach(function (e) {
          var btn = el('button', 'enfant'); btn.type = 'button';
          btn.appendChild(el('span', '', e.avatar === 'fille' ? '👧' : '👦')); var t = el('span', '', e.surnom); t.appendChild(el('small', '', e.tranche === '3-5' ? '3 à 5 ans' : '6 à 10 ans')); btn.appendChild(t);
          btn.onclick = function () {
            liste.querySelectorAll('button').forEach(function (x) { x.disabled = true; }); etat.textContent = '';
            C.choisirEnfant(e.id, r[1]).then(function () { location.reload(); }, function (err) { liste.querySelectorAll('button').forEach(function (x) { x.disabled = false; }); etat.textContent = C.messageErreur(err); });
          };
          liste.appendChild(btn);
        });
        pied(); var premier = liste.querySelector('button'); if (premier) premier.focus();
      });
    }).catch(function () { etat.textContent = 'Impossible de charger les profils. Réessaie dans un instant.'; pied(); });
  }

  // Fail-closed : une réponse absente, en erreur ou inattendue (service indisponible, réseau coupé) ferme le jeu, sauf en développement local.
  function lancer() {
    if (document.getElementById('ldn-acces')) return;
    fetch(racine + 'api/moi', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (j) {
        var ouverts = !!(j && typeof j.connecte === 'boolean');
        var d = AccesLogique.decision({ comptesOuverts: ouverts, connecte: !!(j && j.connecte), emailVerifie: j && j.emailVerifie, profil: profil(), hoteLocal: AccesLogique.estHoteLocal(location.hostname) });
        if (d === 'indisponible') ecranIndisponible(); else if (d === 'verification') ecranVerification(); else if (d === 'connexion') ecranConnexion(); else if (d === 'profil') ecranProfil();
      });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lancer); else lancer();
  // Session expirée pendant qu'un onglet reste ouvert : la garde revérifie au retour sur la page.
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') lancer(); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) lancer(); });
})();