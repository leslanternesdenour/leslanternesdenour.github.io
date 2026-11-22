// JEU 2 — inventaire AUDIO centralisé (source unique des phrases dites). Voix : « nour » (voix réservée à la mascotte Maktoub) pour le français ; « narratrice » pour l'arabe (langue 'ar'). Aucune voix créée.
// Les audios arabes sont « à valider » (prononciationVerifiee = false) tant qu'une personne qui maîtrise l'arabe ne les a pas écoutés.
import { SYLLABES, SYLLABES_LONGUES, SOUKOUN, CHADDA, MOTS, PHRASES_LECTURE } from './lecture.js?v=3';
export const PHRASES = {
  bienvenue: { role: 'nour', texte: "Bonjour ! Je suis Maktoub. Ici, on apprend à lire en arabe !" }, accueil_porte: { role: 'nour', texte: 'Touche la grande porte pour commencer à lire !' },
  age: { role: 'nour', texte: 'Quel âge as-tu ? Touche ton âge.' },
  etape_fatha: { role: 'nour', texte: 'Voici la fatha : un petit trait au-dessus de la lettre. Elle fait « a ».' }, etape_kasra: { role: 'nour', texte: 'Voici la kasra : un petit trait au-dessous de la lettre. Elle fait « i ».' },
  etape_damma: { role: 'nour', texte: 'Voici la damma : une petite boucle au-dessus de la lettre. Elle fait « ou ».' }, etape_soukoun: { role: 'nour', texte: 'Voici le soukoun : un petit rond. Il veut dire : pas de voyelle. Et la chadda double la lettre.' },
  etape_longues: { role: 'nour', texte: 'Les voyelles longues : on tient le son plus longtemps.' }, etape_mots: { role: 'nour', texte: 'Maintenant, on lit des mots !' }, etape_phrases: { role: 'nour', texte: 'Maintenant, on lit des phrases !' },
  c_atelier: { role: 'nour', texte: 'Touche une lettre, puis un signe, pour fabriquer une syllabe.' }, c_lire: { role: 'nour', texte: 'Lis la syllabe, puis touche le bon son.' }, c_ecoute: { role: 'nour', texte: 'Écoute, puis touche la bonne syllabe.' },
  c_mot: { role: 'nour', texte: 'Lis le mot, puis touche la bonne image.' }, c_phrase: { role: 'nour', texte: 'Lis la phrase, puis touche la bonne image.' }, c_signes: { role: 'nour', texte: 'Écoute, puis touche le bon mot.' },
  salle_ateliers: { role: 'nour', texte: 'Voici les ateliers de lecture !' }, salle_etapes: { role: 'nour', texte: 'Choisis ta prochaine étape.' }, fin_etape: { role: 'nour', texte: "Bravo ! Tu as terminé cette étape. Une nouvelle lanterne s'allume !" },
  bravo: { role: 'nour', texte: 'Bravo !' }, bravo2: { role: 'nour', texte: 'Très bien, tu lis bien !' }, bravo3: { role: 'nour', texte: 'Magnifique, tu as réussi !' },
  encore: { role: 'loumi', texte: 'Essaie encore, tu peux le faire !' }, encore2: { role: 'loumi', texte: 'Regarde bien, tu y es presque.' }, aide: { role: 'loumi', texte: 'Je te donne un petit coup de pouce.' }
};
export const BRAVOS = ['bravo', 'bravo2', 'bravo3'], ENCORES = ['encore', 'encore2'];
export function inventaire() {
  const L = []; const add = (id, role, langue, texte, extra = {}) => L.push({ id, role, langue, texte, ...extra });
  for (const [id, p] of Object.entries(PHRASES)) add(id, p.role, 'fr', p.texte);
  for (const s of SYLLABES) add(s.id, 'narratrice', 'ar', s.ar, { lettre: s.cons }); for (const s of SYLLABES_LONGUES) add(s.id, 'narratrice', 'ar', s.ar, { lettre: s.cons });
  for (const s of SOUKOUN) add(s.id, 'narratrice', 'ar', s.ar); for (const s of CHADDA) add(s.id, 'narratrice', 'ar', s.ar);
  for (const m of MOTS) add(`mot.${m.id}`, 'narratrice', 'ar', m.ar); for (const p of PHRASES_LECTURE) add(p.id, 'narratrice', 'ar', p.ar);
  return L;
}
