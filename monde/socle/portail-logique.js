// Règles du portail d'entrée du Monde de Nour — logique PURE (aucun accès au document ni au stockage),
// donc testable sous Node (outils/tests/portail-logique.test.mjs) et utilisée telle quelle par portail.js et village.js.
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else racine.PortailLogique = fabrique();
})(typeof self !== 'undefined' ? self : this, function () {
  var CLE_SESSION = 'ldn_portail';          // sessionStorage : le portail déjà joué dans cette session de jeu
  var PASSE = '*';                          // valeur « déjà passé » pour tous les profils (tests automatiques, accessibilité)

  // Identité de la session de jeu : un enfant précis, ou un visiteur sans compte.
  function cleProfil(profil) { return profil && profil.id ? 'enfant:' + profil.id : 'visiteur'; }

  // Le portail apparaît à chaque NOUVELLE session de jeu : nouvelle ouverture du navigateur ou de l'onglet, nouvelle
  // connexion, nouvel enfant choisi. Jamais à chaque page ni au retour d'un mini-jeu (même onglet, même enfant).
  function doitAfficher(o) {
    if (o.forcer) return true;                                  // ?ouverture=1 / ?portail=1 : bouton « Entrer dans le monde » de l'Espace famille
    if (o.session === PASSE) return false;
    return o.session !== cleProfil(o.profil);
  }

  var lisse = function (x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

  // Synchronisation de l'animation sur la VOIX. t = secondes écoulées depuis le début de la voix (t < 0 : la voix n'a pas commencé).
  //   coupe   : instant où « مَرْحَبًا » se termine et où « Bienvenue… » commence
  //   finVoix : instant où la dernière syllabe se termine
  // Les portes commencent à s'ouvrir dès le premier mot et finissent d'ouvrir avec la dernière syllabe.
  function etatSynchro(t, cues) {
    var coupe = cues.coupe, fin = cues.finVoix;
    if (!(t >= 0)) return { portes: 0, lumiere: 0.35, ar: false, fr: false, fini: false };
    var p = lisse((t - 0.15) / Math.max(0.5, fin - 0.15));
    return { portes: p, lumiere: 0.35 + 0.65 * p, ar: t >= 0, fr: t >= coupe - 0.05, fini: t >= fin };
  }

  // Ce que le profil enfant actif apporte à l'écran d'accueil du village, SANS jamais écraser une donnée déjà enregistrée.
  function reglagesDepuisProfil(profil, sauvegarde) {
    var r = { age: null, genre: null };
    if (!profil || !profil.id) return r;
    if (!sauvegarde.age && (profil.tranche === '3-5' || profil.tranche === '6-10')) r.age = profil.tranche === '3-5' ? 'petits' : 'grands';
    var g = sauvegarde.personnage && sauvegarde.personnage.genre;
    if (!g && (profil.avatar === 'fille' || profil.avatar === 'garcon')) r.genre = profil.avatar;
    return r;
  }

  // L'enfant peut-il entrer directement (profil connu, âge connu) sans l'écran « Qui joue ? » ?
  function entreeDirecte(profil, sauvegarde) {
    if (!profil || !profil.id) return false;
    var r = reglagesDepuisProfil(profil, sauvegarde);
    return !!(sauvegarde.age || r.age);
  }

  return { CLE_SESSION: CLE_SESSION, PASSE: PASSE, cleProfil: cleProfil, doitAfficher: doitAfficher, etatSynchro: etatSynchro, reglagesDepuisProfil: reglagesDepuisProfil, entreeDirecte: entreeDirecte };
});
