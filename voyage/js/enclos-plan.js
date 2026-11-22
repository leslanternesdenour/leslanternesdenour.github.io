// LE PLAN DE L'ENCLOS (écurie de Nabil) : où vit chaque monture, où elle boit, mange et se repose, où se tient Loumi.
// Fichier PUR (aucune 3D) : partagé par l'écurie (montures.js), les soins (soins.js), le jeu (main.js) et les tests (outils/tests/enclos.test.mjs).
// Rien de ce plan n'est enregistré : la place d'une monture se déduit de l'ordre de AV.montures (jamais de nouvelle donnée de sauvegarde).
export const ECURIE = { x: 52, z: -24 };
const R = (x, z) => ({ x: ECURIE.x + x, z: ECURIE.z + z });

// La clôture : côtés x = ±9.2, fond z = -4.6, devant z = +5.4 avec une entrée large de 3.2 m au centre.
export const ENCLOS = { demi: 9.2, fond: -4.6, devant: 5.4, entree: 1.6 };
export const ENTREE = R(0, 6.8);           // juste devant l'entrée : point de passage obligé pour entrer ou sortir

// Les emplacements au repos : deux rangées, une allée centrale dégagée ; chaque monture regarde l'allée. L'éléphant a la grande place du fond.
const RANGEES = [-2.8, 0.4];
const COLONNES = [-7.4, -4.2, 4.2, 7.4];
export const PLACES = RANGEES.flatMap(z => COLONNES.map(x => ({ ...R(x, z), a: x < 0 ? Math.PI / 2 : -Math.PI / 2, grande: false })));
export const PLACE_GRANDE = { ...R(0, -2.9), a: 0, grande: true };

// Qui occupe quelle place : l'ordre de la liste des montures possédées (stable, déterministe), l'éléphant sur la grande place.
// especeDe(id) -> 'chameau' | 'cheval' | 'elephant'. Renvoie { [id]: {x,z,a} } ; une monture en trop (plus de places) n'a pas de place.
export function affecter(ids, especeDe) {
  const res = {}; let k = 0, grande = false;
  for (const id of ids) {
    if (especeDe(id) === 'elephant' && !grande) { grande = true; res[id] = { x: PLACE_GRANDE.x, z: PLACE_GRANDE.z, a: PLACE_GRANDE.a }; continue; }
    const p = PLACES[k++]; if (p) res[id] = { x: p.x, z: p.z, a: p.a };
  }
  return res;
}

// Les lieux de soins (utilisés par soins.js) : l'abreuvoir à gauche, la mangeoire à droite, la litière au centre. « stand » = où se place la monture.
export const LIEUX = {
  eau:     { objet: R(-6.0, 3.0), stand: R(-6.0, 4.3), a: Math.PI,     rayon: 4.2, action: 'boire',  icone: '💧', verbe: 'Faire boire' },
  foin:    { objet: R(6.0, 3.0),  stand: R(6.0, 4.3),  a: Math.PI,     rayon: 4.2, action: 'manger', icone: '🌾', verbe: 'Donner à manger à' },
  litiere: { objet: R(0, 2.6),    stand: R(0, 2.6),    a: Math.PI / 2, rayon: 3.6, action: 'repos',  icone: '🌙', verbe: 'Faire reposer' }
};
// Le nid de Loumi : à côté des montures, près de la litière, tournée vers l'allée.
export const NID_LOUMI = { ...R(3.0, 3.3), regard: Math.PI };

export const dansEnclos = (x, z) => Math.abs(x - ECURIE.x) < ENCLOS.demi && z > ECURIE.z + ENCLOS.fond && z < ECURIE.z + ENCLOS.devant;
// Proche de l'écurie : la zone où les montures « vivent » (au désert, une monture laissée là-bas n'est jamais rangée)
export const pres = (x, z, rayon = 70) => Math.hypot(x - ECURIE.x, z - ECURIE.z) < rayon;

// Le prochain point à viser pour qu'une monture rejoigne un point DANS l'enclos sans traverser la clôture : elle passe par l'entrée.
// (Sortir de l'enclos n'est jamais scripté : une monture ne quitte sa place que si l'enfant monte dessus.)
const DEVANT = ECURIE.z + ENCLOS.devant, PORTE_DEDANS = R(0, 4.6);
export function etape(de, vers) {
  if (!dansEnclos(vers.x, vers.z) || dansEnclos(de.x, de.z)) return vers;
  const ax = Math.abs(de.x - ECURIE.x);
  if (ax > ENCLOS.demi - 0.2 && de.z < DEVANT + 1.2) return { x: de.x, z: DEVANT + 1.6 };      // le long de la clôture : d'abord s'écarter vers l'avant
  return ax > 1.2 ? ENTREE : PORTE_DEDANS;
}
