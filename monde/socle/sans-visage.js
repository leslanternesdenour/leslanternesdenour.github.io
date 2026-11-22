// MODE SANS VISAGE : réglage global de la famille (Les Lanternes de Nour).
// Script classique (pas un module), à charger TÔT dans le <head> de chaque page : il pose <html data-sans-visage="1|0">
// AVANT le premier affichage, pour qu'aucun visage n'apparaisse un instant. Aucune dépendance.
//
// Ce que le mode fait quand il est ACTIVÉ (une seule version de chaque personnage, les traits sont MASQUÉS, pas remplacés) :
//   - SVG : les groupes de traits portent la classe « sv-visage », masquée par le CSS ci-dessous ;
//   - 3D : les pièces de visage (yeux, sourcils, nez, bouche, joues) sont étiquetées dans voyage/js/formes.js (option v) et
//     écartées à l'affichage par le matériau commun ; les modèles GLB masquent leurs yeux et formes faciales ;
//   - émojis de personnes : remplacés par une silhouette neutre sans visage (balises « sv-emo », ajoutées automatiquement) ;
//   - images : <picture class="sv-image"> / éléments « .sv-avec » et « .sv-sans » (bannière de l'accueil).
// Ce qui reste : têtes, silhouettes, vêtements, cheveux, hijabs et toutes les animations du corps.
//
// Où est enregistré le réglage :
//   - toujours sur l'appareil (localStorage « ldn_sans_visage ») : c'est ce qui permet l'application immédiate et le
//     fonctionnement des visiteurs sans compte ;
//   - pour une famille connectée : dans son compte (preferences.sansVisage), identique pour tous les profils enfants,
//     relu à chaque connexion (le compte fait foi) — voir compte/index.html et serveur/api.js.
(function (racine) {
  'use strict';
  var CLE = 'ldn_sans_visage';
  var TEXTE_PARENTS = 'Au sein de la communauté musulmane, il existe différentes opinions et interprétations concernant la représentation des êtres vivants et des visages. Les Lanternes de Nour souhaite respecter ces différents avis et permettre à chaque famille de profiter de son univers éducatif selon l\'avis religieux qu\'elle suit. C\'est pourquoi nous proposons un mode sans visage facultatif.';

  function lire() { try { return racine.localStorage.getItem(CLE) === '1'; } catch (e) { return false; } }
  function ecrire(b) { try { racine.localStorage.setItem(CLE, b ? '1' : '0'); } catch (e) {} }
  var etat = lire();
  var abonnes = [];   // fonctions ou { ref: WeakRef, nom }

  function pagePoser() {
    var d = racine.document; if (!d || !d.documentElement) return;
    d.documentElement.setAttribute('data-sans-visage', etat ? '1' : '0');
  }
  function prevenir() {
    for (var i = abonnes.length - 1; i >= 0; i--) {
      var a = abonnes[i];
      try {
        if (typeof a === 'function') a(etat);
        else { var o = a.ref.deref(); if (!o) abonnes.splice(i, 1); else o[a.nom](etat); }
      } catch (e) {}
    }
    try { racine.dispatchEvent(new racine.CustomEvent('ldn:sans-visage', { detail: { actif: etat } })); } catch (e) {}
  }
  function definir(b, opts) {
    b = !!b; var change = b !== etat; etat = b;
    if (!opts || opts.local !== false) ecrire(b);
    pagePoser(); if (change || (opts && opts.forcer)) prevenir();
    return etat;
  }
  // abonner(f) : f(actif) tout de suite, puis à chaque changement ; renvoie la fonction qui désabonne
  function abonner(f) { abonnes.push(f); try { f(etat); } catch (e) {} return function () { var i = abonnes.indexOf(f); if (i >= 0) abonnes.splice(i, 1); }; }
  // abonnerObjet(obj, 'methode') : appelle obj.methode(actif) sans empêcher l'objet d'être libéré (personnages 3D)
  function abonnerObjet(obj, nom) {
    if (typeof racine.WeakRef !== 'function') { abonnes.push(function (a) { obj[nom](a); }); }
    else abonnes.push({ ref: new racine.WeakRef(obj), nom: nom });
    try { obj[nom](etat); } catch (e) {}
  }
  // Le compte fait foi pour une famille connectée. Si le compte n'a encore aucun réglage mais que cet appareil en a un,
  // l'appareil l'envoie au compte (renvoie « envoyer »).
  function depuisCompte(pref) {
    if (pref && typeof pref.sansVisage === 'boolean') { definir(pref.sansVisage); return 'compte'; }
    return etat ? 'envoyer' : 'aucun';
  }

  // ---------- silhouette neutre et émojis de personnes ----------
  var PERS = '[\\u{1F466}\\u{1F467}\\u{1F468}\\u{1F469}\\u{1F474}\\u{1F475}\\u{1F476}\\u{1F9D1}\\u{1F9D2}\\u{1F9D4}\\u{1F9D5}\\u{1F64B}\\u{1F473}]';
  var SMI = '[\\u{1F600}-\\u{1F60F}\\u{1F642}\\u{1F622}\\u{1F62E}\\u{1F970}\\u{1F929}\\u{1F973}]\\uFE0F?';
  var SRC_PERSONNE = PERS + '[\\u{1F3FB}-\\u{1F3FF}]?(?:\\u200D(?:' + PERS + '|[\\u2640\\u2642]\\uFE0F?))*\\uFE0F?';
  var SRC_TOUT = SRC_PERSONNE + '|' + SMI;
  var SIL = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4.4"/><path d="M3.6 22c0-5 3.8-8 8.4-8s8.4 3 8.4 8z"/></svg>');
  var SIL_VOILE = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 1.6c-3.7 0-6.2 2.8-6.2 6.4 0 2.2 1 3.9 2.4 4.9C5 14 2.8 16.8 2.8 22h18.4c0-5.2-2.2-8-5.4-9.1 1.4-1 2.4-2.7 2.4-4.9 0-3.6-2.5-6.4-6.2-6.4z"/></svg>');
  var CSS = '' +
    '.sv-visage{}' +
    'html[data-sans-visage="1"] .sv-visage{display:none !important}' +
    'html[data-sans-visage="1"] .sv-avec{display:none !important}' +
    'html:not([data-sans-visage="1"]) .sv-sans{display:none !important}' +
    '.sv-emo::before{content:none}' +
    'html[data-sans-visage="1"] .sv-emo>.sv-e{display:none}' +
    'html[data-sans-visage="1"] .sv-emo::before{content:"";display:inline-block;width:1.05em;height:1.05em;vertical-align:-.16em;background:currentColor;opacity:.85;' +
      '-webkit-mask:url("' + SIL + '") center/contain no-repeat;mask:url("' + SIL + '") center/contain no-repeat}' +
    'html[data-sans-visage="1"] .sv-emo[data-k="v"]::before{-webkit-mask-image:url("' + SIL_VOILE + '");mask-image:url("' + SIL_VOILE + '")}' +
    'html[data-sans-visage="1"] .sv-emo[data-k="s"]::before{width:auto;height:auto;background:none;opacity:1;content:"\\2728";-webkit-mask:none;mask:none}';
  function injecterCss() {
    var d = racine.document; if (!d || d.getElementById('ldn-sv-css')) return;
    var s = d.createElement('style'); s.id = 'ldn-sv-css'; s.textContent = CSS;
    (d.head || d.documentElement).appendChild(s);
  }

  var IGNORER = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, OPTION: 1, TITLE: 1, CODE: 1, NOSCRIPT: 1, SVG: 0 };
  function enveloppe(texte) {
    // renvoie un fragment où chaque émoji de personne / smiley est enveloppé, ou null s'il n'y en a pas
    var d = racine.document, frag = null, pos = 0, trouve = false, m;
    var re = new RegExp(SRC_TOUT, 'gu');
    while ((m = re.exec(texte))) {
      if (!m[0]) { re.lastIndex++; continue; }
      if (!frag) frag = d.createDocumentFragment();
      if (m.index > pos) frag.appendChild(d.createTextNode(texte.slice(pos, m.index)));
      var sp = d.createElement('span'), e = d.createElement('span');
      sp.className = 'sv-emo'; sp.setAttribute('data-e', m[0]); sp.setAttribute('aria-hidden', 'true');
      sp.setAttribute('data-k', new RegExp('^\\u{1F9D5}', 'u').test(m[0]) ? 'v' : (new RegExp('^(?:' + SMI + ')', 'u').test(m[0]) ? 's' : 'p'));
      e.className = 'sv-e'; e.textContent = m[0]; sp.appendChild(e); frag.appendChild(sp); pos = m.index + m[0].length; trouve = true;
    }
    if (!trouve) return null;
    if (pos < texte.length) frag.appendChild(d.createTextNode(texte.slice(pos)));
    return frag;
  }
  function enveloppeNoeud(n) {
    if (n.nodeType === 3) {
      var p = n.parentNode; if (!p || (p.nodeType === 1 && (IGNORER[p.tagName] || (p.closest && p.closest('.sv-emo,[data-sv-ignore]'))))) return;
      var f = enveloppe(n.nodeValue); if (f) p.replaceChild(f, n);
    } else if (n.nodeType === 1 && !IGNORER[n.tagName] && !(n.classList && n.classList.contains('sv-emo')) && !(n.hasAttribute && n.hasAttribute('data-sv-ignore'))) {
      var enfants = Array.prototype.slice.call(n.childNodes); for (var i = 0; i < enfants.length; i++) enveloppeNoeud(enfants[i]);
    }
  }
  var file = [], prevu = false;
  function traiterFile() { prevu = false; var l = file; file = []; for (var i = 0; i < l.length; i++) if (l[i].isConnected !== false) enveloppeNoeud(l[i]); }
  function planifier(n) { file.push(n); if (!prevu) { prevu = true; (racine.requestAnimationFrame || racine.setTimeout)(traiterFile); } }
  function surveiller() {
    var d = racine.document; if (!d || !d.body || typeof racine.MutationObserver !== 'function') return;
    enveloppeNoeud(d.body);
    new racine.MutationObserver(function (lst) {
      for (var i = 0; i < lst.length; i++) {
        var r = lst[i];
        if (r.type === 'characterData') planifier(r.target);
        else for (var j = 0; j < r.addedNodes.length; j++) planifier(r.addedNodes[j]);
      }
    }).observe(d.body, { childList: true, subtree: true, characterData: true });
  }

  var API = { actif: function () { return etat; }, definir: definir, abonner: abonner, abonnerObjet: abonnerObjet, depuisCompte: depuisCompte, TEXTE_PARENTS: TEXTE_PARENTS, CLE: CLE, enveloppe: enveloppe, CSS: CSS };
  racine.LDN_SV = API;
  pagePoser(); injecterCss();
  if (racine.document) {
    if (racine.document.readyState === 'loading') racine.document.addEventListener('DOMContentLoaded', surveiller); else surveiller();
  }
  // un autre onglet change le réglage : application immédiate ici aussi
  if (racine.addEventListener) racine.addEventListener('storage', function (ev) { if (ev.key === CLE) { definir(ev.newValue === '1', { local: false }); } });
})(typeof window !== 'undefined' ? window : globalThis);
