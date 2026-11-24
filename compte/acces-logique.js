// Accès au jeu : logique PURE (aucun accès au document ni au stockage), testée sous Node (outils/tests/acces-logique.test.mjs).
// Règle (organisation validée le 24/11/2026) : pour jouer, il faut un compte parent connecté et un profil enfant choisi.
// L'enfant n'a jamais de compte à créer. Si les comptes ne sont pas ouverts (serveur absent), rien n'est bloqué.
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else racine.AccesLogique = fabrique();
})(typeof self !== 'undefined' ? self : this, function () {
  // 'libre' : rien à faire ; 'connexion' : se connecter ou créer un compte parent ; 'profil' : choisir l'enfant ; 'ok' : on joue
  function decision(o) {
    if (!o || !o.comptesOuverts) return 'libre';
    if (!o.connecte) return 'connexion';
    if (!o.profil || !o.profil.id) return 'profil';
    return 'ok';
  }
  var textes = {
    connexion: { titre: 'Un compte parent pour jouer', texte: 'Pour entrer dans le Monde de Nour, un parent se connecte ou crée un compte famille. L\'enfant n\'a rien à saisir : le parent crée son profil, et la progression est enregistrée automatiquement.' },
    profil: { titre: 'Qui joue aujourd\'hui ?', texte: 'Choisis le profil de l\'enfant qui va jouer. Le parent peut en créer jusqu\'à quatre dans l\'Espace famille.' }
  };
  return { decision: decision, textes: textes };
});
