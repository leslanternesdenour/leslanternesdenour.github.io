// L'ÉCOLE DES LETTRES ARABES — contenu pédagogique : les 28 lettres, leurs noms, leurs sons, un mot d'exemple illustré, les familles de lettres jumelles, les 8 chapitres.
// Les données linguistiques viennent de commun/langue/alphabet.js (référence unique). L'inventaire audio est généré ici : node outils/voix/jeux/inventaire.mjs ecole-lettres). Les contours des lettres viennent de glyphes.json (police Amiri, SIL OFL) : jamais redessinés.
// ⚠ Les noms, sons (descriptions en français), mots vocalisés et translittérations sont à FAIRE VALIDER par une personne compétente en arabe avant d'être considérés comme validés
// (statut « aValider » dans l'inventaire audio). Rien n'est inventé : noms usuels des lettres et mots courants du vocabulaire de l'enfant.
// joint : la lettre se lie à la suivante (false pour ا د ذ ر ز و). points : nombre et position des points (0 = aucun). famille : lettres de même squelette (« jumelles »).
// syllabe : la lettre + fatha, utilisée pour entendre son SON (ex. « بَ » = ba), jamais le nom.
import { ALPHABET } from '../../commun/langue/alphabet.js?v=1';
// Ordre d'apparition dans le parcours (par familles). Les DONNÉES viennent de la référence unique commun/langue/alphabet.js — jamais retapées ici.
const ORDRE = ['alif', 'ba', 'ta', 'tha', 'nun', 'ya', 'jim', 'ha', 'kha', 'dal', 'dhal', 'ra', 'zay', 'sin', 'shin', 'sad', 'dad', 'ta2', 'za2', 'ayn', 'ghayn', 'fa', 'qaf', 'kaf', 'lam', 'mim', 'ha2', 'waw'];
export const LETTRES = ORDRE.map(id => { const a = ALPHABET.find(x => x.id === id); return { id: a.id, num: a.num, ar: a.ar, nom: a.nomAr, nomFr: a.nomFr, translit: a.translit, joint: a.joint, points: a.points, famille: a.famille, syllabe: a.syllabe, son: a.son, sonFr: a.sonFr, mot: a.mot, niveau: a.niveau, chapitre: a.chapitre, audio: a.audio, statut: a.statut }; });
export const PAR_ID = Object.fromEntries(LETTRES.map(l => [l.id, l]));
export const IDS = LETTRES.map(l => l.id);
// Formes de présentation d'une lettre dans glyphes.json : isolee, finale, initiale, mediane (les lettres qui ne se lient pas n'ont que isolee et finale)
export const formesDe = l => (l.joint ? ['isolee', 'initiale', 'mediane', 'finale'] : ['isolee', 'finale']);
export const NOMS_FORMES = { isolee: 'Isolée', initiale: 'Au début', mediane: 'Au milieu', finale: 'À la fin' };

