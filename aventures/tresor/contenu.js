// LE TRÉSOR DES SOURATES ET DES MOTS — contenus. Les lettres et les mots viennent des références déjà présentes (ecole-arabe/commun/langue/alphabet.js et la Chasse aux mots) : RIEN n'est retapé ni inventé ici.
// Les « sourates » : seulement leur NOM, leur NUMÉRO et le sens de leur nom. AUCUN verset, aucun texte coranique tapé (voir docs/CONTENUS-A-VALIDER.md : à valider par le fondateur).
// Pas de voix dans ce jeu : les prononciations arabes restent à faire valider avant tout enregistrement.
import { ALPHABET } from '../../ecole-arabe/commun/langue/alphabet.js?v=3';
import { OBJETS } from '../chasse-aux-mots/mots.js?v=2';
import { avecLeurres } from '../commun/mini-logique.js?v=1';
export const COFFRES = [
  { id: 'lettres', titre: "Les lettres de l'alphabet", aide: 'Reconnais le nom de chaque lettre arabe.', icone: '🔤' },
  { id: 'mots', titre: 'Les mots arabes', aide: 'Retrouve le sens de mots que tu connais déjà.', icone: '📖' },
  { id: 'sourates', titre: 'Les noms des sourates', aide: 'Découvre le nom et le numéro de quelques sourates.', icone: '📜' }
];
// Un mot = émoji (le sens est montré par l'image dans la bonne réponse) ; tout objet de la Chasse aux mots doit avoir son émoji (test).
export const EMOJIS = { lanterne: '🏮', livre: '📖', datte: '🌴', cruche: '🏺', tapis: '🧶', pomme: '🍎', pain: '🍞', cle: '🔑', panier: '🧺', rose: '🌹', etoile: '⭐', lune: '🌙', tasse: '☕', plume: '🪶', raisin: '🍇', coussin: '🛏️', poisson: '🐟', oiseau: '🐦' };
export const SOURATES = [
  { num: 1, nom: 'Al-Fâtiha', sens: "l'Ouverture" },
  { num: 112, nom: 'Al-Ikhlâs', sens: 'la Sincérité' },
  { num: 113, nom: 'Al-Falaq', sens: "l'Aube" },
  { num: 114, nom: 'An-Nâs', sens: 'les Hommes' }
];
const LETTRES = ALPHABET.map(l => ({ id: l.id, ar: l.ar, nom: l.nomFr }));
export const MOTS = Object.entries(OBJETS).filter(([id, o]) => o.ar && EMOJIS[id]).map(([id, o]) => ({ id, ar: o.ar, fr: o.fr, emoji: EMOJIS[id] }));
export function questionsLettres(rng = Math.random, n = 6) {
  const tirage = [...LETTRES].sort(() => rng() - 0.5).slice(0, n);
  return tirage.map(l => ({ id: l.id, q: 'Quel est le nom de cette lettre ?', ar: l.ar, choix: avecLeurres(l.nom, LETTRES.map(x => x.nom), 2, rng), exp: `C'est la lettre « ${l.nom} ».` }));
}
export function questionsMots(rng = Math.random, n = 6) {
  const tirage = [...MOTS].sort(() => rng() - 0.5).slice(0, n);
  return tirage.map(m => ({ id: m.id, q: 'Que veut dire ce mot ?', ar: m.ar, choix: avecLeurres(`${m.emoji} ${m.fr}`, MOTS.map(x => `${x.emoji} ${x.fr}`), 2, rng), exp: `Ce mot veut dire « ${m.fr} ».` }));
}
export function questionsSourates(rng = Math.random) {
  const noms = SOURATES.map(s => s.nom), nums = SOURATES.map(s => String(s.num));
  return [
    { q: 'Quelle est la première sourate du Coran ?', choix: avecLeurres('Al-Fâtiha', noms, 2, rng), exp: 'La première sourate est Al-Fâtiha, « l\'Ouverture ».', religieux: true },
    { q: 'Quelle est la dernière sourate du Coran ?', choix: avecLeurres('An-Nâs', noms, 2, rng), exp: 'La dernière sourate est An-Nâs, « les Hommes » : la 114e.', religieux: true },
    { q: 'Quelle sourate porte un nom qui veut dire « l\'Aube » ?', choix: avecLeurres('Al-Falaq', noms, 2, rng), exp: 'Al-Falaq veut dire « l\'Aube ».', religieux: true },
    { q: 'Quel est le numéro de la sourate Al-Ikhlâs ?', choix: avecLeurres('112', nums.concat(['100', '111']), 2, rng), exp: 'Al-Ikhlâs est la 112e sourate.', religieux: true },
    { q: 'Que veut dire le nom « Al-Fâtiha » ?', choix: avecLeurres("l'Ouverture", SOURATES.map(s => s.sens), 2, rng), exp: '« Al-Fâtiha » veut dire « l\'Ouverture ».', religieux: true }
  ];
}