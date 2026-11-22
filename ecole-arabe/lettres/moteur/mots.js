// Composition de mots en lettres RÉELLES : choix de la bonne forme (isolée, initiale, médiane, finale) selon la place dans le mot et selon la liaison des lettres voisines.
// Les lettres qui ne se lient pas à la suivante (ا د ذ ر ز و) coupent la liaison : la lettre suivante recommence en forme initiale. Aucune lettre n'est jamais « différente » : seule sa forme change.
import { PAR_ID } from '../donnees/lettres.js?v=2';
export function formesDuMot(ids) {
  return ids.map((id, i) => { const l = PAR_ID[id], liePrec = i > 0 && PAR_ID[ids[i - 1]].joint, lieSuiv = i < ids.length - 1 && l.joint;
    const forme = liePrec && lieSuiv ? 'mediane' : liePrec ? 'finale' : lieSuiv ? 'initiale' : 'isolee'; return { id, forme, position: i }; });
}
// Mise en page de droite à gauche : le 1er signe du mot est à DROITE. Renvoie les décalages x (en unités de 1000/em) de chaque lettre et la largeur totale.
export function miseEnPage(items, glyphes, ecart = 0) {
  const visuel = [...items].reverse(); let x = 0; const placees = visuel.map(it => { const g = glyphes.lettres[it.id][it.forme]; const p = { ...it, x, largeur: g.largeur }; x += g.largeur + ecart; return p; });
  return { placees, largeur: x - ecart };
}
// Mots de l'atelier (formes) : lettres réelles, sans voyelles, mots du vocabulaire de l'enfant
export const MOTS_ATELIER = [
  { lettres: ['kaf', 'ta', 'alif', 'ba'], fr: 'le livre', emoji: '📖' }, { lettres: ['qaf', 'mim', 'ra'], fr: 'la lune', emoji: '🌙' }, { lettres: ['jim', 'mim', 'lam'], fr: 'le chameau', emoji: '🐫' },
  { lettres: ['nun', 'jim', 'mim'], fr: "l'étoile", emoji: '⭐' }, { lettres: ['sin', 'mim', 'kaf'], fr: 'le poisson', emoji: '🐟' }, { lettres: ['ba', 'ya', 'ta'], fr: 'la maison', emoji: '🏠' },
  { lettres: ['ba', 'alif', 'ba'], fr: 'la porte', emoji: '🚪' }, { lettres: ['shin', 'mim', 'sin'], fr: 'le soleil', emoji: '☀️' }, { lettres: ['waw', 'ra', 'dal'], fr: 'les roses', emoji: '🌹' },
  { lettres: ['ayn', 'nun', 'ba'], fr: 'le raisin', emoji: '🍇' }, { lettres: ['fa', 'ya', 'lam'], fr: "l'éléphant", emoji: '🐘' }, { lettres: ['lam', 'ya', 'lam'], fr: 'la nuit', emoji: '🌃' },
  { lettres: ['nun', 'ha2', 'ra'], fr: 'la rivière', emoji: '🏞️' }, { lettres: ['ta', 'mim', 'ra'], fr: 'les dattes', emoji: '🌴' }, { lettres: ['ba', 'ha', 'ra'], fr: 'la mer', emoji: '🌊' }
];
