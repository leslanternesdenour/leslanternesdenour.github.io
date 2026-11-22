// JEU 2 — « JE DÉCOUVRE LA LECTURE ARABE » : voyelles courtes, syllabes, soukoun, chadda, voyelles longues, mots, phrases.
// Les LETTRES (noms, sons, caractères) viennent de la référence unique commun/langue/alphabet.js : aucune donnée linguistique n'est dupliquée ici.
// Tout le contenu est CORRECT et SIMPLE : mots courants de l'enfant, entièrement vocalisés ; phrases « هَذَا / هَذِهِ + nom » (accord masculin / féminin vérifié).
// ⚠ Aucune prononciation n'est validée : tous les audios arabes restent « à valider » par une personne qui maîtrise l'arabe (statut dans le manifeste audio).
import { PAR_ID_ALPHABET as L } from '../../commun/langue/alphabet.js?v=3';
export const SIGNES = { fatha: 'َ', kasra: 'ِ', damma: 'ُ', soukoun: 'ْ', chadda: 'ّ' };
export const VOYELLES_COURTES = [{ id: 'fatha', lecture: 'a', nom: 'La fatha', texte: 'un petit trait au-dessus de la lettre', pos: 'dessus' }, { id: 'kasra', lecture: 'i', nom: 'La kasra', texte: 'un petit trait au-dessous de la lettre', pos: 'dessous' }, { id: 'damma', lecture: 'ou', nom: 'La damma', texte: 'une petite boucle au-dessus de la lettre', pos: 'dessus' }];
export const LONGUES = [{ id: 'aa', court: 'fatha', ajout: 'ا', lecture: 'aa' }, { id: 'ii', court: 'kasra', ajout: 'ي', lecture: 'ii' }, { id: 'uu', court: 'damma', ajout: 'و', lecture: 'ouu' }];
export const CONS = ['ba', 'ta', 'mim', 'nun', 'sin', 'lam', 'kaf', 'dal', 'ra', 'ha2'];                       // consonnes de départ (sons simples, faciles à entendre)
const son = id => L[id].son === 'ḥ' ? 'h' : L[id].son;
export const SYLLABES = CONS.flatMap(c => VOYELLES_COURTES.map(v => ({ id: `syl.${c}.${v.id}`, cons: c, voy: v.id, ar: L[c].ar + SIGNES[v.id], lecture: son(c) + v.lecture, famille: 'courte' })));
export const SYLLABES_LONGUES = CONS.flatMap(c => LONGUES.map(v => ({ id: `lng.${c}.${v.id}`, cons: c, voy: v.id, ar: L[c].ar + SIGNES[v.court] + v.ajout, lecture: son(c) + v.lecture, famille: 'longue' })));
// soukoun : syllabes fermées (vraies petites mots) ; chadda : lettre doublée
export const SOUKOUN = [{ id: 'sok.man', ar: 'مَنْ', lecture: 'man' }, { id: 'sok.lam', ar: 'لَمْ', lecture: 'lam' }, { id: 'sok.hal', ar: 'هَلْ', lecture: 'hal' }, { id: 'sok.bal', ar: 'بَلْ', lecture: 'bal' }, { id: 'sok.qad', ar: 'قَدْ', lecture: 'qad' }, { id: 'sok.ayn', ar: 'عَنْ', lecture: 'an' }];
export const CHADDA = [{ id: 'chd.umm', ar: 'أُمّ', lecture: 'oumm', fr: 'la maman', emoji: '👩' }, { id: 'chd.jadd', ar: 'جَدّ', lecture: 'jadd', fr: 'le grand-père', emoji: '👴' }, { id: 'chd.dubb', ar: 'دُبّ', lecture: 'doubb', fr: "l'ours", emoji: '🐻' }];
// mots : genre m / f (pour « هَذَا » / « هَذِهِ »)
export const MOTS = [
  { id: 'bab', ar: 'بَاب', tr: 'baab', fr: 'la porte', emoji: '🚪', genre: 'm' }, { id: 'bayt', ar: 'بَيْت', tr: 'bayt', fr: 'la maison', emoji: '🏠', genre: 'm' }, { id: 'shams', ar: 'شَمْس', tr: 'shams', fr: 'le soleil', emoji: '☀️', genre: 'f' },
  { id: 'yad', ar: 'يَد', tr: 'yad', fr: 'la main', emoji: '✋', genre: 'f' }, { id: 'fil', ar: 'فِيل', tr: 'fiil', fr: "l'éléphant", emoji: '🐘', genre: 'm' }, { id: 'asad', ar: 'أَسَد', tr: 'asad', fr: 'le lion', emoji: '🦁', genre: 'm' },
  { id: 'walad', ar: 'وَلَد', tr: 'walad', fr: 'le garçon', emoji: '👦', genre: 'm' }, { id: 'bint', ar: 'بِنْت', tr: 'bint', fr: 'la fille', emoji: '👧', genre: 'f' }, { id: 'kalb', ar: 'كَلْب', tr: 'kalb', fr: 'le chien', emoji: '🐶', genre: 'm' },
  { id: 'jamal', ar: 'جَمَل', tr: 'jamal', fr: 'le chameau', emoji: '🐫', genre: 'm' }, { id: 'qamar', ar: 'قَمَر', tr: 'qamar', fr: 'la lune', emoji: '🌙', genre: 'm' }, { id: 'kitab', ar: 'كِتَاب', tr: 'kitaab', fr: 'le livre', emoji: '📖', genre: 'm' },
  { id: 'maa', ar: 'مَاء', tr: 'maa\'', fr: "l'eau", emoji: '💧', genre: 'm' }, { id: 'warda', ar: 'وَرْدَة', tr: 'warda', fr: 'la rose', emoji: '🌹', genre: 'f' }, { id: 'najma', ar: 'نَجْمَة', tr: 'najma', fr: "l'étoile", emoji: '⭐', genre: 'f' },
  { id: 'samaka', ar: 'سَمَكَة', tr: 'samaka', fr: 'le poisson', emoji: '🐟', genre: 'f' }, { id: 'qitta', ar: 'قِطَّة', tr: 'qitta', fr: 'le chat', emoji: '🐱', genre: 'f' }, { id: 'tuffaha', ar: 'تُفَّاحَة', tr: 'tuffaaha', fr: 'la pomme', emoji: '🍎', genre: 'f' }, { id: 'shajara', ar: 'شَجَرَة', tr: 'shajara', fr: "l'arbre", emoji: '🌳', genre: 'f' }
];
export const MOTS_PAR_ID = Object.fromEntries(MOTS.map(m => [m.id, m]));
const indef = m => m.fr.replace(/^le /, 'un ').replace(/^la /, 'une ').replace(/^l'/, m.genre === 'm' ? 'un ' : 'une ');
export const PHRASES_LECTURE = ['bab', 'kitab', 'qamar', 'shams', 'warda', 'walad', 'bint', 'asad', 'fil', 'jamal', 'qitta', 'najma'].map(id => { const m = MOTS_PAR_ID[id]; return { id: `phr.${id}`, mot: id, ar: (m.genre === 'm' ? 'هَذَا ' : 'هَذِهِ ') + m.ar, fr: 'Voici ' + indef(m) + '.' }; });
// ÉTAPES du parcours (une nouveauté à chaque étape)
export const ETAPES = [
  { id: 'e1', nom: 'La fatha', icone: '➖', pos: 'dessus', type: 'voyelle', voy: 'fatha', intro: 'etape_fatha', salle: 'lettres' },
  { id: 'e2', nom: 'La kasra', icone: '➖', type: 'voyelle', voy: 'kasra', intro: 'etape_kasra', salle: 'formes' },
  { id: 'e3', nom: 'La damma', icone: '⭕', type: 'voyelle', voy: 'damma', intro: 'etape_damma', salle: 'sons' },
  { id: 'e4', nom: 'Soukoun et chadda', icone: '🔘', type: 'signes', intro: 'etape_soukoun', salle: 'defis' },
  { id: 'e5', nom: 'Les voyelles longues', icone: '↔️', type: 'longues', intro: 'etape_longues', salle: 'sons' },
  { id: 'e6', nom: 'Les premiers mots', icone: '📖', type: 'mots', intro: 'etape_mots', salle: 'biblio' },
  { id: 'e7', nom: 'Les premières phrases', icone: '💬', type: 'phrases', intro: 'etape_phrases', salle: 'biblio' }
];
