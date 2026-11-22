// JEU 3 — inventaire AUDIO centralisé. Voix « nour » (réservée à la mascotte Maktoub) pour le français ; « narratrice » pour l'arabe. Aucune voix créée. Audios arabes « à valider ».
import { NOMS, ET_DIZAINE, AUDIOS_NOMBRES } from './chiffres.js?v=3';
export const PHRASES = {
  bienvenue: { role: 'nour', texte: "Bonjour ! Je suis Maktoub. Ici, on apprend les chiffres et les nombres arabes !" }, accueil_porte: { role: 'nour', texte: 'Touche la grande porte pour commencer à compter !' }, age: { role: 'nour', texte: 'Quel âge as-tu ? Touche ton âge.' },
  etape_n1: { role: 'nour', texte: 'Voici les premiers chiffres arabes : zéro, un, deux, trois. Touche-les pour les entendre.' }, etape_n2: { role: 'nour', texte: 'Voici quatre et cinq : comme les doigts de la main !' },
  etape_n3: { role: 'nour', texte: 'Voici six, sept, huit et neuf.' }, etape_n4: { role: 'nour', texte: 'Dix, c’est un et zéro. Tu sais compter jusqu’à dix !' }, etape_n5: { role: 'nour', texte: 'Maintenant, on compte de onze à vingt.' },
  etape_n6: { role: 'nour', texte: 'Les dizaines : trente, quarante, cinquante… jusqu’à cent.' }, etape_n7: { role: 'nour', texte: 'Les grands nombres ! Vingt-trois, c’est trois et vingt.' }, etape_n8: { role: 'nour', texte: 'Maintenant, de petits calculs avec les lanternes !' },
  c_compte: { role: 'nour', texte: 'Compte les objets, puis touche le bon chiffre.' }, c_lire: { role: 'nour', texte: 'Lis le chiffre, puis touche le bon nombre d’objets.' }, c_ecoute: { role: 'nour', texte: 'Écoute le nombre, puis touche le bon chiffre.' },
  c_suite: { role: 'nour', texte: 'Quel nombre vient après ?' }, c_nombre: { role: 'nour', texte: 'Écoute le nombre, puis touche le bon nombre écrit.' }, c_calcul: { role: 'nour', texte: 'Fais le calcul, puis touche le résultat.' },
  salle_ateliers: { role: 'nour', texte: 'Voici les ateliers des nombres !' }, salle_etapes: { role: 'nour', texte: 'Choisis ta prochaine étape.' }, fin_etape: { role: 'nour', texte: "Bravo ! Tu as terminé cette étape. Une nouvelle lanterne s'allume !" },
  bravo: { role: 'nour', texte: 'Bravo !' }, bravo2: { role: 'nour', texte: 'Très bien, tu comptes bien !' }, bravo3: { role: 'nour', texte: 'Magnifique, tu as réussi !' },
  encore: { role: 'loumi', texte: 'Essaie encore, tu peux le faire !' }, encore2: { role: 'loumi', texte: 'Regarde bien, tu y es presque.' }, aide: { role: 'loumi', texte: 'Je te donne un petit coup de pouce.' }
};
export const BRAVOS = ['bravo', 'bravo2', 'bravo3'], ENCORES = ['encore', 'encore2'];
export function inventaire() {
  const L = []; const add = (id, role, langue, texte, extra = {}) => L.push({ id, role, langue, texte, ...extra });
  for (const [id, p] of Object.entries(PHRASES)) add(id, p.role, 'fr', p.texte);
  for (const n of AUDIOS_NOMBRES) add(`nb.${n}`, 'narratrice', 'ar', NOMS[n], { nombre: n });
  for (const [d, t] of Object.entries(ET_DIZAINE)) if (+d >= 20) add(`et.${d}`, 'narratrice', 'ar', t, { nombre: +d });
  return L;
}
