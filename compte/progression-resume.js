// Résumé de la progression d'un enfant pour l'Espace famille : logique PURE, testée sous Node (outils/tests/progression-resume.test.mjs).
// Ne lit que des champs connus, avec des valeurs par défaut : jamais de donnée brute affichée, jamais d'erreur sur un profil vide.
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else racine.ProgressionResume = fabrique();
})(typeof self !== 'undefined' ? self : this, function () {
  var nb = function (x) { return typeof x === 'number' && isFinite(x) && x > 0 ? Math.floor(x) : 0; };
  var obj = function (x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; };
  var taille = function (x) { return Array.isArray(x) ? x.length : 0; };
  function resume(progression) {
    var p = obj(progression), m = obj(p.monde), jeux = obj(m.jeux), v = obj(p.monde_voyage), quetes = obj(v.quetes);
    var r = {
      etoiles: nb(m.etoiles), lanternes: nb(m.lanternes),
      jeux: { ablutions: nb(obj(jeux.ablutions).etoiles), priere: nb(obj(jeux.priere).etoiles), ramadan: nb(obj(jeux.ramadan).lanternes) },
      voyage: { zones: taille(v.zones), missions: Object.keys(obj(v.missions)).filter(function (k) { return obj(v.missions[k]).etat === 'finie'; }).length, mots: taille(quetes.mots), animaux: taille(v.animaux) }
    };
    r.vide = !(r.etoiles || r.lanternes || r.jeux.ablutions || r.jeux.priere || r.jeux.ramadan || r.voyage.zones || r.voyage.missions || r.voyage.mots || r.voyage.animaux);
    return r;
  }
  return { resume: resume };
});