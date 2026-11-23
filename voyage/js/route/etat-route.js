// La progression de La Route vers La Mecque : un sous-objet etat.route dans la sauvegarde existante (clé monde_voyage).
// RÈGLE ABSOLUE : on n'écrit QUE dans etat.route. Aucune autre clé de monde_voyage n'est lue pour être modifiée, remplacée ni migrée.
import { DEC, S_DEBUT, S_FIN_TRANCHE, LARGEUR } from './relief.js';
const defaut = () => ({
  v: 1,
  monde: 'village',       // où se trouve l'enfant : 'village' ou 'route' (sa position de la Route est gardée à part de etat.joueur)
  pos: null,              // { x, z, a } dernière position sur la Route (coordonnées du monde, voir relief.js)
  sac: {},                // objets du sac de voyage préparé
  decouvertes: [],        // lieux découverts (ids de donnees.js)
  repos: [],              // points de repos utilisés
  missions: {},           // { id: { etat, n, faits:[] } }
  objets: [],             // objets ramassés sur la route
  connaissances: [],      // fiches lues (ids de contenu-a-valider.js)
  recits: {},             // les histoires découvertes : { id: { etape, reponses, activite, carnet, t } }
  vu: {}                  // petits drapeaux (présentation vue, etc.)
});

const memeType = (a, b) => Array.isArray(a) ? Array.isArray(b) : (a && typeof a === 'object') ? (b && typeof b === 'object' && !Array.isArray(b)) : typeof a === typeof b;

export function preparerRoute(etat) {
  if (!etat.route || typeof etat.route !== 'object' || Array.isArray(etat.route)) etat.route = defaut();
  const r = etat.route, d = defaut();
  for (const k of Object.keys(d)) {
    if (!(k in r) || (d[k] !== null && !memeType(d[k], r[k]))) r[k] = d[k];   // champ absent ou de mauvais type : valeur neuve ; null accepté pour pos
  }
  return r;
}

// ---------- position : sauvegarde et reprise exactes ----------
const arrondi = (v, n) => +v.toFixed(n);
// Sur la Route : la position exacte est rangée dans etat.route.pos (jamais dans etat.joueur, qui reste la dernière position du village)
export function memoriserPosition(etat, p) {
  const r = preparerRoute(etat);
  r.monde = 'route';
  r.pos = { x: arrondi(p.x, 2), z: arrondi(p.z, 2), a: arrondi(p.a, 3) };
}
// Où reprendre : la position de la Route si l'enfant y était, sinon null (le village reprend avec etat.joueur comme avant)
export function positionDeReprise(etat) {
  const r = etat && etat.route;
  if (!r || r.monde !== 'route' || !r.pos || typeof r.pos !== 'object') return null;
  const { x, z, a } = r.pos;
  if (![x, z, a].every(Number.isFinite)) return null;
  const s = z - DEC;
  if (s < S_DEBUT - 50 || s > S_FIN_TRANCHE + 50 || Math.abs(x) > LARGEUR) return null;
  return { x, z, a };
}
