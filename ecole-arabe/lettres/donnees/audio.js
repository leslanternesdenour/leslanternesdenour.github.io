// L'ÉCOLE DES LETTRES ARABES — inventaire AUDIO centralisé (source unique des phrases dites). Chaque phrase : identifiant unique, texte, rôle vocal, langue.
// Voix (outils/voix/jeux/voix-roles.json) : « nour » = la voix réservée à la mascotte de l'école (Maktoub s'exprime avec elle ; aucune voix créée), « loumi », « narratrice ». Seulement les 10 voix « Nour » du compte ; aucune voix créée.
// Les phrases ARABES (noms, sons, mots) sont générées avec la voix de la narratrice en langue arabe : leur prononciation est « À VALIDER » par une personne compétente (jamais considérée comme validée).
// Un audio absent n'est jamais annoncé : le jeu affiche alors le sous-titre et reste jouable (sauf le « son mystérieux », qui attend son audio).
import { LETTRES, CHAPITRES } from './lettres.js?v=3';
import { ALIF } from '../../commun/langue/alphabet.js?v=3';
export const PHRASES = {
  bienvenue: { role: 'nour', texte: "Bonjour ! Je suis Maktoub, ton livre compagnon. Bienvenue à l'école des lettres arabes !" },
  age: { role: 'nour', texte: 'Quel âge as-tu ? Touche ton âge.' },
  placement: { role: 'nour', texte: 'Faisons un petit jeu pour voir les lettres que tu connais déjà. Ce n\'est pas une épreuve !' },
  placement_q: { role: 'nour', texte: 'Quelle est cette lettre ?' },
  placement_fin: { role: 'nour', texte: "Merci ! Maintenant je sais par où commencer. C'est parti !" },
  accueil_porte: { role: 'nour', texte: 'Touche la grande porte pour commencer à apprendre !' },
  salle_jardin: { role: 'nour', texte: 'Voici la salle des vingt-huit lettres !' }, salle_atelier: { role: 'nour', texte: "Voici l'atelier des formes !" }, salle_galerie: { role: 'nour', texte: 'Voici la galerie des sons !' },
  salle_defis: { role: 'nour', texte: 'Voici la salle des défis !' }, salle_palais: { role: 'nour', texte: 'Voici ma bibliothèque !' }, salle_parcours: { role: 'nour', texte: 'Choisis ta prochaine étape.' },
  forme_isolee: { role: 'nour', texte: "Isolée : la lettre toute seule, comme dans l'alphabet." }, forme_initiale: { role: 'nour', texte: "Au début d'un mot : elle s'attache à la lettre qui vient après elle." },
  forme_mediane: { role: 'nour', texte: "Au milieu d'un mot : elle s'attache à la lettre d'avant et à la lettre d'après." }, forme_finale: { role: 'nour', texte: "À la fin d'un mot : elle s'attache à la lettre d'avant." },
  forme_finale_seule: { role: 'nour', texte: "À la fin d'un mot : elle se colle à la lettre d'avant, mais elle ne s'attache jamais à la lettre qui suit." },
  pts_1_dessus: { role: 'nour', texte: 'Elle garde son point au-dessus.' }, pts_1_dessous: { role: 'nour', texte: 'Elle garde son point au-dessous.' }, pts_2_dessus: { role: 'nour', texte: 'Elle garde ses deux points au-dessus.' },
  pts_2_dessous: { role: 'nour', texte: 'Elle garde ses deux points au-dessous.' }, pts_3_dessus: { role: 'nour', texte: 'Elle garde ses trois points au-dessus.' },
  decouvrir: { role: 'nour', texte: 'Touche une lettre pour la découvrir.' },
  chasse: { role: 'nour', texte: 'Trouve la lettre cachée dans le jardin.' },
  formes: { role: 'nour', texte: 'Regarde : la lettre change de forme dans le mot, mais c\'est toujours la même lettre.' },
  formes_q: { role: 'nour', texte: 'Quelle forme va dans la case ?' },
  trace: { role: 'nour', texte: 'Passe ton doigt sur la lettre pour la faire briller.' },
  trace_points: { role: 'nour', texte: 'Maintenant, touche les points.' },
  puzzle: { role: 'nour', texte: 'Remets les morceaux de la lettre à leur place.' },
  son: { role: 'nour', texte: 'Écoute bien, puis touche la bonne lettre.' },
  parcours_sons: { role: 'nour', texte: 'Écoute la suite de sons, puis touche les lettres dans le même ordre.' },
  jumelles: { role: 'nour', texte: 'Ces lettres se ressemblent. Regarde bien leurs points !' },
  intrus: { role: 'nour', texte: "Trouve la lettre qui n'est pas pareille." },
  defi: { role: 'nour', texte: 'Voici le défi de Maktoub : un petit peu de tout ce que tu sais !' },
  bravo: { role: 'nour', texte: 'Bravo !' }, bravo2: { role: 'nour', texte: 'Très bien, tu as de bons yeux !' }, bravo3: { role: 'nour', texte: 'Magnifique, tu as réussi !' },
  encore: { role: 'loumi', texte: 'Essaie encore, tu peux le faire !' }, encore2: { role: 'loumi', texte: 'Regarde bien, tu y es presque.' },
  aide: { role: 'loumi', texte: 'Je te donne un petit coup de pouce.' },
  pause: { role: 'loumi', texte: 'On fait une pause ? Tu peux revenir quand tu veux, tout est gardé.' },
  fin_chapitre: { role: 'nour', texte: 'Bravo ! Tu as terminé ce chapitre. Une nouvelle lanterne s\'allume !' },
  diplome_explorateur: { role: 'nour', texte: "Félicitations ! Tu connais les vingt-huit lettres. Tu as gagné le diplôme d'explorateur des lettres !" },
  diplome_maitre: { role: 'nour', texte: 'Incroyable ! Tu maîtrises toutes les lettres arabes. Tu es un maître des lettres !' }
};
export const BRAVOS = ['bravo', 'bravo2', 'bravo3'], ENCORES = ['encore', 'encore2'];
export function inventaire() {
  const L = []; const add = (id, role, langue, texte, extra = {}) => L.push({ id, role, langue, texte, ...extra });
  for (const [id, p] of Object.entries(PHRASES)) add(id, p.role, 'fr', p.texte);
  add('alif.simple', 'nour', 'fr', ALIF.forme_simple.texte); for (const f of ALIF.formes) add(`alif.${f.id}`, 'nour', 'fr', f.texte); add('alif.hamza', 'nour', 'fr', ALIF.hamza.texte);
  for (const c of CHAPITRES) add(`chap.${c.id}`, 'nour', 'fr', c.intro, { chapitre: c.id });
  for (const l of LETTRES) { add(`nom.${l.id}`, 'narratrice', 'ar', l.nom, { lettre: l.id }); add(`son.${l.id}`, 'narratrice', 'ar', l.syllabeAudio || l.syllabe, { lettre: l.id }); add(`mot.${l.id}`, 'narratrice', 'ar', l.mot.ar, { lettre: l.id }); add(`motfr.${l.id}`, 'narratrice', 'fr', `${l.mot.fr.charAt(0).toUpperCase()}${l.mot.fr.slice(1)}.`, { lettre: l.id }); }
  return L;
}
