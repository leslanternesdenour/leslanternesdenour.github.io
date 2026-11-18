// Collections thématiques et badges : ils récompensent l'exploration, l'apprentissage et le soin, pas seulement les achats.
// Rien ne s'achète ici : un badge se mérite. Pas de série de jours obligatoire, pas de classement.
import { COLLECTIONS as COLL_OBJETS } from './catalogue.js?v=3';

export const COLLECTIONS = [
  ...COLL_OBJETS,
  { id: 'chevaux', nom: 'Les chevaux d\'Arabie', icone: '🐎', montures: ['eclair', 'zephyr', 'lune'], pieces: 1500 },
  { id: 'caravane', nom: 'La grande caravane', icone: '🐪', montures: ['sablo', 'cannelle', 'perle', 'bactra'], pieces: 1200 }
];

// c = { AV, etat, nbZones, nbPierres, possede(id), quotidienFaites, sageJustes }
export const BADGES = [
  { id: 'premier-achat', icone: '🛍️', nom: 'Premier achat', desc: 'Acheter un premier objet au souk.', ok: c => (c.AV.achats || []).some(a => !String(a.id).startsWith('monture-')) },
  { id: 'cavalier', icone: '🐪', nom: 'En selle !', desc: 'Monter pour la première fois sur une monture.', ok: c => !!c.etat.premiereMontee },
  { id: 'eleveur', icone: '🐎', nom: 'Ami des montures', desc: 'Adopter une nouvelle monture à l\'écurie.', ok: c => (c.AV.montures || []).length > 1 },
  { id: 'lanternes', icone: '🏮', nom: 'Gardien des lanternes', desc: 'Retrouver les 12 lanternes cachées.', ok: c => c.AV.ramasses.filter(k => k.startsWith('lanterne')).length >= 12 },
  { id: 'animaux', icone: '🦊', nom: 'Ami des animaux', desc: 'Observer les 7 animaux du pays de Nour.', ok: c => c.AV.animaux.length >= 7 },
  { id: 'explorateur', icone: '🧭', nom: 'Grand explorateur', desc: 'Découvrir tous les lieux du pays.', ok: c => c.nbZones >= c.totalZones },
  { id: 'lecteur', icone: '📜', nom: 'Lecteur des pierres', desc: 'Lire toutes les pierres à la lanterne dorée.', ok: c => c.nbPierres >= c.totalPierres },
  { id: 'missions', icone: '⭐', nom: 'Aventurier', desc: 'Réussir les 5 grandes missions.', ok: c => Object.values(c.AV.missions || {}).filter(m => m.etat === 'finie').length >= 5 },
  { id: 'sage', icone: '🧓', nom: 'Élève de Hakim', desc: 'Donner 15 bonnes réponses aux questions de Hakim.', ok: c => c.sageJustes >= 15 },
  { id: 'jour', icone: '☀️', nom: 'Petits défis', desc: 'Réussir 10 missions du jour (quand tu veux, sans te presser).', ok: c => c.quotidienFaites >= 10 },
  { id: 'cour', icone: '🏡', nom: 'Une jolie cour', desc: 'Exposer 5 objets dans ta cour.', ok: c => c.objetsCour >= 5 },
  { id: 'elegant', icone: '👕', nom: 'Bien habillé', desc: 'Avoir 6 habits ou accessoires.', ok: c => c.habits >= 6 },
  { id: 'legendaire', icone: '🌟', nom: 'Trésor légendaire', desc: 'Posséder un objet ou une monture légendaire.', ok: c => c.legendaires > 0 },
  ...COLLECTIONS.map(k => ({ id: 'collection-' + k.id, icone: k.icone, nom: k.nom, desc: 'Compléter cette collection.', ok: c => c.collectionFinie(k) }))
];

export function progressionCollection(k, AV) {
  const avoir = new Set((AV.achats || []).map(a => a.id)), montures = new Set(AV.montures || []);
  const liste = k.objets ? k.objets.map(id => ({ id, ok: avoir.has(id) })) : k.montures.map(id => ({ id, ok: montures.has(id) }));
  return { liste, n: liste.filter(x => x.ok).length, total: liste.length };
}
