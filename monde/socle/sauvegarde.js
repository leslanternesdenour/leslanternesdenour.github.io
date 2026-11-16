// Socle commun — sauvegarde locale (aucun compte, rien n'est envoyé).
// Une seule clé localStorage : « monde ». Les clés des pages existantes
// (« priere », « ablutions_son », profils du calendrier) ne sont jamais touchées.

const CLE = 'monde';
const VERSION = 1;

function defauts() {
  return {
    v: VERSION,
    age: null,            // 'petits' (3–5) | 'grands' (6–10)
    son: true,            // ancien réglage général (gardé pour compatibilité)
    sons: { musique: 0.5, musiqueActive: true, voix: 1, effets: 0.7 },
    qualite: null,        // 'leger' | 'beau' | null = automatique
    etoiles: 0,
    lanternes: 0,
    decorations: [],
    trophees: [],
    jeux: {},             // { ablutions: { etoiles: 3, fini: true, ... } }
    historique: []        // [{ t, jeu, quoi, n }]
  };
}

let etat = charger();
const abonnes = new Set();

function charger() {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return defauts();
    const lu = JSON.parse(brut);
    const d = defauts();
    return Object.assign(d, lu, { v: VERSION, sons: Object.assign(d.sons, lu.sons) });
  } catch (e) {
    return defauts();
  }
}

function enregistrer() {
  try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) { /* stockage plein ou bloqué : on continue */ }
  abonnes.forEach(f => { try { f(etat); } catch (e) {} });
}

export const sauvegarde = {
  get: () => etat,
  regler(cle, valeur) { etat[cle] = valeur; enregistrer(); },
  abonner(f) { abonnes.add(f); return () => abonnes.delete(f); },

  // Progression : étoiles, lanternes, décorations, trophées. Aucun classement.
  gagner(jeu, quoi, n = 1) {
    if (quoi === 'etoiles') etat.etoiles += n;
    else if (quoi === 'lanternes') etat.lanternes += n;
    else if (quoi === 'decoration' && !etat.decorations.includes(n)) etat.decorations.push(n);
    else if (quoi === 'trophee' && !etat.trophees.includes(n)) etat.trophees.push(n);
    etat.historique.push({ t: Date.now(), jeu, quoi, n });
    if (etat.historique.length > 300) etat.historique = etat.historique.slice(-300);
    enregistrer();
  },
  jeu(id) { return etat.jeux[id] || {}; },
  majJeu(id, donnees) { etat.jeux[id] = Object.assign({}, etat.jeux[id], donnees); enregistrer(); },
  effacer() { etat = defauts(); enregistrer(); }
};