// Les 8 chapitres du Parcours des découvertes : on avance par FAMILLES de lettres (les jumelles se découvrent ensemble : ب ت ث ن ي, ج ح خ…)
export const CHAPITRES = [
  { id: 'c1', nom: 'Les premières lumières', icone: '🏮', lettres: ['alif', 'ba', 'ta', 'tha'], intro: "Bienvenue à l'école de Nour ! Nous allons découvrir les premières lettres : l'alif, le baa, le taa et le thaa. Regarde bien leurs points !" },
  { id: 'c2', nom: 'Les lettres du puits', icone: '🪣', lettres: ['nun', 'ya'], intro: "Voici deux nouvelles lettres : le noun et le yaa. Elles ressemblent à leurs grandes sœurs du baa. Sauras-tu les reconnaître ?" },
  { id: 'c3', nom: 'Les lettres de la dune', icone: '🏜️', lettres: ['jim', 'ha', 'kha'], intro: "Dans le désert, trois lettres se ressemblent : le jim, le haa et le khaa. Elles ont presque la même forme, mais pas les mêmes points !" },
  { id: 'c4', nom: 'Les lettres du jardin', icone: '🌿', lettres: ['dal', 'dhal', 'ra', 'zay'], intro: "Dans le jardin, quatre lettres qui ne s'attachent pas à la suivante : le daal, le dhaal, le raa et le zaay." },
  { id: 'c5', nom: 'Les lettres du marché', icone: '🧺', lettres: ['sin', 'shin', 'sad', 'dad'], intro: "Au marché, on rencontre le siin, le chiin, le saad et le daad. Deux sons doux, deux sons plus graves !" },
  { id: 'c6', nom: 'Les lettres de la bibliothèque', icone: '📚', lettres: ['ta2', 'za2', 'ayn', 'ghayn'], intro: "À la bibliothèque, on découvre des sons de gorge : le taa grave, le zhaa grave, l'aïn et le ghaïn. Écoute bien !" },
  { id: 'c7', nom: 'Les lettres de l\'oasis', icone: '🌴', lettres: ['fa', 'qaf', 'kaf', 'lam'], intro: "À l'oasis, quatre lettres : le faa, le qaaf, le kaaf et le laam. Presque toutes les lettres sont à toi maintenant !" },
  { id: 'c8', nom: 'Les dernières étoiles', icone: '⭐', lettres: ['mim', 'ha2', 'waw'], intro: "Dernier chapitre ! Le miim, le haa léger et le waaw. Après eux, tu connaîtras les vingt-huit lettres arabes !" }
];
// Les 6 espaces de l'école (les activités se répartissent dans ces espaces)
export const ESPACES = {
  jardin: { nom: 'La salle des 28 lettres', icone: '🌷', texte: 'Découvre les lettres qui fleurissent dans le jardin des lettres et retrouve-les cachées.', activites: ['decouvrir', 'chasse'] },
  atelier: { nom: "L'Atelier des formes", icone: '🛠️', texte: 'Fais changer de forme les lettres, trace-les et reconstitue-les.', activites: ['formes', 'trace', 'puzzle'] },
  galerie: { nom: 'La Galerie des sons', icone: '🎧', texte: 'Écoute les sons et retrouve les lettres.', activites: ['son', 'parcours-sons'] },
  palais: { nom: 'La bibliothèque de Nour', icone: '📚', texte: 'Ta collection de lettres, rangée comme des livres précieux, qui brille de plus en plus.', activites: ['collection'] },
  parcours: { nom: 'Le Parcours des découvertes', icone: '🗺️', texte: 'Un chemin en huit chapitres, à ton rythme.', activites: ['chapitre'] },
  defis: { nom: 'La Salle des défis', icone: '🏆', texte: 'Lettres jumelles, intruse et défi de Nour.', activites: ['jumelles', 'intrus', 'defi'] }
};
export const ACTIVITES = {
  decouvrir: { nom: 'Découvrir une lettre', icone: '🌸' }, chasse: { nom: 'La chasse aux lettres', icone: '🔎' }, formes: { nom: 'Les formes de la lettre', icone: '🔄' }, trace: { nom: 'Le tracé magique', icone: '✨' },
  puzzle: { nom: 'Le puzzle des lettres', icone: '🧩' }, son: { nom: 'Le son mystérieux', icone: '🔔' }, 'parcours-sons': { nom: 'Le parcours des sons', icone: '🎶' }, jumelles: { nom: 'Les lettres jumelles', icone: '👯' },
  intrus: { nom: 'La lettre intruse', icone: '🕵️' }, defi: { nom: 'Le défi de Nour', icone: '🌟' }, collection: { nom: 'La collection', icone: '💎' }, chapitre: { nom: 'Le parcours', icone: '🗺️' }
};
// Les trois groupes d'âge (l'âge ne ferme aucune porte : voir competences.js)
export const GROUPES = { 'g34': { nom: '3 – 4 ans', ages: [3, 4] }, 'g56': { nom: '5 – 6 ans', ages: [5, 6] }, 'g710': { nom: '7 – 10 ans', ages: [7, 8, 9, 10] } };
export const groupeDepuisAge = age => { const n = Number(age); return n <= 4 ? 'g34' : n <= 6 ? 'g56' : 'g710'; };
