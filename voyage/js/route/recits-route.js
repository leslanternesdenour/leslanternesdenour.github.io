// La progression des récits (آثار الأنبياء) : pure, sans Three.js. Tout est rangé dans etat.route.recits (jamais ailleurs).
// { [id]: { etape, reponses: { questionId: indexChoisi }, activite: bool, carnet: bool, t } }
import { recit } from './recits-a-valider.js';

export const etatRecit = (route, id) => route.recits[id] || null;

// Ouvre (ou rouvre) une histoire : jamais de perte de ce qui a déjà été fait
export function ouvrirRecit(route, id) {
  if (!recit(id)) throw new Error('histoire inconnue : ' + id);
  return route.recits[id] || (route.recits[id] = { etape: 0, reponses: {}, activite: false, carnet: false, t: Date.now() });
}
// On avance, on ne recule jamais
export function avancer(route, id, etape) { const e = ouvrirRecit(route, id); if (etape > e.etape) e.etape = etape; return e; }
// Ajoute l'histoire au carnet : vrai seulement la première fois (la récompense ne se donne qu'une fois)
export function ajouterAuCarnet(route, id) { const e = ouvrirRecit(route, id); if (e.carnet) return false; e.carnet = true; return true; }
export const recitsDuCarnet = route => Object.keys(route.recits).filter(id => route.recits[id].carnet);

// Les questions adaptées à l'âge ('3-5' ou '6-10') : { id, texte, choix, bonne, enonce }
export function questionsPour(id, age) {
  return recit(id).questions.filter(q => q.ages.includes(age)).map(q => ({ id: q.id, enonce: q.enonce, texte: (age === '3-5' ? q.petit : q.grand) || q.grand || q.petit, choix: q.choix, bonne: q.bonne }));
}
// Une réponse : jamais de punition. Fausse : rien n'est retenu, on peut réessayer. Juste : conservée.
export function repondre(route, id, qid, choix) {
  const q = recit(id).questions.find(x => x.id === qid), juste = choix === q.bonne;
  if (juste) ouvrirRecit(route, id).reponses[qid] = choix;
  return { juste, bonne: q.bonne };
}
