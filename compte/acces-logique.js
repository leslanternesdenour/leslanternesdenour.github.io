// Accès au jeu : logique PURE (aucun accès au document ni au stockage), testée sous Node (outils/tests/acces-logique.test.mjs).
// Règle (organisation validée le 24/11/2026) : pour jouer, il faut un compte parent connecté et un profil enfant choisi.
// L'enfant n'a jamais de compte à créer. Si le système de comptes est indisponible sur un site public, le jeu reste FERMÉ (fail-closed) ; seul le développement local reste libre.
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else racine.AccesLogique = fabrique();
})(typeof self !== 'undefined' ? self : this, function () {
  // Hôtes de développement local : jamais un site public (« localhost.evil.com » n'en est pas un).
  function estHoteLocal(h) { return h === 'localhost' || h === '127.0.0.1' || h === '[::1]'; }
  // 'libre' : développement local sans serveur de comptes ; 'indisponible' : comptes injoignables ou non configurés, jeu fermé ; 'connexion' : se connecter ou créer un compte parent ; 'profil' : choisir l'enfant ; 'ok' : on joue
  function decision(o) {
    if (!o || !o.comptesOuverts) return o && o.hoteLocal ? 'libre' : 'indisponible';
    if (!o.connecte) return 'connexion';
    if (o.emailVerifie === false) return 'verification';   // adresse du parent non vérifiée : jamais de jeu (le serveur contrôle aussi)
    if (!o.profil || !o.profil.id) return 'profil';
    return 'ok';
  }
  var textes = {
    connexion: { titre: 'Un compte parent pour jouer', texte: 'Pour entrer dans le Monde de Nour, un parent se connecte ou crée un compte famille. L\'enfant n\'a rien à saisir : le parent crée son profil, et la progression est enregistrée automatiquement.' },
    verification: { titre: 'Vérifiez votre adresse e-mail', texte: "Pour protéger les enfants, le jeu s'ouvre dès que l'adresse e-mail du parent est vérifiée. Ouvrez le lien reçu par e-mail : l'Espace famille vérifie tout seul et débloque le jeu." },
    indisponible: { titre: 'Le village est momentanément fermé', texte: 'Le service des comptes parents ne répond pas pour l\'instant. Par sécurité, le jeu reste fermé. Réessayez dans quelques minutes.' },
    profil: { titre: 'Qui joue aujourd\'hui ?', texte: 'Choisis le profil de l\'enfant qui va jouer. Le parent peut en créer jusqu\'à quatre dans l\'Espace famille.' }
  };
  return { decision: decision, textes: textes, estHoteLocal: estHoteLocal };
});
