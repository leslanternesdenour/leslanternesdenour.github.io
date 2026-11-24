// Le suivi des missions de La Route (pur, sans Three.js). Tout est rangé dans etat.route.missions : { id: { etat, n, faits: [lieuIds] } }.
// Les pièces et les badges passent par les systèmes EXISTANTS (bourse.recompense, succes.js) : ce module ne gère que la progression.
import { MISSIONS_ROUTE } from './donnees.js';

export function progression(route, id) {
  const M = MISSIONS_ROUTE[id], m = route.missions[id];
  return { n: m ? m.faits.length : 0, total: M.total, etat: !m ? 'a_faire' : m.etat };
}

// Une étape réussie. Renvoie { nouveau, termine } : « termine » n'est vrai qu'une seule fois, au moment de la dernière étape.
export function faireEtape(route, id, lieuId) {
  const M = MISSIONS_ROUTE[id];
  const m = route.missions[id] || (route.missions[id] = { etat: 'en_cours', n: 0, faits: [] });
  if (m.faits.includes(lieuId)) return { nouveau: false, termine: false };
  m.faits.push(lieuId); m.n = m.faits.length;
  if (m.etat !== 'finie' && m.n >= M.total) { m.etat = 'finie'; m.fin = Date.now(); return { nouveau: true, termine: true }; }
  return { nouveau: true, termine: false };
}
